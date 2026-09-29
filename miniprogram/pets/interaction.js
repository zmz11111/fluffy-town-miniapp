const { TUANTUAN } = require('./pet');
const { loadState, updateState } = require('../storage/local');
const { applyTuantuanAffinityChange } = require('./affinity');

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

function getResetDate(timestamp) {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getUsage(petState, timestamp) {
  const today = getLocalDateKey(timestamp);
  const usedToday = petState.dailyInteractionDate === today && Number.isInteger(petState.dailyInteractionCount)
    ? Math.max(0, petState.dailyInteractionCount) : 0;
  const resetAt = getResetDate(timestamp);
  return {
    today,
    usedToday,
    remainingDailyInteractions: Math.max(0, MAX_DAILY_INTERACTIONS - usedToday),
    maxDailyInteractions: MAX_DAILY_INTERACTIONS,
    dailyLimitReached: usedToday >= MAX_DAILY_INTERACTIONS,
    nextResetAt: resetAt.toISOString(),
    recoveryHint: usedToday >= MAX_DAILY_INTERACTIONS
      ? '明天零点，团团的互动次数会恢复。'
      : '互动次数每天零点恢复。'
  };
}

// 首页与学习页共用剩余次数及本地零点恢复信息。
function getDailyInteractionStatus(timestamp) {
  const nowTime = Number.isFinite(timestamp) ? timestamp : Date.now();
  const petState = loadState().petState;
  return Object.assign({}, petState, getUsage(petState, nowTime));
}

// 每日互动有上限；首次反馈更丰富，后续反馈轻柔，并更新关系值。
function interactWithTuantuan() {
  const previous = loadState().petState;
  const nowTime = Date.now();
  const usage = getUsage(previous, nowTime);
  const lastTime = previous.lastInteractedAt ? Date.parse(previous.lastInteractedAt) : NaN;
  if (usage.dailyLimitReached) {
    return Object.assign({}, previous, usage, {
      interactionAccepted: false,
      feedbackLevel: 'none',
      affinityChange: 0
    });
  }
  const elapsedSinceLast = nowTime - lastTime;
  if (!Number.isNaN(lastTime) && elapsedSinceLast >= 0 && elapsedSinceLast < INTERACTION_COOLDOWN_MS) {
    return Object.assign({}, previous, usage, {
      interactionAccepted: false,
      feedbackLevel: 'none',
      cooldownRemainingMs: INTERACTION_COOLDOWN_MS - elapsedSinceLast,
      affinityChange: 0
    });
  }

  const now = new Date(nowTime).toISOString();
  const nextCount = usage.usedToday + 1;
  const feedbackLevel = usage.usedToday === 0 ? 'high' : 'low';
  const affinityDelta = feedbackLevel === 'high' ? 2 : 1;
  const updated = updateState((draft) => {
    draft.petState.petId = TUANTUAN.id;
    draft.petState.mood = feedbackLevel === 'high' ? 'happy' : 'content';
    draft.petState.lastInteractedAt = now;
    draft.petState.dailyInteractionDate = usage.today;
    draft.petState.dailyInteractionCount = nextCount;
    applyTuantuanAffinityChange(draft.petState, affinityDelta, 'daily-interaction', now);
  });
  return Object.assign({}, updated.petState, getUsage(updated.petState, nowTime), {
    interactionAccepted: true,
    feedbackLevel,
    affinityChange: affinityDelta,
    cooldownRemainingMs: 0
  });
}

module.exports = {
  INTERACTION_COOLDOWN_MS,
  MAX_DAILY_INTERACTIONS,
  getTuantuanState: () => loadState().petState,
  getDailyInteractionStatus,
  interactWithTuantuan
};
