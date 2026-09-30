const test = require('node:test');
const assert = require('node:assert/strict');

const memory = Object.create(null);
let platform = 'devtools';
let envVersion = 'develop';
global.wx = {
  getStorageSync(key) { return memory[key]; },
  setStorageSync(key, value) { memory[key] = JSON.parse(JSON.stringify(value)); },
  getAccountInfoSync() { return { miniProgram: { envVersion } }; },
  getSystemInfoSync() { return { platform }; }
};

const { STORAGE_KEY, createInitialState, loadState, updateState } = require('../miniprogram/storage/local');
const { getNextCourseEntry, isWelcomeCompleted } = require('../miniprogram/english/learning-state');
const { getWelcomeProgress } = require('../miniprogram/english/welcome-learning');
const { WELCOME_SESSIONS } = require('../miniprogram/curriculum/welcome/preview-content');
const { UNIT1_UNIT_ID, WELCOME_UNIT_ID } = require('../miniprogram/english/learning-state-model');
const debug = require('../miniprogram/debug/debug-manager');

function reset() {
  Object.keys(memory).forEach((key) => { delete memory[key]; });
  memory[STORAGE_KEY] = createInitialState();
  platform = 'devtools';
  envVersion = 'develop';
}

test('调试课次与正式 Welcome 门槛保持一致，奖励可回退且不会重复累加', () => {
  reset();
  assert.equal(debug.getSnapshot().nextLesson, 1);
  assert.equal(getNextCourseEntry().unitId, WELCOME_UNIT_ID);
  debug.jumpToWelcomeLesson(2);
  assert.equal(getWelcomeProgress().completedSessions, 1);
  assert.equal(debug.getSnapshot().nextLesson, 2);
  assert.equal(loadState().gameState.stars, 1);
  assert.equal(isWelcomeCompleted(), false);
  debug.completeCurrentLesson();
  assert.equal(getWelcomeProgress().completedSessions, 2);
  assert.equal(loadState().gameState.stars, 2);
  debug.jumpToWelcomeLesson(2);
  assert.equal(loadState().gameState.stars, 1);
  assert.equal(loadState().gameState.rewards.claimedRewardIds.filter((id) => id === WELCOME_SESSIONS[0].adventure.rewardId).length, 1);
  debug.unlockUnit1ForTest();
  assert.equal(isWelcomeCompleted(), true);
  assert.equal(getNextCourseEntry().unitId, UNIT1_UNIT_ID);
  assert.equal(loadState().gameState.stars, 7);
  debug.resetWelcome();
  assert.equal(isWelcomeCompleted(), false);
  assert.equal(getNextCourseEntry().unitId, WELCOME_UNIT_ID);
  assert.equal(loadState().gameState.stars, 0);
});

test('清理操作作用范围独立，保留伙伴好感且重置互动计数', () => {
  reset();
  updateState((draft) => {
    draft.petState.affinity = 8;
    draft.petState.dailyInteractionCount = 4;
    draft.petState.dailyInteractionDate = new Date().toISOString().slice(0, 10);
    draft.gameState.companions.mimi.friendship = 5;
    draft.gameState.companions.mimi.dailyGreetingCount = 2;
  });
  debug.unlockUnit1ForTest();
  debug.clearCompanionInteractions();
  assert.equal(loadState().petState.dailyInteractionCount, 0);
  assert.equal(loadState().petState.affinity, 8);
  assert.equal(loadState().gameState.companions.mimi.friendship, 5);
  assert.equal(loadState().gameState.companions.mimi.dailyGreetingCount, 0);
  assert.equal(isWelcomeCompleted(), true);
  debug.clearLearningSave();
  assert.equal(isWelcomeCompleted(), false);
  assert.equal(loadState().gameState.stars, 0);
  assert.equal(loadState().petState.affinity, 8);
});

test('回退 Welcome 清除旧故事游标，同时保留其他章节的星星', () => {
  reset();
  debug.unlockUnit1ForTest();
  updateState((draft) => {
    draft.gameState.stars += 5;
    draft.gameState.currentStory = {
      chapterId: 'wj-g3-v1:unit-1:chapter-first-adventure',
      sceneId: 'wj-g3-v1:unit-1:scene-001',
      dialogueIndex: 0
    };
  });
  debug.jumpToWelcomeLesson(1);
  assert.equal(loadState().gameState.stars, 5);
  assert.equal(loadState().gameState.currentStory, null);
  assert.equal(getNextCourseEntry().unitId, WELCOME_UNIT_ID);
});

test('正式环境与真机环境均拒绝所有调试写入', () => {
  reset();
  const before = JSON.stringify(loadState());
  envVersion = 'release';
  assert.equal(debug.isDevTools(), false);
  assert.throws(() => debug.resetWelcome(), /DEV ONLY/);
  assert.throws(() => debug.getSnapshot(), /DEV ONLY/);
  platform = 'ios';
  envVersion = 'develop';
  assert.throws(() => debug.unlockUnit1ForTest(), /DEV ONLY/);
  assert.throws(() => debug.clearLearningSave(), /DEV ONLY/);
  assert.throws(() => debug.clearCompanionInteractions(), /DEV ONLY/);
  assert.equal(JSON.stringify(loadState()), before);
});
