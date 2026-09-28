const { DEMO_COURSE_ID } = require('../english/words');
const { TUANTUAN } = require('../pets/pet');

// 键名含版本号，后续迁移可以读取旧版本并保留儿童的学习进度。
const STORAGE_KEY = 'fluffy-town:local:v1';
const SCHEMA_VERSION = 1;

/**
 * 生成当前设备的初始档案；不收集真实姓名或其他身份信息。
 * @returns {{schemaVersion: number, progress: object, petState: object, learningRecords: Array<object>}}
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
    learningRecords: []
  };
}

// 对本地数据做最小结构检查，避免损坏数据导致页面无法打开。
function isValidState(value) {
  return Boolean(
    value &&
    value.schemaVersion === SCHEMA_VERSION &&
    value.progress &&
    Array.isArray(value.progress.completedWordIds) &&
    value.petState &&
    Array.isArray(value.learningRecords)
  );
}

// 本地读取失败时返回可展示的初始状态；旧数据保持原样，等待后续迁移处理。
function loadState() {
  try {
    const stored = wx.getStorageSync(STORAGE_KEY);
    return isValidState(stored) ? stored : createInitialState();
  } catch (error) {
    return createInitialState();
  }
}

// 写入失败由调用方提示用户，避免显示尚未保存的进度。
function saveState(state) {
  wx.setStorageSync(STORAGE_KEY, state);
  return state;
}

// 以复制后的状态执行一次更新，统一保存进度、宠物和学习记录。
function updateState(change) {
  const next = JSON.parse(JSON.stringify(loadState()));
  change(next);
  return saveState(next);
}

module.exports = { STORAGE_KEY, createInitialState, loadState, updateState };
