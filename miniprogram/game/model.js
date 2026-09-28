/**
 * 游戏状态只记录玩家进度，不在这里定义剧情内容或奖励发放条件。
 * 章节、地图和任务 ID 必须在内容包中保持稳定，并包含课程命名空间。
 * @typedef {{status: 'not_started'|'in_progress'|'completed', currentNodeId: string|null, updatedAt: string|null}} ChapterProgress
 * @typedef {{chapterId: string, sceneId: string, dialogueIndex: number}|null} CurrentStory
 * @typedef {{itemIds: string[], furnitureIds: string[], clothingIds: string[]}} Inventory
 * @typedef {{claimedRewardIds: string[], achievementIds: string[]}} Rewards
 * @typedef {{gameId: string, roundIndex: number, correctCount: number, wrongAttempts: number}|null} CurrentGame
 * @typedef {{tuantuan: {emotion: string, lastStorySceneId: string|null}, mimi: {unlocked: boolean, friendship: number, storyProgress: string}}} Companions
 * @typedef {{playerLevel: number, stars: number, unlockedMapIds: string[], chapterProgress: Object<string, ChapterProgress>, triggeredTaskIds: string[], completedTaskIds: string[], currentStory: CurrentStory, inventory: Inventory, rewards: Rewards, currentGame: CurrentGame, companions: Companions}} GameState
 */

// 创建独立的初始状态，避免多个档案共享可变数组或对象。
function createInitialGameState() {
  return {
    playerLevel: 1,
    stars: 0,
    unlockedMapIds: [],
    chapterProgress: {},
    triggeredTaskIds: [],
    completedTaskIds: [],
    currentStory: null,
    inventory: {
      itemIds: [],
      furnitureIds: [],
      clothingIds: []
    },
    rewards: {
      claimedRewardIds: [],
      achievementIds: []
    },
    currentGame: null,
    companions: {
      tuantuan: { emotion: 'curious', lastStorySceneId: null },
      mimi: { unlocked: false, friendship: 0, storyProgress: 'not_met' }
    }
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

// Sprint 1.5 的五个基础字段用于检查旧版档案并安全迁移。
function isValidLegacyGameState(value) {
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

// Sprint 1.8 的剧情、背包和奖励字段用于检查旧版档案。
function isValidV3GameState(value) {
  if (!isValidLegacyGameState(value) ||
      !isValidIdList(value.triggeredTaskIds) ||
      !value.inventory || !isValidIdList(value.inventory.itemIds) ||
      !isValidIdList(value.inventory.furnitureIds) ||
      !isValidIdList(value.inventory.clothingIds) ||
      !value.rewards || !isValidIdList(value.rewards.claimedRewardIds) ||
      !isValidIdList(value.rewards.achievementIds)) {
    return false;
  }

  const current = value.currentStory;
  return current === null || Boolean(
    current &&
    isValidContentId(current.chapterId) &&
    isValidContentId(current.sceneId) &&
    Number.isInteger(current.dialogueIndex) &&
    current.dialogueIndex >= 0
  );
}

// Sprint 2 再校验角色状态和可恢复的小游戏回合。
function isValidGameState(value) {
  if (!isValidV3GameState(value) || !value.companions ||
      !value.companions.tuantuan || !value.companions.mimi) {
    return false;
  }
  const tuantuan = value.companions.tuantuan;
  const mimi = value.companions.mimi;
  if (['curious', 'happy', 'worried', 'excited'].indexOf(tuantuan.emotion) === -1 ||
      (tuantuan.lastStorySceneId !== null && !isValidContentId(tuantuan.lastStorySceneId)) ||
      typeof mimi.unlocked !== 'boolean' ||
      !Number.isInteger(mimi.friendship) || mimi.friendship < 0 ||
      ['not_met', 'met', 'joined'].indexOf(mimi.storyProgress) === -1) {
    return false;
  }
  const current = value.currentGame;
  return current === null || Boolean(
    current && isValidContentId(current.gameId) &&
    Number.isInteger(current.roundIndex) && current.roundIndex >= 0 &&
    Number.isInteger(current.correctCount) && current.correctCount >= 0 &&
    Number.isInteger(current.wrongAttempts) && current.wrongAttempts >= 0
  );
}

module.exports = {
  createInitialGameState,
  isValidContentId,
  isValidLegacyGameState,
  isValidV3GameState,
  isValidGameState
};
