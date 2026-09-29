const { TUANTUAN } = require('./pet');
const { loadState, updateState } = require('../storage/local');

const INTERACTION_COOLDOWN_MS = 2000;
const MAX_DAILY_INTERACTIONS = 5;

function getLocalDateKey(timestamp) {
  const date = new Date(timestamp);
  const monthValue = date.getMonth() + 1;
  const dayValue = date.getDate();
  const month = monthValue < 10 ? `0${monthValue}` : String(monthValue);
  const day = dayValue < 10 ? `0${dayValue}` : String(dayValue);
  return `${date.getFullYear()}-${month}-${day}`;
}

// 页面通过角色模块读取状态，不依赖本地存储字段的位置。
function getTuantuanState() {
  return loadState().petState;
}

// 每日互动有上限；当天第一次互动给完整反馈，后续互动使用轻反馈。
function interactWithTuantuan() {
  const previous = loadState().petState;
  const nowTime = Date.now();
  const today = getLocalDateKey(nowTime);
  const usedToday = previous.dailyInteractionDate === today && Number.isInteger(previous.dailyInteractionCount)
    ? Math.max(0, previous.dailyInteractionCount) : 0;
  const lastTime = previous.lastInteractedAt ? Date.parse(previous.lastInteractedAt) : NaN;
  if (usedToday >= MAX_DAILY_INTERACTIONS) {
    return Object.assign({}, previous, {
      interactionAccepted: false,
      dailyLimitReached: true,
      dailyInteractionCount: usedToday,
      remainingDailyInteractions: 0,
      feedbackLevel: 'none'
    });
  }
  const elapsedSinceLast = nowTime - lastTime;
  if (!Number.isNaN(lastTime) && elapsedSinceLast >= 0 && elapsedSinceLast < INTERACTION_COOLDOWN_MS) {
    return Object.assign({}, previous, {
      interactionAccepted: false,
      dailyLimitReached: false,
      dailyInteractionCount: usedToday,
      remainingDailyInteractions: MAX_DAILY_INTERACTIONS - usedToday,
      feedbackLevel: 'none'
    });
  }

  const now = new Date(nowTime).toISOString();
  const nextCount = usedToday + 1;
  const state = updateState((draft) => {
    draft.petState.petId = TUANTUAN.id;
    draft.petState.mood = nextCount === 1 ? 'happy' : 'content';
    draft.petState.lastInteractedAt = now;
    draft.petState.dailyInteractionDate = today;
    draft.petState.dailyInteractionCount = nextCount;
  });
  return Object.assign({}, state.petState, {
    interactionAccepted: true,
    dailyLimitReached: false,
    remainingDailyInteractions: MAX_DAILY_INTERACTIONS - nextCount,
    feedbackLevel: nextCount === 1 ? 'high' : 'low'
  });
}

module.exports = { INTERACTION_COOLDOWN_MS, MAX_DAILY_INTERACTIONS, getTuantuanState, interactWithTuantuan };
