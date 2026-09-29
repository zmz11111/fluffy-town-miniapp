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
const { UNIT1_PREVIEW } = require('../miniprogram/curriculum/unit1/preview-content');
const story = require('../miniprogram/story/story-manager');
const learning = require('../miniprogram/english/unit1-learning');
const greetings = require('../miniprogram/games/unit1-greetings/game-manager');
const { interactWithTuantuan } = require('../miniprogram/pets/interaction');

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

test('Unit 1 完成核心学习、问候游戏、故事奖励和团团互动', () => {
  resetStorage();
  assert.throws(() => learning.startLearningTask(), /请先在故事里/);

  const interaction = interactWithTuantuan();
  assert.equal(interaction.interactionCount, 1);

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

test('旧版饼干章节仍可从默认故事入口启动', () => {
  resetStorage();
  story.startChapter(CHAPTER_001.id);
  assert.equal(story.getCurrentStory().chapter.id, CHAPTER_001.id);
  assert.equal(story.getCurrentStory().scene.id, CHAPTER_001.firstSceneId);
  assert.throws(() => story.startChapter(CHAPTER_UNIT1.id), /请先继续当前冒险/);
  assert.equal(story.getCurrentStory().chapter.id, CHAPTER_001.id, '切换失败时保留旧故事游标');
});
