const { loadState, updateState } = require('../storage/local');
const { isValidContentId, isValidGameState } = require('./model');

// 页面只读取副本，避免绕过统一存储入口修改游戏状态。
function getGameState() {
  return loadState().gameState;
}

// 所有游戏状态写入均经本地仓库和结构校验；仅供剧情、奖励等业务模块调用。
function updateGameState(change) {
  const state = updateState((draft) => {
    change(draft.gameState);
    if (!isValidGameState(draft.gameState)) {
      throw new Error('游戏状态结构无效');
    }
  });
  return state.gameState;
}

// 检查内容 ID，后续由内容发布流程确保 ID 唯一与版本稳定。
function requireId(id) {
  if (!isValidContentId(id)) {
    throw new Error('内容 ID 格式无效');
  }
}

// 等级和星星由未来规则层计算，此处只接受非负的确定数值。
function setPlayerLevel(level) {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error('玩家等级必须是正整数');
  }
  return updateGameState((draft) => { draft.playerLevel = level; });
}

function setStars(stars) {
  if (!Number.isInteger(stars) || stars < 0) {
    throw new Error('星星数量必须是非负整数');
  }
  return updateGameState((draft) => { draft.stars = stars; });
}

// 地图与任务使用稳定 ID 去重，重复事件不会重复增加记录。
function unlockMap(mapId) {
  requireId(mapId);
  return updateGameState((draft) => {
    if (draft.unlockedMapIds.indexOf(mapId) === -1) {
      draft.unlockedMapIds.push(mapId);
    }
  });
}

function completeTask(taskId) {
  requireId(taskId);
  return updateGameState((draft) => {
    if (draft.completedTaskIds.indexOf(taskId) === -1) {
      draft.completedTaskIds.push(taskId);
    }
  });
}

// 章节只保存进度事实；故事节点内容由独立剧情数据模块提供。
function setChapterProgress(chapterId, status, currentNodeId) {
  requireId(chapterId);
  if (['not_started', 'in_progress', 'completed'].indexOf(status) === -1 ||
      (currentNodeId !== null && !isValidContentId(currentNodeId))) {
    throw new Error('章节进度无效');
  }
  return updateGameState((draft) => {
    draft.chapterProgress[chapterId] = {
      status,
      currentNodeId,
      updatedAt: new Date().toISOString()
    };
  });
}

module.exports = {
  getGameState,
  updateGameState,
  setPlayerLevel,
  setStars,
  unlockMap,
  setChapterProgress,
  completeTask
};
