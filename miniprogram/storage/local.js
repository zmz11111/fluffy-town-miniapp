const { DEMO_COURSE_ID } = require('../english/words');
const { TUANTUAN } = require('../pets/pet');
const { createInitialGameState, isValidLegacyGameState, isValidV3GameState, isValidGameState } = require('../game/model');
const { createInitialLearningState, createLearningStateFromLegacy, isValidLearningState } = require('../english/learning-state-model');

// 新键增加课程学习状态；旧键保留以便安全迁移。
const STORAGE_KEY = 'fluffy-town:local:v5';
const PREVIOUS_STORAGE_KEY = 'fluffy-town:local:v4';
const V3_STORAGE_KEY = 'fluffy-town:local:v3';
const OLDER_STORAGE_KEY = 'fluffy-town:local:v2';
const LEGACY_STORAGE_KEY = 'fluffy-town:local:v1';
const SCHEMA_VERSION = 5;

/**
 * 生成当前设备的初始档案；不收集真实姓名或其他身份信息。
 * @returns {{schemaVersion: number, progress: object, petState: object, learningRecords: Array<object>, gameState: object, learningState: object}}
 */
function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    progress: {
      grade: 3,
      courseId: DEMO_COURSE_ID,
      completedWordIds: [],
      lastStudiedAt: null
    },
    petState: {
      petId: TUANTUAN.id,
      interactionCount: 0,
      mood: 'happy',
      lastInteractedAt: null,
      dailyInteractionDate: null,
      dailyInteractionCount: 0,
      affinity: 0,
      lastAffinityChange: null
    },
    learningRecords: [],
    gameState: createInitialGameState(),
    learningState: createInitialLearningState()
  };
}

// Sprint 1 档案结构检查仅用于迁移，不修改旧键中的原始数据。
function isValidV1State(value) {
  return Boolean(
    value &&
    value.schemaVersion === 1 &&
    value.progress &&
    Array.isArray(value.progress.completedWordIds) &&
    value.petState &&
    Array.isArray(value.learningRecords)
  );
}

// Sprint 1.5 档案须带旧版游戏状态，迁移后保留全部既有进度。
function isValidV2State(value) {
  return Boolean(
    value &&
    value.schemaVersion === 2 &&
    value.progress &&
    Array.isArray(value.progress.completedWordIds) &&
    value.petState &&
    Array.isArray(value.learningRecords) &&
    isValidLegacyGameState(value.gameState)
  );
}

// Sprint 1.8 档案须包含剧情、背包和奖励状态。
function isValidV3State(value) {
  return Boolean(
    value &&
    value.schemaVersion === 3 &&
    value.progress &&
    Array.isArray(value.progress.completedWordIds) &&
    value.petState &&
    Array.isArray(value.learningRecords) &&
    isValidV3GameState(value.gameState)
  );
}

// 新版结构还须包含角色和小游戏状态。
function isValidState(value) {
  return Boolean(
    value &&
    value.schemaVersion === SCHEMA_VERSION &&
    value.progress &&
    Array.isArray(value.progress.completedWordIds) &&
    value.petState &&
    Array.isArray(value.learningRecords) &&
    isValidGameState(value.gameState) &&
    isValidLearningState(value.learningState)
  );
}

// v4 已保存剧情、奖励和伙伴；迁移时只补入学习进度模型。
function isValidV4State(value) {
  return Boolean(
    value && value.schemaVersion === 4 &&
    value.progress && Array.isArray(value.progress.completedWordIds) &&
    value.petState && Array.isArray(value.learningRecords) &&
    isValidGameState(value.gameState)
  );
}

// 复制旧版游戏字段，避免迁移时遗漏星星、章节和任务进度。
function copyOldGameFields(target, source) {
  target.playerLevel = source.playerLevel;
  target.stars = source.stars;
  target.unlockedMapIds = source.unlockedMapIds;
  target.chapterProgress = source.chapterProgress;
  target.completedTaskIds = source.completedTaskIds;
  return target;
}

// 从 Sprint 1 档案迁移时保留学习与互动记录，补入完整游戏状态。
function migrateV1State(legacy) {
  const copied = JSON.parse(JSON.stringify(legacy));
  return {
    schemaVersion: SCHEMA_VERSION,
    progress: copied.progress,
    petState: copied.petState,
    learningRecords: copied.learningRecords,
    gameState: createInitialGameState(),
    learningState: createInitialLearningState()
  };
}

// 从 Sprint 1.5 档案迁移时保留等级、星星、地图、章节和任务进度。
function migrateV2State(previous) {
  const copied = JSON.parse(JSON.stringify(previous));
  const gameState = copyOldGameFields(createInitialGameState(), copied.gameState);
  return {
    schemaVersion: SCHEMA_VERSION,
    progress: copied.progress,
    petState: copied.petState,
    learningRecords: copied.learningRecords,
    gameState,
    learningState: createLearningStateFromLegacy(gameState)
  };
}

// 从 Sprint 1.8 档案迁移时保留剧情与奖励，只补充新角色和小游戏游标。
function migrateV3State(previous) {
  const copied = JSON.parse(JSON.stringify(previous));
  const gameState = copyOldGameFields(createInitialGameState(), copied.gameState);
  gameState.triggeredTaskIds = copied.gameState.triggeredTaskIds;
  gameState.currentStory = copied.gameState.currentStory;
  gameState.inventory = copied.gameState.inventory;
  gameState.rewards = copied.gameState.rewards;
  // 旧版 chapter_001 只有一幕测试剧情，不能继承为新版五幕章节的完成记录。
  delete gameState.chapterProgress['demo-grade-3:chapter_001'];
  if (gameState.currentStory && gameState.currentStory.chapterId === 'demo-grade-3:chapter_001') {
    gameState.currentStory = null;
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    progress: copied.progress,
    petState: copied.petState,
    learningRecords: copied.learningRecords,
    gameState,
    learningState: createLearningStateFromLegacy(gameState)
  };
}

// 从现有 v4 档案迁移时保留全部 Alpha 数据，并兼容已开始的 Unit 1 进度。
function migrateV4State(previous) {
  const copied = JSON.parse(JSON.stringify(previous));
  return {
    schemaVersion: SCHEMA_VERSION,
    progress: copied.progress,
    petState: copied.petState,
    learningRecords: copied.learningRecords,
    gameState: copied.gameState,
    learningState: createLearningStateFromLegacy(copied.gameState)
  };
}

// 迁移写入失败时仍返回旧进度的内存副本，后续更新会重新尝试落盘。
function saveMigratedState(migrated) {
  try {
    saveState(migrated);
  } catch (error) {
    // 存储可能暂时不可用，不清除旧键。
  }
  return migrated;
}

// 读取时返回副本，页面与业务模块不能通过引用修改存储内容。
function loadState() {
  try {
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (isValidState(stored)) {
      return JSON.parse(JSON.stringify(stored));
    }

    const previous = wx.getStorageSync(PREVIOUS_STORAGE_KEY);
    if (isValidV4State(previous)) {
      return saveMigratedState(migrateV4State(previous));
    }

    const v3 = wx.getStorageSync(V3_STORAGE_KEY);
    if (isValidV3State(v3)) {
      return saveMigratedState(migrateV3State(v3));
    }

    const older = wx.getStorageSync(OLDER_STORAGE_KEY);
    if (isValidV2State(older)) {
      return saveMigratedState(migrateV2State(older));
    }

    const legacy = wx.getStorageSync(LEGACY_STORAGE_KEY);
    if (isValidV1State(legacy)) {
      return saveMigratedState(migrateV1State(legacy));
    }
  } catch (error) {
    // 存储不可用时仍允许展示初始页面，写入错误由调用方处理。
    return createInitialState();
  }
  return createInitialState();
}

// 写入前校验整个档案，避免某一模块写坏其他模块的数据。
function saveState(state) {
  if (!isValidState(state)) {
    throw new Error('本地档案结构无效');
  }
  wx.setStorageSync(STORAGE_KEY, state);
  return state;
}

// 统一更新入口先读取副本，再一次性写入新版档案。
function updateState(change) {
  const next = loadState();
  change(next);
  return saveState(next);
}

module.exports = {
  STORAGE_KEY,
  PREVIOUS_STORAGE_KEY,
  V3_STORAGE_KEY,
  OLDER_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  createInitialState,
  loadState,
  updateState
};
