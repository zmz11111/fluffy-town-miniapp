const { TUANTUAN } = require('./pet');
const { loadState, updateState } = require('../storage/local');

// 页面通过角色模块读取状态，不依赖本地存储字段的位置。
function getTuantuanState() {
  return loadState().petState;
}

// 点击团团时只更新本地互动状态；不把点击次数转换为学习成绩。
function interactWithTuantuan() {
  const state = updateState((draft) => {
    draft.petState.petId = TUANTUAN.id;
    draft.petState.interactionCount += 1;
    draft.petState.mood = 'happy';
    draft.petState.lastInteractedAt = new Date().toISOString();
  });
  return state.petState;
}

module.exports = { getTuantuanState, interactWithTuantuan };
