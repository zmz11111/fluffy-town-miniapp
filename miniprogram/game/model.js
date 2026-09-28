/**
 * 游戏状态只记录玩家进度，不在这里定义星星奖励或地图解锁玩法。
 * 章节、地图和任务 ID 必须在内容包中保持稳定，并包含课程命名空间。
 * @typedef {{status: 'not_started'|'in_progress'|'completed', currentNodeId: string|null, updatedAt: string|null}} ChapterProgress
 * @typedef {{playerLevel: number, stars: number, unlockedMapIds: string[], chapterProgress: Object<string, ChapterProgress>, completedTaskIds: string[]}} GameState
 */

// 创建独立的初始状态，避免多个档案共享可变数组或对象。
function createInitialGameState() {
  return {
    playerLevel: 1,
    stars: 0,
    unlockedMapIds: [],
    chapterProgress: {},
    completedTaskIds: []
  };
}

// 内容标识只允许稳定的字母、数字及常用分隔符。
function isValidContentId(id) {
  return typeof id === 'string' && /^[a-z0-9][a-z0-9:._-]*$/i.test(id);
}

// 数组必须只包含不重复的内容 ID。
function isValidIdList(ids) {
  return Array.isArray(ids) && ids.every(isValidContentId) && new Set(ids).size === ids.length;
}

// 存储读写前检查基础形状，防止无效数据覆盖学习记录。
function isValidGameState(value) {
  if (!value || !Number.isInteger(value.playerLevel) || value.playerLevel < 1 ||
      !Number.isInteger(value.stars) || value.stars < 0 ||
      !isValidIdList(value.unlockedMapIds) ||
      !isValidIdList(value.completedTaskIds) ||
      !value.chapterProgress || typeof value.chapterProgress !== 'object' ||
      Array.isArray(value.chapterProgress)) {
    return false;
  }

  return Object.keys(value.chapterProgress).every((chapterId) => {
    const progress = value.chapterProgress[chapterId];
    return isValidContentId(chapterId) && progress &&
      ['not_started', 'in_progress', 'completed'].indexOf(progress.status) !== -1 &&
      (progress.currentNodeId === null || isValidContentId(progress.currentNodeId)) &&
      (progress.updatedAt === null || typeof progress.updatedAt === 'string');
  });
}

module.exports = { createInitialGameState, isValidContentId, isValidGameState };
