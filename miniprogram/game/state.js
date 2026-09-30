const { loadState, updateState } = require('../storage/local');
const { isValidContentId, isValidGameState } = require('./model');
const { deriveStarGrowth, buildStarFeedback } = require('./star-growth');

// 页面只读取副本，避免绕过统一存储入口修改游戏状态。
function getGameState() {
  const state = loadState().gameState;
  return Object.assign(state, { starGrowth: deriveStarGrowth(state.stars) });
}

// 首页消费展示记录；多次返回首页不重复庆祝，写入失败可在下次重试。
function consumeStarGrowthFeedback() {
  const state = loadState().gameState;
  const feedback = buildStarFeedback(state);
  const seenIds = state.rewards.seenStarRewardIds;
  if (seenIds === undefined || JSON.stringify(seenIds) !== JSON.stringify(feedback.seenStarRewardIds)) {
    updateGameState((draft) => { draft.rewards.seenStarRewardIds = feedback.seenStarRewardIds; });
  }
  return feedback;
}

// 所有游戏状态写入均经本地仓库和结构校验；仅供剧情、奖励等业务模块调用。
function updateGameState(change) {
  const state = updateState((draft) => {
    // 领域模块可在同一次保存中同步学习状态；页面不使用写入回调。
    change(draft.gameState, draft);
    if (!isValidGameState(draft.gameState)) {
      throw new Error('游戏状态结构无效');
    }
  });
  return Object.assign(state.gameState, { starGrowth: deriveStarGrowth(state.gameState.stars) });
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
  const now = new Date().toISOString();
  return updateGameState((draft) => { recordTaskCompletedInState(draft, taskId, now); });
}

// 任务完成事实与伙伴反应一起登记，重复完成不会再次改动伙伴情绪。
function recordTaskCompletedInState(draft, taskId, timestamp) {
  requireId(taskId);
  if (draft.completedTaskIds.indexOf(taskId) === -1) {
    draft.completedTaskIds.push(taskId);
    draft.companions.tuantuan.emotion = 'happy';
    recordStudyDayInState(draft, timestamp || new Date().toISOString());
  }
}

// 日期格式兼容较旧的微信小程序运行环境。
function formatDatePart(value) {
  return value < 10 ? `0${value}` : String(value);
}

// 仅在任务实际完成时记录学习日期，供伙伴连续学习问候使用。
function recordStudyDayInState(gameState, timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new Error('学习日期无效');
  }
  const month = formatDatePart(date.getMonth() + 1);
  const day = formatDatePart(date.getDate());
  const dateKey = `${date.getFullYear()}-${month}-${day}`;
  const studyDayKeys = Array.isArray(gameState.studyDayKeys) ? gameState.studyDayKeys.slice() : [];
  if (studyDayKeys.indexOf(dateKey) === -1) {
    studyDayKeys.push(dateKey);
  }
  gameState.studyDayKeys = studyDayKeys.sort().slice(-30);
  return gameState.studyDayKeys;
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
  consumeStarGrowthFeedback,
  updateGameState,
  setPlayerLevel,
  setStars,
  unlockMap,
  setChapterProgress,
  completeTask,
  recordTaskCompletedInState,
  recordStudyDayInState
};
