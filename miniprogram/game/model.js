/**
 * 游戏状态只记录玩家进度，不在这里定义剧情内容或奖励发放条件。
 * 章节、地图和任务 ID 必须在内容包中保持稳定，并包含课程命名空间。
 * @typedef {{status: 'not_started'|'in_progress'|'completed', currentNodeId: string|null, updatedAt: string|null}} ChapterProgress
 * @typedef {{chapterId: string, sceneId: string, dialogueIndex: number}|null} CurrentStory
 * @typedef {{itemIds: string[], furnitureIds: string[], clothingIds: string[]}} Inventory
 * @typedef {{claimedRewardIds: string[], achievementIds: string[]}} Rewards
 * @typedef {{gameId: string, roundIndex: number, correctCount: number, wrongAttempts: number}|null} CurrentGame
 * @typedef {{emotion: string, lastStorySceneId: string|null, lastGreetingAt?: string|null, greetingHistoryByState?: Object<string, string[]>, seenCompletedTaskIds?: string[]}} TuantuanCompanionState
 * @typedef {{unlocked: boolean, friendship: number, storyProgress: string, dailyGreetingDate?: string|null, dailyGreetingCount?: number, lastGreetedAt?: string|null, lastGreetingAt?: string|null, greetingHistoryByState?: Object<string, string[]>, seenCompletedTaskIds?: string[]}} MimiCompanionState
 * @typedef {{tuantuan: TuantuanCompanionState, mimi: MimiCompanionState}} Companions
 * @typedef {{playerLevel: number, stars: number, studyDayKeys?: string[], unlockedMapIds: string[], chapterProgress: Object<string, ChapterProgress>, triggeredTaskIds: string[], completedTaskIds: string[], currentStory: CurrentStory, inventory: Inventory, rewards: Rewards, currentGame: CurrentGame, companions: Companions}} GameState
 */

// 创建独立的初始状态，避免多个档案共享可变数组或对象。
function createInitialGameState() {
  return {
    playerLevel: 1,
    stars: 0,
    studyDayKeys: [],
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
      seenStarRewardIds: [],
      achievementIds: []
    },
    currentGame: null,
    companions: {
      tuantuan: {
        emotion: 'curious',
        lastStorySceneId: null,
        lastGreetingAt: null,
        greetingHistoryByState: {},
        seenCompletedTaskIds: []
      },
      mimi: {
        unlocked: false,
        friendship: 0,
        storyProgress: 'not_met',
        dailyGreetingDate: null,
        dailyGreetingCount: 0,
        lastGreetedAt: null,
        lastGreetingAt: null,
        greetingHistoryByState: {},
        seenCompletedTaskIds: []
      }
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

function isValidDateKeyList(keys) {
  return Array.isArray(keys) && keys.every((key) => typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key)) &&
    new Set(keys).size === keys.length;
}

function isValidGreetingHistory(history) {
  const allowedStates = ['firstMeeting', 'ordinary', 'continuousLearning', 'taskCompleted', 'longAbsence'];
  return history === undefined || Boolean(
    history && typeof history === 'object' && !Array.isArray(history) &&
    Object.keys(history).every((state) => allowedStates.indexOf(state) !== -1 && isValidIdList(history[state]))
  );
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
  // 展示记录是可选字段，兼容旧档；它不影响领奖资格或星星余额。
  if (value.rewards.seenStarRewardIds !== undefined && !isValidIdList(value.rewards.seenStarRewardIds)) {
    return false;
  }
  if ((value.studyDayKeys !== undefined && !isValidDateKeyList(value.studyDayKeys)) ||
      ['curious', 'happy', 'worried', 'excited'].indexOf(tuantuan.emotion) === -1 ||
      (tuantuan.lastStorySceneId !== null && !isValidContentId(tuantuan.lastStorySceneId)) ||
      (tuantuan.lastGreetingAt !== undefined && tuantuan.lastGreetingAt !== null && typeof tuantuan.lastGreetingAt !== 'string') ||
      !isValidGreetingHistory(tuantuan.greetingHistoryByState) ||
      (tuantuan.seenCompletedTaskIds !== undefined && !isValidIdList(tuantuan.seenCompletedTaskIds)) ||
      typeof mimi.unlocked !== 'boolean' ||
      !Number.isInteger(mimi.friendship) || mimi.friendship < 0 ||
      (mimi.dailyGreetingDate !== undefined && mimi.dailyGreetingDate !== null && typeof mimi.dailyGreetingDate !== 'string') ||
      (mimi.dailyGreetingCount !== undefined && (!Number.isInteger(mimi.dailyGreetingCount) || mimi.dailyGreetingCount < 0)) ||
      (mimi.lastGreetedAt !== undefined && mimi.lastGreetedAt !== null && typeof mimi.lastGreetedAt !== 'string') ||
      (mimi.lastGreetingAt !== undefined && mimi.lastGreetingAt !== null && typeof mimi.lastGreetingAt !== 'string') ||
      !isValidGreetingHistory(mimi.greetingHistoryByState) ||
      (mimi.seenCompletedTaskIds !== undefined && !isValidIdList(mimi.seenCompletedTaskIds)) ||
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
