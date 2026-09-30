const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// 模拟微信持久存储并注入写入失败，不接触真实开发存档。
const memory = Object.create(null);
let failWrites = false;
let writes = 0;
global.wx = {
  getStorageSync(key) { return memory[key]; },
  setStorageSync(key, value) {
    writes += 1;
    if (failWrites) throw new Error('模拟存储失败');
    memory[key] = JSON.parse(JSON.stringify(value));
  },
  setNavigationBarTitle() {}
};

const { STORAGE_KEY, createInitialState, loadState } = require('../miniprogram/storage/local');
const { getGameState } = require('../miniprogram/game/state');
const { CHAPTER_001 } = require('../miniprogram/story/chapters/chapter_001');
const { CHAPTER_WELCOME } = require('../miniprogram/story/chapters/chapter_welcome');
const story = require('../miniprogram/story/story-manager');
const welcome = require('../miniprogram/english/welcome-learning');
const { WELCOME_PREVIEW } = require('../miniprogram/curriculum/welcome/preview-content');
const { isWelcomeCompleted } = require('../miniprogram/english/learning-state');
const { interactWithTuantuan } = require('../miniprogram/pets/interaction');
const { getCharacterOverview } = require('../miniprogram/pets/character-manager');
const { getStoryAvatar } = require('../miniprogram/assets/visuals');
const cookie = require('../miniprogram/games/find-cookie/game-manager');
const { ROUND_DEFINITIONS } = require('../miniprogram/games/find-cookie/data');
const { normalizeScene, getScenePresentation } = require('../miniprogram/story/scene-model');

function reset() {
  Object.keys(memory).forEach((key) => { delete memory[key]; });
  memory[STORAGE_KEY] = createInitialState();
  failWrites = false;
  writes = 0;
}

function page(name) {
  let definition;
  const previous = global.Page;
  global.Page = (value) => { definition = value; };
  const filename = path.resolve(__dirname, `../miniprogram/pages/${name}/${name}.js`);
  delete require.cache[filename];
  try { require(filename); } finally { global.Page = previous; }
  return Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(value) { Object.assign(this.data, value); }
  });
}

function prepareWelcomeFinalStep() {
  story.startChapter(CHAPTER_WELCOME.id);
  welcome.startTask();
  const step = welcome.getTaskView().step;
  step.requiredAudioVocabularyIds.forEach(welcome.markGreetingVocabularyAudioPlayed);
  welcome.completeGreetingInputStep();
  welcome.markCurrentAudioPlayed();
  const session = WELCOME_PREVIEW.sessions[0];
  const listening = session.steps.find((item) => item.kind === 'listen-and-identify');
  welcome.chooseStep(listening.correctOptionId);
  const sentence = session.steps.find((item) => item.kind === 'sentence-build');
  sentence.correctTileIds.forEach(welcome.selectSentenceBuildTile);
  assert.equal(welcome.getTaskView().step.kind, 'companion-interaction');
}

test('Welcome 任务完成、团团状态与星星一次保存，失败重试不丢进度', () => {
  reset();
  prepareWelcomeFinalStep();
  const interaction = interactWithTuantuan();
  const before = loadState();
  failWrites = true;
  assert.throws(() => welcome.completeInteractionStep(interaction), /模拟存储失败/);
  assert.deepEqual(loadState(), before);
  failWrites = false;
  writes = 0;
  assert.equal(welcome.completeInteractionStep(interaction).completed, true);
  assert.equal(writes, 1);
  const state = getGameState();
  assert.equal(state.companions.tuantuan.emotion, 'happy');
  assert.equal(state.stars, 1);
  assert.equal(isWelcomeCompleted(), false, '首课完成不会提前解锁 Unit 1');
  const home = page('home');
  home.onShow();
  const pets = page('pets');
  pets.onShow();
  assert.equal(home.data.stars, state.stars);
  assert.equal(pets.data.stars, state.stars);
  assert.equal(home.data.tuantuanVisual.src, getStoryAvatar('tuantuan', pets.data.tuantuan.emotion).src);
});

test('听音找图末轮与奖励原子保存，章节完成和米米解锁不出现部分写入', () => {
  reset();
  story.startChapter(CHAPTER_001.id);
  let reachedLastLine = false;
  for (let index = 0; index < 40; index += 1) {
    const current = story.getCurrentStory();
    if (current.scene.nextSceneId === null && current.isLastDialogue) {
      reachedLastLine = true;
      break;
    }
    const result = story.advanceStory();
    if (result.status === 'task_required') {
      cookie.startGame();
      ROUND_DEFINITIONS.slice(0, -1).forEach((round) => cookie.chooseImage(round.correctWordId));
      const before = loadState();
      failWrites = true;
      assert.throws(() => cookie.chooseImage(ROUND_DEFINITIONS.at(-1).correctWordId), /模拟存储失败/);
      assert.deepEqual(loadState(), before);
      failWrites = false;
      writes = 0;
      cookie.chooseImage(ROUND_DEFINITIONS.at(-1).correctWordId);
      assert.equal(writes, 1);
      assert.equal(getGameState().stars, 2);
      assert.equal(getCharacterOverview().tuantuan.emotion, 'happy');
    }
  }
  assert.equal(reachedLastLine, true);
  const before = loadState();
  failWrites = true;
  assert.throws(() => story.advanceStory(), /模拟存储失败/);
  assert.deepEqual(loadState(), before);
  assert.equal(getCharacterOverview().mimi.unlocked, false);
  failWrites = false;
  writes = 0;
  assert.equal(story.advanceStory().status, 'chapter_completed');
  assert.equal(writes, 1);
  assert.equal(getGameState().chapterProgress[CHAPTER_001.id].status, 'completed');
  assert.equal(getGameState().stars, 7);
  const pets = page('pets');
  pets.onShow();
  const storyPage = page('story');
  storyPage.chapterId = CHAPTER_001.id;
  storyPage.refreshStory();
  assert.equal(pets.data.mimi.unlocked, true);
  assert.equal(storyPage.data.mimiUnlocked, true);
  assert.equal(pets.data.stars, storyPage.data.stars);
  storyPage.chapterId = CHAPTER_WELCOME.id;
  storyPage.refreshStory();
  assert.equal(storyPage.data.mimiUnlocked, pets.data.mimi.unlocked);
  assert.equal(storyPage.data.showMimiUnlockReward, false, 'Welcome 不显示其他章节的伙伴奖励');
  const after = loadState();
  story.startChapter(CHAPTER_001.id);
  assert.deepEqual(loadState(), after, '重进章节不重复发放星星或改变伙伴友谊');
});

test('Welcome 引导剧情与学习完成同步保存，同时仍要求七课教学目标', () => {
  reset();
  prepareWelcomeFinalStep();
  welcome.completeInteractionStep(interactWithTuantuan());
  for (let index = 0; index < 10; index += 1) {
    const current = story.getCurrentStory();
    if (current.scene.nextSceneId === null && current.isLastDialogue) break;
    story.advanceStory();
  }
  const before = loadState();
  failWrites = true;
  assert.throws(() => story.advanceStory(), /模拟存储失败/);
  assert.deepEqual(loadState(), before);
  failWrites = false;
  writes = 0;
  story.advanceStory();
  assert.equal(writes, 1);
  const saved = loadState();
  assert.equal(saved.gameState.chapterProgress[CHAPTER_WELCOME.id].status, 'completed');
  assert.equal(saved.learningState.chapterProgressById[CHAPTER_WELCOME.id].status, 'in_progress');
  assert.equal(isWelcomeCompleted(), false);
});

test('场景 v1 支持背景、角色与对白表情，图片失败保持课程状态', () => {
  reset();
  const legacy = require('../miniprogram/story/scenes/scene_001').SCENE_001;
  const beforeLegacy = JSON.parse(JSON.stringify(legacy));
  assert.equal(normalizeScene(legacy).sceneVersion, 1);
  assert.deepEqual(legacy, beforeLegacy);
  const scene = story.getScene(CHAPTER_WELCOME.sceneIds[1]);
  const presentation = getScenePresentation(scene, { speakerId: 'tuantuan', expression: 'surprise' });
  assert.equal(presentation.characters.find((actor) => actor.characterId === 'tuantuan').expression, 'surprise');
  [presentation.background, ...presentation.characters].forEach((visual) => {
    assert.equal(fs.existsSync(path.resolve(__dirname, '../miniprogram', '.' + visual.src)), true);
  });
  const invalid = JSON.parse(JSON.stringify(scene));
  invalid.presentation.backgroundId = 'missing-background';
  assert.throws(() => normalizeScene(invalid), /表现数据无效/);
  invalid.presentation = scene.presentation;
  invalid.sceneVersion = 2;
  assert.throws(() => normalizeScene(invalid), /版本不支持/);
  story.startChapter(CHAPTER_WELCOME.id);
  const storyPage = page('story');
  storyPage.chapterId = CHAPTER_WELCOME.id;
  storyPage.refreshStory();
  assert.equal(storyPage.data.sceneCharacters.length, 1);
  const saved = loadState();
  storyPage.onSceneCharacterError({ currentTarget: { dataset: { characterId: 'tuantuan' } } });
  assert.equal(storyPage.data.sceneCharacters[0].imageFailed, true);
  assert.deepEqual(loadState(), saved);
});
