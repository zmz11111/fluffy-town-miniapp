const { DEMO_COURSE_ID } = require('../english/words');
const { TUANTUAN } = require('../pets/pet');
const { createInitialGameState, isValidLegacyGameState, isValidGameState } = require('../game/model');

// 新键保存剧情与奖励状态；旧键保留，避免升级时丢失学习和互动记录。
const STORAGE_KEY = 'fluffy-town:local:v3';
const PREVIOUS_STORAGE_KEY = 'fluffy-town:local:v2';
const LEGACY_STORAGE_KEY = 'fluffy-town:local:v1';
const SCHEMA_VERSION = 3;

/**
 * 生成当前设备的初始档案；不收集真实姓名或其他身份信息。
 * @returns {{schemaVersion: number, progress: object, petState: object, learningRecords: Array<object>, gameState: object}}
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
      lastInteractedAt: null
    },
    learningRecords: [],
    gameState: createInitialGameState()
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

// 新版结构还须包含剧情、背包和奖励状态。
function isValidState(value) {
  return Boolean(
    value &&
    value.schemaVersion === SCHEMA_VERSION &&
    value.progress &&
    Array.isArray(value.progress.completedWordIds) &&
    value.petState &&
    Array.isArray(value.learningRecords) &&
    isValidGameState(value.gameState)
  );
}

// 从 Sprint 1 档案迁移时保留学习与互动记录，补入完整游戏状态。
function migrateV1State(legacy) {
  const copied = JSON.parse(JSON.stringify(legacy));
  return {
    schemaVersion: SCHEMA_VERSION,
    progress: copied.progress,
    petState: copied.petState,
    learningRecords: copied.learningRecords,
    gameState: createInitialGameState()
  };
}

// 从 Sprint 1.5 档案迁移时保留等级、星星、地图、章节和任务进度。
function migrateV2State(previous) {
  const copied = JSON.parse(JSON.stringify(previous));
  const gameState = createInitialGameState();
  gameState.playerLevel = copied.gameState.playerLevel;
  gameState.stars = copied.gameState.stars;
  gameState.unlockedMapIds = copied.gameState.unlockedMapIds;
  gameState.chapterProgress = copied.gameState.chapterProgress;
  gameState.completedTaskIds = copied.gameState.completedTaskIds;
  return {
    schemaVersion: SCHEMA_VERSION,
    progress: copied.progress,
    petState: copied.petState,
    learningRecords: copied.learningRecords,
    gameState
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
    if (isValidV2State(previous)) {
      return saveMigratedState(migrateV2State(previous));
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
  LEGACY_STORAGE_KEY,
  createInitialState,
  loadState,
  updateState
};
