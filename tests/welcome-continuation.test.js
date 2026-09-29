const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const memoryStorage = Object.create(null);
const navigationRequests = [];
global.wx = {
  getStorageSync(key) { return memoryStorage[key]; },
  setStorageSync(key, value) { memoryStorage[key] = JSON.parse(JSON.stringify(value)); },
  setNavigationBarTitle() {},
  navigateTo(options) { navigationRequests.push(options.url); },
  createInnerAudioContext() {
    return { onError() {}, stop() {}, play() {}, set src(value) { this.source = value; } };
  },
  reLaunch() {}
};

const { STORAGE_KEY, createInitialState, updateState } = require('../miniprogram/storage/local');
const { WELCOME_PREVIEW } = require('../miniprogram/curriculum/welcome/preview-content');
const { WELCOME_UNIT_ID, UNIT1_UNIT_ID, UNIT1_CHAPTER_ID } = require('../miniprogram/english/learning-state-model');
const { getLearningState } = require('../miniprogram/english/learning-state');
const { getWelcomeProgress } = require('../miniprogram/english/welcome-learning');

function resetStorage() {
  Object.keys(memoryStorage).forEach((key) => { delete memoryStorage[key]; });
  memoryStorage[STORAGE_KEY] = createInitialState();
  navigationRequests.length = 0;
}

function loadPageDefinition(pagePath) {
  let definition;
  const previousPage = global.Page;
  global.Page = (value) => { definition = value; };
  delete require.cache[pagePath];
  require(pagePath);
  global.Page = previousPage;
  return definition;
}

test('第1节完成后首页继续 Welcome 会进入第2节并显示相同进度', () => {
  resetStorage();
  const firstSession = WELCOME_PREVIEW.sessions[0];
  const secondSession = WELCOME_PREVIEW.sessions[1];
  const completedAt = '2026-09-29T00:01:00.000Z';

  // 模拟旧存档：首节已完成，但课程游标仍停在 Unit 1。
  updateState((draft) => {
    draft.learningState.taskProgressById[firstSession.taskId] = {
      status: 'completed',
      stepIndex: firstSession.steps.length - 1,
      startedAt: '2026-09-29T00:00:00.000Z',
      completedAt,
      updatedAt: completedAt
    };
    draft.learningState.currentUnitId = UNIT1_UNIT_ID;
    draft.learningState.currentChapterId = UNIT1_CHAPTER_ID;
  });

  const homePath = path.resolve(__dirname, '../miniprogram/pages/home/home.js');
  const homeDefinition = loadPageDefinition(homePath);
  const home = Object.assign({}, homeDefinition, {
    data: JSON.parse(JSON.stringify(homeDefinition.data)),
    actionBusy: false,
    setData(update) { Object.assign(this.data, update); }
  });
  home.startAdventure();

  const expectedUrl = `/pages/learn/learn?mode=welcome&taskId=${encodeURIComponent(secondSession.taskId)}`;
  assert.equal(navigationRequests.at(-1), expectedUrl);
  const query = new URLSearchParams(expectedUrl.split('?')[1]);

  const learnPath = path.resolve(__dirname, '../miniprogram/pages/learn/learn.js');
  const learnDefinition = loadPageDefinition(learnPath);
  const learn = Object.assign({}, learnDefinition, {
    data: JSON.parse(JSON.stringify(learnDefinition.data)),
    setData(update) { Object.assign(this.data, update); }
  });
  learn.onLoad({ mode: query.get('mode'), taskId: query.get('taskId') });
  learn.onShow();

  const homeProgress = getWelcomeProgress();
  assert.equal(homeProgress.completedSessions, 1);
  assert.equal(homeProgress.currentSessionIndex, 2);
  assert.equal(learn.data.welcomeStatus, 'playing');
  assert.equal(learn.data.welcomeSessionNumber, homeProgress.currentSessionIndex);
  assert.equal(learn.data.welcomeTotalSessions, homeProgress.totalSessions);
  assert.equal(learn.data.welcomeTitle, secondSession.title);
  assert.equal(getLearningState().currentUnitId, WELCOME_UNIT_ID);
});