const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const memoryStorage = Object.create(null);
const navigationRequests = [];
global.wx = {
  getStorageSync(key) {
    return memoryStorage[key];
  },
  setStorageSync(key, value) {
    memoryStorage[key] = JSON.parse(JSON.stringify(value));
  },
  setNavigationBarTitle() {},
  createInnerAudioContext() {
    return {
      src: '',
      onError() {},
      stop() {},
      play() {}
    };
  },
  navigateTo(options) { navigationRequests.push(options.url); },
  reLaunch() {}
};

const { STORAGE_KEY, PREVIOUS_STORAGE_KEY, createInitialState, loadState } = require('../miniprogram/storage/local');
const { CHAPTER_001 } = require('../miniprogram/story/chapters/chapter_001');
const { CHAPTER_UNIT1 } = require('../miniprogram/story/chapters/chapter_unit1');
const { CHAPTER_WELCOME } = require('../miniprogram/story/chapters/chapter_welcome');
const story = require('../miniprogram/story/story-manager');
const { getLearningState, getNextCourseEntry, completeWelcomeSession } = require('../miniprogram/english/learning-state');
const { getGameState } = require('../miniprogram/game/state');
const welcomeLearning = require('../miniprogram/english/welcome-learning');
const { WELCOME_PREVIEW, WELCOME_SESSIONS, WELCOME_DAILY_PLAN } = require('../miniprogram/curriculum/welcome/preview-content');
const curriculum = require('../miniprogram/curriculum/curriculum-manager');
const { WELCOME_UNIT_ID, UNIT1_UNIT_ID } = require('../miniprogram/english/learning-state-model');

function resetStorage() {
  Object.keys(memoryStorage).forEach((key) => { delete memoryStorage[key]; });
  memoryStorage[STORAGE_KEY] = createInitialState();
  navigationRequests.length = 0;
}

// 只有七节任务登记齐全部五项目标后，正式课程规则才允许进入 Unit 1。
function completeWelcomeForTest() {
  WELCOME_SESSIONS.forEach((session) => {
    completeWelcomeSession(session.taskId, session.objectiveIdsToComplete || []);
  });
}

function loadPageDefinition(pagePath) {
  let pageDefinition;
  const previousPage = global.Page;
  global.Page = (definition) => { pageDefinition = definition; };
  delete require.cache[pagePath];
  require(pagePath);
  global.Page = previousPage;
  return pageDefinition;
}

test('v4 空档案迁移后从 Welcome 开始且保留旧键', () => {
  resetStorage();
  delete memoryStorage[STORAGE_KEY];
  const oldState = createInitialState();
  oldState.schemaVersion = 4;
  delete oldState.learningState;
  oldState.gameState.stars = 3;
  memoryStorage[PREVIOUS_STORAGE_KEY] = oldState;

  const migrated = loadState();
  assert.equal(migrated.schemaVersion, 5);
  assert.equal(migrated.gameState.stars, 3);
  assert.equal(migrated.learningState.currentUnitId, 'wj-g3-v1:welcome');
  assert.equal(getNextCourseEntry().chapterId, CHAPTER_WELCOME.id);
  assert.equal(memoryStorage[PREVIOUS_STORAGE_KEY].schemaVersion, 4);
});

test('v4 已进入 Unit 1 的档案迁移后不重新锁定旧玩家', () => {
  resetStorage();
  delete memoryStorage[STORAGE_KEY];
  const oldState = createInitialState();
  oldState.schemaVersion = 4;
  delete oldState.learningState;
  oldState.gameState.chapterProgress[CHAPTER_UNIT1.id] = {
    status: 'in_progress', currentNodeId: CHAPTER_UNIT1.firstSceneId, updatedAt: new Date().toISOString()
  };
  oldState.gameState.currentStory = {
    chapterId: CHAPTER_UNIT1.id, sceneId: CHAPTER_UNIT1.firstSceneId, dialogueIndex: 0
  };
  memoryStorage[PREVIOUS_STORAGE_KEY] = oldState;

  const migrated = loadState();
  assert.equal(migrated.gameState.currentStory.chapterId, CHAPTER_UNIT1.id);
  assert.ok(migrated.learningState.prerequisiteBypassUnitIds.includes('wj-g3-v1:welcome'));
  assert.equal(migrated.learningState.completedUnitIds.includes('wj-g3-v1:welcome'), false);
  assert.equal(migrated.learningState.currentUnitId, 'wj-g3-v1:unit-1');
  assert.equal(getLearningState().currentChapterId, CHAPTER_UNIT1.id);
  assert.equal(getNextCourseEntry().chapterId, CHAPTER_WELCOME.id, '旧版先修豁免不改变正式课程入口');
  story.startChapter(CHAPTER_UNIT1.id);
  assert.equal(story.getCurrentStory().chapter.id, CHAPTER_UNIT1.id, '旧版进行中的冒险仍可继续');
});

// 无参数路径必须遵循课程先修顺序，只有明确参数才进入旧章节。
test('无参数故事入口按 Welcome → Unit 1 选择课程章节', () => {
  resetStorage();
  const pagePath = path.resolve(__dirname, '../miniprogram/pages/story/story.js');
  const pageDefinition = loadPageDefinition(pagePath);
  const page = Object.assign({}, pageDefinition);

  page.onLoad({});
  assert.equal(page.chapterId, CHAPTER_WELCOME.id, '首次无参数入口必须进入 Welcome');
  completeWelcomeForTest();
  assert.equal(getLearningState().completedUnitIds.includes(WELCOME_UNIT_ID), true);
  page.onLoad({});
  assert.equal(page.chapterId, CHAPTER_UNIT1.id, '完成 Welcome 后无参数入口进入 Unit 1');
  page.onLoad({ chapterId: CHAPTER_001.id });
  assert.equal(page.chapterId, CHAPTER_001.id, '明确选择的旧章节仍可进入');
});

// 伙伴页的旧剧情入口也必须先经过 Welcome，再恢复旧剧情入口。
test('米米入口和空故事页不会绕过 Welcome', () => {
  resetStorage();
  const pagePath = path.resolve(__dirname, '../miniprogram/pages/pets/pets.js');
  const pageDefinition = loadPageDefinition(pagePath);
  const page = Object.assign({}, pageDefinition);
  page.data = JSON.parse(JSON.stringify(pageDefinition.data));
  page.setData = function setData(update) { Object.assign(this.data, update); };

  page.refresh();
  assert.equal(page.data.welcomeCompleted, false);
  page.openStory();
  assert.equal(navigationRequests.at(-1), `/pages/story/story?chapterId=${CHAPTER_WELCOME.id}`);
  assert.equal(page.data.welcomeCompleted, false, 'Welcome 未完成前米米入口不能绕过课程门槛');
  const { updateState } = require('../miniprogram/storage/local');
  // 旧的“完成单元”标记不能代替目标证据；先确认仍锁在 Welcome。
  updateState((draft) => { draft.learningState.completedUnitIds.push(WELCOME_UNIT_ID); });
  page.refresh();
  assert.equal(page.data.welcomeCompleted, false, '没有 Welcome 目标证据不能绕过课程门槛');
  completeWelcomeForTest();
  page.refresh();
  page.openStory();
  assert.equal(navigationRequests.at(-1), `/pages/story/story?chapterId=${CHAPTER_001.id}`,
    'Welcome 完成后米米页恢复既有第一章剧情入口');

  const gamePath = path.resolve(__dirname, '../miniprogram/pages/games/games.js');
  const gameDefinition = loadPageDefinition(gamePath);
  const gamePage = Object.assign({}, gameDefinition);
  gamePage.openStory();
  assert.equal(navigationRequests.at(-1), `/pages/story/story?chapterId=${CHAPTER_UNIT1.id}`,
    '完成Welcome后，小游戏的空入口进入Unit 1');
});

test('完成 Welcome 第1节仍保留课程顺序，不提前开放 Unit 1', () => {
  resetStorage();
  assert.equal(getNextCourseEntry().chapterId, CHAPTER_WELCOME.id);
  assert.throws(() => story.startChapter(CHAPTER_UNIT1.id), /请先和团团完成 Welcome/);

  story.startChapter(CHAPTER_WELCOME.id);
  assert.equal(story.advanceStory().status, 'advanced');
  assert.equal(story.advanceStory().status, 'task_required');
  const view = welcomeLearning.startTask();
  assert.equal(view.step.kind, 'greeting-input');
  assert.deepEqual(view.step.vocabulary.map((entry) => entry.id), [
    'wj-g3-v1:welcome:hello', 'wj-g3-v1:welcome:hi'
  ]);

  const helloId = 'wj-g3-v1:welcome:hello';
  const hiId = 'wj-g3-v1:welcome:hi';
  assert.equal(welcomeLearning.completeGreetingInputStep().correct, false);
  welcomeLearning.markGreetingVocabularyAudioPlayed(helloId);
  assert.equal(welcomeLearning.completeGreetingInputStep().correct, false);
  welcomeLearning.markGreetingVocabularyAudioPlayed(hiId);
  assert.equal(welcomeLearning.completeGreetingInputStep().correct, true);
  assert.equal(welcomeLearning.chooseStep(hiId).correct, false, '先播放听力题后才能选择');
  welcomeLearning.markCurrentAudioPlayed();
  assert.equal(welcomeLearning.chooseStep(hiId).correct, true);
  assert.equal(welcomeLearning.getTaskView().step.kind, 'sentence-build');

  ['session-01-hi', 'session-01-im', 'session-01-mimi'].forEach((tileId) => {
    welcomeLearning.selectSentenceBuildTile(tileId);
  });
  assert.equal(welcomeLearning.getTaskView().step.kind, 'companion-interaction');
  const interactionResult = require('../miniprogram/pets/interaction').interactWithTuantuan();
  const completion = welcomeLearning.completeInteractionStep(interactionResult);
  assert.equal(completion.completed, true);
  assert.equal(getGameState().stars, 1);
  assert.equal(loadState().learningState.taskProgressById[WELCOME_PREVIEW.taskId].status, 'completed');

  assert.equal(story.advanceStory().status, 'advanced');
  assert.equal(story.advanceStory().status, 'advanced');
  assert.equal(story.advanceStory().status, 'chapter_completed');
  assert.equal(getLearningState().completedUnitIds.includes(WELCOME_PREVIEW.unitId), false);
  assert.equal(getNextCourseEntry().chapterId, CHAPTER_WELCOME.id);
  assert.throws(() => story.startChapter(CHAPTER_UNIT1.id), /请先和团团完成 Welcome/);
});

test('故事推进有连点锁，完成页只保留一个出口按钮', () => {
  resetStorage();
  story.startChapter(CHAPTER_WELCOME.id);

  const pagePath = path.resolve(__dirname, '../miniprogram/pages/story/story.js');
  const pageDefinition = loadPageDefinition(pagePath);

  const page = Object.assign({}, pageDefinition);
  page.data = JSON.parse(JSON.stringify(pageDefinition.data));
  page.chapterId = CHAPTER_WELCOME.id;
  page.actionBusy = false;
  page.setData = function setData(update) { Object.assign(this.data, update); };
  const originalDialogueIndex = story.getCurrentStory().dialogueIndex;
  page.next();
  const afterFirstTap = story.getCurrentStory().dialogueIndex;
  page.next();
  assert.equal(afterFirstTap, originalDialogueIndex + 1);
  assert.equal(story.getCurrentStory().dialogueIndex, afterFirstTap, '快速第二次点击不会多推进一段对白');
  page.clearActionTimer();

  const template = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/story/story.wxml'), 'utf8');
  assert.equal((template.match(/bindtap="finishAction"/g) || []).length, 1);
  assert.doesNotMatch(template, /showSecondaryFinishAction|bindtap="backHome"/);

  const learnTemplate = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/learn/learn.wxml'), 'utf8');
  assert.equal((learnTemplate.match(/bindtap="backHome"/g) || []).length, 2, '知识页和测试词卡各有一个首页出口');
  assert.equal((learnTemplate.match(/bindtap="backToStory"/g) || []).length, 4, 'Welcome 与 Unit 1 的完成/等待状态各有一个出口');
  const gamesTemplate = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/games/games.wxml'), 'utf8');
  assert.equal((gamesTemplate.match(/bindtap="backStory"/g) || []).length, 2, '两个小游戏完成状态各有一个故事出口');
  assert.equal((gamesTemplate.match(/bindtap="openStory"/g) || []).length, 2, '两个小游戏锁定状态各有一个故事入口');
  const petsTemplate = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/pets/pets.wxml'), 'utf8');
  assert.doesNotMatch(petsTemplate, /返回树屋|回到首页|bindtap="backHome"/);
  const homeTemplate = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  assert.doesNotMatch(homeTemplate, /返回树屋|回到首页|bindtap="backHome"/);
});

test('课程词库数据可展示但不会自动成为每日任务', () => {
  const welcome = curriculum.getUnitKnowledgePackage(WELCOME_UNIT_ID);
  const unit1 = curriculum.getUnitKnowledgePackage(UNIT1_UNIT_ID);
  assert.equal(welcome.vocabulary.length, 27);
  assert.equal(welcome.sentences.length, 21);
  assert.equal(welcome.objectives.length, 5);
  assert.equal(unit1.vocabulary.length, 40);
  assert.equal(unit1.sentences.length, 14);
  assert.equal(unit1.objectives.length, 4);
  assert.ok(welcome.vocabulary.every((item) => item.dailyTaskEligible === false));
  assert.ok(unit1.vocabulary.every((item) => item.dailyTaskEligible === false));
  assert.equal(new Set(unit1.vocabulary.map((item) => item.id)).size, 40);
  assert.equal(unit1.vocabulary.filter((item) => item.english.toLowerCase() === 'here').length, 2);
  assert.ok(unit1.vocabulary.every((item) => item.source && item.source.sourceFile && item.source.pdfPage && item.source.locator));
  assert.deepEqual(WELCOME_DAILY_PLAN.activities.map((item) => item.type), [
    'new-word-learning', 'sentence-practice', 'listening-task', 'companion-interaction'
  ]);
  assert.equal(WELCOME_DAILY_PLAN.openingMinutes + WELCOME_DAILY_PLAN.closingMinutes +
    WELCOME_DAILY_PLAN.activities.reduce((total, item) => total + item.durationMinutes, 0), 15);
});

// 对照教材来源元数据核验 Welcome 内容，防止词条漏项或页码回退。
test('Welcome教材词汇、句型、目标和原书位置齐全', () => {
  const curriculumDir = path.resolve(__dirname, '../miniprogram/curriculum/welcome');
  const unitInfo = JSON.parse(fs.readFileSync(path.join(curriculumDir, 'unit-info.json'), 'utf8'));
  const vocabulary = JSON.parse(fs.readFileSync(path.join(curriculumDir, 'vocabulary.json'), 'utf8'));
  const sentences = JSON.parse(fs.readFileSync(path.join(curriculumDir, 'sentences.json'), 'utf8'));
  const objectives = JSON.parse(fs.readFileSync(path.join(curriculumDir, 'learning-objectives.json'), 'utf8'));
  const dailyPlan = JSON.parse(fs.readFileSync(path.join(curriculumDir, 'daily-plan.json'), 'utf8'));

  assert.equal(vocabulary.entryCount, 27);
  assert.deepEqual(vocabulary.entries.map((entry) => entry.printedEnglish), [
    'hi', 'be (am, is, are)', 'what', 'your', 'name', 'hello', 'my', 'goodbye', 'have', 'a(an)',
    'nice', 'day', 'good', 'morning', 'Ms', 'stand', 'stand up', 'sit', 'sit down', 'open', 'book',
    'close', 'point', 'say', 'read', 'listen', 'write'
  ]);
  assert.deepEqual(vocabulary.entries.find((entry) => entry.id.endsWith(':a-an')).forms, ['a', 'an']);
  assert.ok(vocabulary.entries.every((entry) => entry.reviewStatus === 'pending_human_review' &&
    entry.source.sourcePositionCheck === 'verified_by_visual_pdf' && entry.source.pdfPage && entry.source.locator));

  assert.equal(sentences.entries.length, 21);
  const sentenceTexts = sentences.entries.map((entry) => entry.text);
  ['What\'s your name?', 'My name is …', "I'm …", 'Stand up!', 'Open your book!',
    'Close your book!', 'Sit down!', 'Listen, point and say.'].forEach((text) => assert.ok(sentenceTexts.includes(text)));
  assert.ok(sentences.entries.every((entry) => entry.reviewStatus === 'pending_human_review' &&
    (entry.sourceReferences || (entry.source ? [entry.source] : [])).length > 0));
  assert.ok(sentences.entries.every((entry) => (entry.sourceReferences || [entry.source]).every((source) =>
    source.sourcePositionCheck === 'verified_by_visual_pdf' && source.pdfPage && source.locator)));

  const formalGoals = objectives.objectives.filter((entry) => /^teacher-book-core-objective-[1-3]$/.test(entry.basis));
  assert.equal(formalGoals.length, 3);
  assert.ok(objectives.objectives.some((entry) => entry.id === 'recognize-letters'));
  assert.ok(objectives.objectives.every((entry) => entry.reviewStatus === 'pending_human_review' &&
    entry.sourceReferences.length > 0 && entry.sourceReferences.every((source) =>
      source.sourcePositionCheck === 'verified_by_visual_pdf' && source.pdfPage && source.locator)));
  assert.equal(unitInfo.nextUnitId, UNIT1_UNIT_ID);
  assert.equal(unitInfo.reviewStatus, 'pending_human_review');
  assert.ok(unitInfo.sourceReferences.some((source) => source.documentId === 'teacher-book' && source.pdfPage === 5));
  const vocabularyIds = new Set(vocabulary.entries.map((entry) => entry.id));
  const sentenceIds = new Set(sentences.entries.map((entry) => entry.id));
  const objectiveIds = new Set(objectives.objectives.map((entry) => entry.id));
  dailyPlan.activities.forEach((activity) => {
    (activity.vocabularyIds || []).forEach((id) => assert.ok(vocabularyIds.has(id), `每日任务引用缺失词条：${id}`));
    (activity.sentenceIds || []).forEach((id) => assert.ok(sentenceIds.has(id), `每日任务引用缺失句型：${id}`));
    (activity.objectiveIds || []).forEach((id) => assert.ok(objectiveIds.has(id), `每日任务引用缺失目标：${id}`));
  });
});

test('课程知识页可切换 Welcome 和 Unit 1，且不写每日任务进度', () => {
  resetStorage();
  const pagePath = path.resolve(__dirname, '../miniprogram/pages/learn/learn.js');
  const pageDefinition = loadPageDefinition(pagePath);
  const page = Object.assign({}, pageDefinition);
  page.data = JSON.parse(JSON.stringify(pageDefinition.data));
  page.setData = function setData(update) { Object.assign(this.data, update); };
  page.onLoad({ mode: 'course-library' });
  const before = JSON.stringify(getLearningState());
  page.onShow();
  assert.equal(page.data.knowledgeVocabulary.length, 3, 'Welcome 只展示当前已释放的词汇');
  assert.equal(page.data.knowledgeSentences.length, 2, 'Welcome 只展示当前已释放的句型');
  page.selectKnowledgeUnit({ currentTarget: { dataset: { unitId: UNIT1_UNIT_ID } } });
  assert.equal(page.data.knowledgeVocabulary.length, 3, '未完成 Welcome 时仍只展示已释放的 Welcome 内容');
  assert.equal(page.data.knowledgeUnitId, WELCOME_UNIT_ID, '未完成 Welcome 时不能切换到 Unit 1 知识页');
  assert.equal(JSON.stringify(getLearningState()), before, '查看或切换知识展示不改学习任务状态');

  const homePath = path.resolve(__dirname, '../miniprogram/pages/home/home.js');
  const homeDefinition = loadPageDefinition(homePath);
  const home = Object.assign({}, homeDefinition);
  home.data = JSON.parse(JSON.stringify(homeDefinition.data));
  home.actionBusy = false;
  home.setData = function setData(update) { Object.assign(this.data, update); };
  home.startAdventure();
  assert.equal(navigationRequests[navigationRequests.length - 1], `/pages/story/story?chapterId=${CHAPTER_WELCOME.id}`);
  home.openWords();
  assert.equal(navigationRequests[navigationRequests.length - 1], '/pages/learn/learn?mode=course-library');

  const { updateState } = require('../miniprogram/storage/local');
  completeWelcomeForTest();
  page.onShow();
  assert.equal(page.data.knowledgeVocabulary.length, 27, 'Welcome 目标完成后开放完整 Welcome 知识库');
  assert.equal(page.data.knowledgeSentences.length, 19, 'Welcome 全量课程知识包包含19条已发布句型');
  page.selectKnowledgeUnit({ currentTarget: { dataset: { unitId: UNIT1_UNIT_ID } } });
  const afterUnlock = JSON.stringify(getLearningState());
  assert.equal(page.data.knowledgeVocabulary.length, 40);
  assert.equal(page.data.knowledgeSentences.length, 14);
  assert.equal(JSON.stringify(getLearningState()), afterUnlock);
});
