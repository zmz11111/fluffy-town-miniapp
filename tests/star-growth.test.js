const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// 内存存储模拟奖励落盘及提示写入失败，避免改动真实用户档案。
const memory = Object.create(null);
let failWrites = false;
global.wx = {
  getStorageSync(key) { return memory[key]; },
  setStorageSync(key, value) {
    if (failWrites) throw new Error('模拟写入失败');
    memory[key] = JSON.parse(JSON.stringify(value));
  }
};
const { STORAGE_KEY, createInitialState, loadState, updateState } = require('../miniprogram/storage/local');
const { deriveStarGrowth } = require('../miniprogram/game/star-growth');
const { getGameState, setStars, consumeStarGrowthFeedback } = require('../miniprogram/game/state');
const { applyReward } = require('../miniprogram/reward/reward-manager');
const { isWelcomeCompleted } = require('../miniprogram/english/learning-state');

function reset() {
  Object.keys(memory).forEach((key) => { delete memory[key]; });
  memory[STORAGE_KEY] = createInitialState();
  failWrites = false;
}

function homePage() {
  let definition;
  const previous = global.Page;
  global.Page = (value) => { definition = value; };
  const filename = path.resolve(__dirname, '../miniprogram/pages/home/home.js');
  delete require.cache[filename];
  try { require(filename); } finally { global.Page = previous; }
  return Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(value) { Object.assign(this.data, value); }
  });
}

test('0、10、20 星边界正确，成长阶段从星星恢复且不解锁教材', () => {
  reset();
  const learningBefore = loadState().learningState;
  [[0, 'ordinary'], [9, 'ordinary'], [10, 'lit'], [19, 'lit'], [20, 'decorated'], [100, 'decorated']].forEach(([stars, stage]) => {
    setStars(stars);
    assert.equal(getGameState().starGrowth.stage, stage);
    assert.equal(getGameState().starGrowth.lightsOn, stars >= 10);
    assert.equal(getGameState().starGrowth.decorationsOn, stars >= 20);
    assert.equal(Object.prototype.hasOwnProperty.call(loadState().gameState, 'starGrowth'), false, '不重复持久化成长等级');
  });
  assert.equal(deriveStarGrowth(9).starsToNextStage, 1);
  assert.equal(deriveStarGrowth(19).starsToNextStage, 1);
  assert.equal(deriveStarGrowth(20).nextThreshold, null);
  assert.equal(isWelcomeCompleted(), false);
  assert.deepEqual(loadState().learningState, learningBefore);
  setStars(0);
  assert.equal(getGameState().starGrowth.stage, 'ordinary', '测试清档后不会保留高阶段');
});

test('新星星只提示一次，跨越阶段提示灯光及装饰，不重复领奖', () => {
  reset();
  setStars(9);
  applyReward('wj-g3-v1:welcome:reward-session-01-star');
  let feedback = consumeStarGrowthFeedback();
  assert.equal(feedback.amount, 1);
  assert.equal(feedback.stageChanged, true);
  assert.match(feedback.message, /灯亮/);
  assert.equal(consumeStarGrowthFeedback().visible, false);
  applyReward('wj-g3-v1:welcome:reward-session-01-star');
  assert.equal(consumeStarGrowthFeedback().visible, false);
  assert.equal(getGameState().stars, 10);
  setStars(19);
  applyReward('wj-g3-v1:welcome:reward-session-02-star');
  feedback = consumeStarGrowthFeedback();
  assert.match(feedback.message, /装饰/);
  assert.equal(feedback.amount, 1);
  assert.equal(getGameState().stars, 20);
  applyReward('demo-grade-3:reward-item-001');
  assert.equal(consumeStarGrowthFeedback().visible, false, '物品奖励不伪造星星获得');
});

test('未读奖励可跨存档恢复，提示写入失败不改变星星且允许重试', () => {
  reset();
  applyReward('demo-grade-3:reward-star-001');
  // 序列化后重新读取，等价于关闭应用后的本地存档恢复。
  memory[STORAGE_KEY] = JSON.parse(JSON.stringify(memory[STORAGE_KEY]));
  const before = loadState();
  failWrites = true;
  assert.throws(() => consumeStarGrowthFeedback(), /模拟写入失败/);
  assert.deepEqual(loadState(), before);
  failWrites = false;
  assert.equal(consumeStarGrowthFeedback().amount, 2);
  const saved = loadState();
  assert.deepEqual(saved.gameState.rewards.claimedRewardIds, before.gameState.rewards.claimedRewardIds);
  assert.equal(saved.gameState.stars, before.gameState.stars);
  assert.equal(consumeStarGrowthFeedback().visible, false);
});

test('旧档首次加载不重播历史奖励，后续奖励仍可正常反馈', () => {
  reset();
  applyReward('demo-grade-3:reward-star-001');
  updateState((draft) => { delete draft.gameState.rewards.seenStarRewardIds; });
  assert.equal(consumeStarGrowthFeedback().visible, false);
  applyReward('wj-g3-v1:welcome:reward-session-01-star');
  assert.equal(consumeStarGrowthFeedback().amount, 1);
});

test('首页反映成长与新星星，图片失败及重复返回不改变奖励', () => {
  reset();
  const home = homePage();
  home.onShow();
  assert.equal(home.data.starGrowth.stage, 'ordinary');
  home.onHide();
  setStars(9);
  applyReward('wj-g3-v1:welcome:reward-session-01-star');
  try {
    home.onShow();
    assert.equal(home.data.starGrowth.lightsOn, true);
    assert.equal(home.data.starFeedbackAmount, 1);
    assert.equal(home.data.showStarFeedback, true);
    home.onSceneImageError();
    assert.equal(home.data.starGrowth.lightsOn, true);
    home.onHide();
    home.onShow();
    assert.equal(home.data.showStarFeedback, false);
    assert.equal(home.data.stars, 10);
    home.onHide();
    setStars(20);
    home.onShow();
    assert.equal(home.data.starGrowth.decorationsOn, true);
    assert.equal(home.data.showStarFeedback, false, '单改数字只改变树屋阶段，不伪造星星奖励');
  } finally {
    home.onUnload();
  }
});
