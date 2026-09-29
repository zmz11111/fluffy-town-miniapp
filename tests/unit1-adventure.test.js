const test = require('node:test');
const assert = require('node:assert/strict');

// 用内存适配器模拟小程序存储，不接触测试者的真实档案。
const memoryStorage = Object.create(null);
global.wx = {
  getStorageSync(key) {
    return memoryStorage[key];
  },
  setStorageSync(key, value) {
    memoryStorage[key] = JSON.parse(JSON.stringify(value));
  }
};

const { STORAGE_KEY, createInitialState } = require('../miniprogram/storage/local');
const { getGameState } = require('../miniprogram/game/state');
const { CHAPTER_001 } = require('../miniprogram/story/chapters/chapter_001');
const { CHAPTER_UNIT1 } = require('../miniprogram/story/chapters/chapter_unit1');
const { CHAPTER_WELCOME } = require('../miniprogram/story/chapters/chapter_welcome');
const { UNIT1_PREVIEW } = require('../miniprogram/curriculum/unit1/preview-content');
const { WELCOME_PREVIEW, WELCOME_DAILY_PLAN } = require('../miniprogram/curriculum/welcome/preview-content');
const story = require('../miniprogram/story/story-manager');
const learning = require('../miniprogram/english/unit1-learning');
const welcomeLearning = require('../miniprogram/english/welcome-learning');
const { getLearningState, getNextCourseEntry } = require('../miniprogram/english/learning-state');
const greetings = require('../miniprogram/games/unit1-greetings/game-manager');
const { INTERACTION_COOLDOWN_MS, MAX_DAILY_INTERACTIONS, interactWithTuantuan } = require('../miniprogram/pets/interaction');
const { updateState } = require('../miniprogram/storage/local');

function resetStorage() {
  memoryStorage[STORAGE_KEY] = createInitialState();
}

// 自动推进对白，直到出现当前章节要求完成的任务门槛。
function advanceUntilTaskRequired() {
  for (let index = 0; index < 24; index += 1) {
    const current = story.getCurrentStory();
    assert.ok(current, '预期故事游标仍然存在');
    if (!current.isLastDialogue) {
      story.advanceStory();
      continue;
    }
    const result = story.advanceStory();
    if (result.status === 'task_required') {
      return result;
    }
  }
  throw new Error('没有遇到任务门槛');
}

function completeWelcomeChapter() {
  story.startChapter(CHAPTER_WELCOME.id);
  const taskGate = advanceUntilTaskRequired();
  assert.equal(taskGate.taskId, WELCOME_PREVIEW.taskId);
  const firstView = welcomeLearning.startTask();
  assert.equal(firstView.stepIndex, 0);
  assert.equal(firstView.step.kind, 'learn-vocabulary');
  assert.deepEqual(firstView.step.vocabulary.map((word) => word.english), ['hello', 'hi', 'name']);
  assert.equal(welcomeLearning.chooseStep('seen-vocabulary').completed, false);
  assert.equal(getLearningState().currentTaskId, WELCOME_PREVIEW.taskId);
  const wrongIntroduction = welcomeLearning.chooseStep('hello');
  assert.equal(wrongIntroduction.correct, false);
  assert.equal(welcomeLearning.getTaskView().stepIndex, 1);
  assert.equal(welcomeLearning.getTaskView().step.kind, 'practice-sentence');
  assert.equal(welcomeLearning.chooseStep('my-name-is').completed, false);
  assert.equal(welcomeLearning.getTaskView().stepIndex, 2);
  assert.equal(welcomeLearning.getTaskView().step.kind, 'listen-and-identify');
  assert.equal(welcomeLearning.chooseStep('hello').completed, false);
  assert.equal(welcomeLearning.getTaskView().stepIndex, 3);
  assert.equal(welcomeLearning.getTaskView().step.kind, 'companion-interaction');
  const companionInteraction = interactWithTuantuan();
  assert.equal(companionInteraction.feedbackLevel, 'high');
  assert.equal(welcomeLearning.completeInteractionStep(companionInteraction).completed, true);
  assert.ok(getGameState().completedTaskIds.includes(WELCOME_PREVIEW.taskId));
  assert.equal(getLearningState().taskProgressById[WELCOME_PREVIEW.taskId].status, 'completed');
  assert.equal(WELCOME_DAILY_PLAN.activities.map((item) => item.type).join(','), 'new-word-learning,sentence-practice,listening-task,companion-interaction');
  while (story.getCurrentStory()) {
    const result = story.advanceStory();
    assert.notEqual(result.status, 'task_required');
  }
  assert.ok(getLearningState().completedUnitIds.includes(WELCOME_PREVIEW.unitId));
  assert.equal(getNextCourseEntry().chapterId, CHAPTER_UNIT1.id);
  assert.equal(getLearningState().currentChapterId, CHAPTER_UNIT1.id);
}

test('Unit 1 完成核心学习、问候游戏、故事奖励和团团互动', () => {
  resetStorage();
  assert.equal(getNextCourseEntry().chapterId, CHAPTER_WELCOME.id);
  assert.throws(() => story.startChapter(CHAPTER_UNIT1.id), /请先和团团完成 Welcome/);
  completeWelcomeChapter();
  assert.throws(() => learning.startLearningTask(), /请先在故事里/);

  updateState((draft) => {
    draft.petState.lastInteractedAt = new Date(Date.now() - INTERACTION_COOLDOWN_MS - 10).toISOString();
  });
  const interaction = interactWithTuantuan();
  assert.equal(interaction.interactionCount, 0, '旧互动次数不再增长');
  assert.equal(interaction.interactionAccepted, true);
  assert.equal(interaction.feedbackLevel, 'low', '当天第一次互动已有 Welcome 任务提供高反馈');
  assert.equal(interaction.dailyInteractionCount, 2);
  const repeatedInteraction = interactWithTuantuan();
  assert.equal(repeatedInteraction.interactionAccepted, false, '冷却期间连点不重复写入');
  assert.equal(repeatedInteraction.lastInteractedAt, interaction.lastInteractedAt);
  assert.equal(getGameState().stars, 0, '角色互动不影响星星');

  story.startChapter(CHAPTER_UNIT1.id);
  assert.equal(story.getCurrentStory().chapter.id, CHAPTER_UNIT1.id);
  const coreGate = advanceUntilTaskRequired();
  assert.equal(coreGate.taskId, UNIT1_PREVIEW.coreTaskId);

  const lessonView = learning.startLearningTask();
  assert.equal(lessonView.status, 'playing');
  assert.equal(lessonView.options.length, 2);
  const wrongOption = lessonView.options.find((option) => option.id !== UNIT1_PREVIEW.coreTask.correctOptionId);
  const wrongResult = learning.chooseIntroduction(wrongOption.id);
  assert.equal(wrongResult.correct, false);
  assert.equal(getGameState().currentGame.wrongAttempts, 1);
  const correctResult = learning.chooseIntroduction(UNIT1_PREVIEW.coreTask.correctOptionId);
  assert.equal(correctResult.completed, true);
  assert.ok(getGameState().completedTaskIds.includes(UNIT1_PREVIEW.coreTaskId));

  const gameGate = advanceUntilTaskRequired();
  assert.equal(gameGate.taskId, UNIT1_PREVIEW.gameTaskId);
  const firstRound = greetings.startGame();
  assert.equal(firstRound.status, 'playing');
  assert.equal(Object.prototype.hasOwnProperty.call(firstRound, 'correctOptionId'), false);
  const wrongGreeting = firstRound.options.find((option) => option.id !== 'hello');
  assert.equal(greetings.chooseGreetingCard(wrongGreeting.id).correct, false);
  assert.equal(greetings.chooseGreetingCard('hello').completed, false);
  const secondRound = greetings.getGameView();
  assert.equal(secondRound.roundNumber, 2);
  assert.equal(greetings.chooseGreetingCard('hi').completed, true);
  assert.equal(getGameState().stars, 0, '小游戏完成时不提前发放章节奖励');

  while (story.getCurrentStory()) {
    const result = story.advanceStory();
    assert.notEqual(result.status, 'task_required');
  }
  let state = getGameState();
  assert.equal(state.chapterProgress[CHAPTER_UNIT1.id].status, 'completed');
  assert.equal(state.stars, 1);
  assert.ok(state.rewards.claimedRewardIds.includes(UNIT1_PREVIEW.rewardId));
  assert.equal(state.companions.mimi.unlocked, false, 'Unit 1 不重复解锁米米');

  story.startChapter(CHAPTER_UNIT1.id);
  state = getGameState();
  assert.equal(state.stars, 1, '重复进入已完成章节不会重复领奖');
});

test('团团每日互动达到上限后停止计数，隔日恢复首次高反馈', () => {
  resetStorage();
  const accepted = [];
  for (let index = 0; index < MAX_DAILY_INTERACTIONS; index += 1) {
    if (index > 0) {
      updateState((draft) => {
        draft.petState.lastInteractedAt = new Date(Date.now() - INTERACTION_COOLDOWN_MS - 10).toISOString();
      });
    }
    accepted.push(interactWithTuantuan());
  }
  assert.equal(accepted[0].feedbackLevel, 'high');
  assert.ok(accepted.slice(1).every((entry) => entry.feedbackLevel === 'low'));
  assert.equal(accepted[MAX_DAILY_INTERACTIONS - 1].dailyInteractionCount, MAX_DAILY_INTERACTIONS);

  const capped = interactWithTuantuan();
  assert.equal(capped.interactionAccepted, false);
  assert.equal(capped.dailyLimitReached, true);
  assert.equal(capped.remainingDailyInteractions, 0);
  assert.equal(getGameState().stars, 0);

  updateState((draft) => {
    draft.petState.dailyInteractionDate = '2000-01-01';
    draft.petState.dailyInteractionCount = MAX_DAILY_INTERACTIONS;
    draft.petState.lastInteractedAt = new Date(Date.now() - INTERACTION_COOLDOWN_MS - 10).toISOString();
  });
  const nextDay = interactWithTuantuan();
  assert.equal(nextDay.interactionAccepted, true);
  assert.equal(nextDay.dailyInteractionCount, 1);
  assert.equal(nextDay.feedbackLevel, 'high');
});

test('旧版本地档案缺少每日互动字段时可从当天第一次互动补齐', () => {
  resetStorage();
  delete memoryStorage[STORAGE_KEY].petState.dailyInteractionDate;
  delete memoryStorage[STORAGE_KEY].petState.dailyInteractionCount;

  const interaction = interactWithTuantuan();
  const savedPetState = memoryStorage[STORAGE_KEY].petState;
  assert.equal(interaction.interactionAccepted, true);
  assert.equal(interaction.feedbackLevel, 'high');
  assert.equal(savedPetState.dailyInteractionCount, 1);
  assert.ok(savedPetState.dailyInteractionDate);
});

// 课程默认入口改为 Welcome；旧饼干章节仍可通过明确章节 ID 继续体验。
test('旧版饼干章节仍可被明确选择且不丢游标', () => {
  resetStorage();
  story.startChapter(CHAPTER_001.id);
  assert.equal(story.getCurrentStory().chapter.id, CHAPTER_001.id);
  assert.equal(story.getCurrentStory().scene.id, CHAPTER_001.firstSceneId);
  assert.throws(() => story.startChapter(CHAPTER_UNIT1.id), /请先继续当前冒险/);
  assert.equal(story.getCurrentStory().chapter.id, CHAPTER_001.id, '切换失败时保留旧故事游标');
});
