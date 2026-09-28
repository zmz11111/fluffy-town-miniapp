const { DEMO_COURSE_ID } = require('../english/words');
const { TUANTUAN } = require('../pets/pet');
const { createInitialGameState, isValidGameState } = require('../game/model');

// 使用新键保存 Sprint 1.5 数据；保留旧键以迁移已有学习和互动记录。
const STORAGE_KEY = 'fluffy-town:local:v2';
const LEGACY_STORAGE_KEY = 'fluffy-town:local:v1';
const SCHEMA_VERSION = 2;

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

// 旧版结构检查仅用于迁移，绝不修改旧键中的原始数据。
function isValidLegacyState(value) {
  return Boolean(
    value &&
    value.schemaVersion === 1 &&
    value.progress &&
    Array.isArray(value.progress.completedWordIds) &&
    value.petState &&
    Array.isArray(value.learningRecords)
  );
}

// 新版结构还须包含独立的游戏状态。
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

// 只复制旧版已知字段；加入游戏状态时保留原有学习与互动数据。
function migrateLegacyState(legacy) {
  const copied = JSON.parse(JSON.stringify(legacy));
  return {
    schemaVersion: SCHEMA_VERSION,
    progress: copied.progress,
    petState: copied.petState,
    learningRecords: copied.learningRecords,
    gameState: createInitialGameState()
  };
}

// 读取时返回副本，页面与业务模块不能通过引用修改存储内容。
function loadState() {
  try {
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (isValidState(stored)) {
      return JSON.parse(JSON.stringify(stored));
    }

    const legacy = wx.getStorageSync(LEGACY_STORAGE_KEY);
    if (isValidLegacyState(legacy)) {
      const migrated = migrateLegacyState(legacy);
      try {
        saveState(migrated);
      } catch (error) {
        // 迁移暂时无法落盘时仍展示旧进度，后续写入会再次尝试。
      }
      return migrated;
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

module.exports = { STORAGE_KEY, LEGACY_STORAGE_KEY, createInitialState, loadState, updateState };
