const { TUANTUAN } = require('./pet');
const { MIMI } = require('./mimi');
const { getGameState, updateGameState } = require('../game/state');

// 角色页读取静态设定与个人状态的合并视图，不直接访问本地存储。
function getCharacterOverview() {
  const companions = getGameState().companions;
  return {
    tuantuan: { ...TUANTUAN, emotion: companions.tuantuan.emotion },
    mimi: {
      ...MIMI,
      unlocked: companions.mimi.unlocked,
      friendship: companions.mimi.friendship,
      storyProgress: companions.mimi.storyProgress
    }
  };
}

// 解锁后可与米米打招呼；友谊值仅用于本章展示，不与答题对错挂钩。
function greetMimi() {
  const state = updateGameState((draft) => {
    if (!draft.companions.mimi.unlocked) {
      throw new Error('米米尚未加入');
    }
    draft.companions.mimi.friendship = Math.min(99, draft.companions.mimi.friendship + 1);
  });
  return state.companions.mimi;
}

module.exports = { getCharacterOverview, greetMimi };
