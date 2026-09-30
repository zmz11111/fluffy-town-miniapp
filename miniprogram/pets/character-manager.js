const { TUANTUAN } = require('./pet');
const { MIMI } = require('./mimi');
const { getGameState, updateGameState } = require('../game/state');

const MAX_DAILY_MIMI_GREETINGS = 3;
const MIMI_GREETING_COOLDOWN_MS = 2000;

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

function getMimiGreetingStatus(mimi, timestamp) {
  const now = Number.isFinite(timestamp) ? timestamp : Date.now();
  const today = getLocalDateKey(now);
  const usedToday = mimi.dailyGreetingDate === today && Number.isInteger(mimi.dailyGreetingCount)
    ? Math.max(0, mimi.dailyGreetingCount) : 0;
  return {
    dailyGreetingLimit: MAX_DAILY_MIMI_GREETINGS,
    dailyGreetingCount: usedToday,
    greetingRemaining: Math.max(0, MAX_DAILY_MIMI_GREETINGS - usedToday),
    dailyGreetingDate: today,
    greetingRecoveryHint: usedToday >= MAX_DAILY_MIMI_GREETINGS
      ? '明天零点，和米米打招呼的次数会恢复。'
      : '招呼次数每天零点恢复。',
    nextGreetingResetAt: getResetDate(now).toISOString()
  };
}

// 角色页读取静态设定与个人状态的合并视图，不直接访问本地存储。
function getCharacterOverview(state) {
  const companions = (state || getGameState()).companions;
  const mimiGreetingStatus = getMimiGreetingStatus(companions.mimi);
  return {
    tuantuan: {
      ...TUANTUAN,
      emotion: companions.tuantuan.emotion,
      emotionLabel: { curious: '好奇地陪你探索', worried: '想和你一起想办法', happy: '开心地分享发现', excited: '为共同发现感到惊喜' }[companions.tuantuan.emotion]
    },
    mimi: {
      ...MIMI,
      unlocked: companions.mimi.unlocked,
      friendship: companions.mimi.friendship,
      storyProgress: companions.mimi.storyProgress,
      greetingRemaining: mimiGreetingStatus.greetingRemaining,
      dailyGreetingLimit: mimiGreetingStatus.dailyGreetingLimit,
      greetingRecoveryHint: mimiGreetingStatus.greetingRecoveryHint
    }
  };
}

// 米米每天最多接受三次问候，并限制短时间重复点击，友谊值随有效互动缓慢增加。
function greetMimi(timestamp) {
  const nowTime = Number.isFinite(timestamp) ? timestamp : Date.now();
  const previous = getGameState().companions.mimi;
  if (!previous.unlocked) {
    throw new Error('米米尚未加入');
  }
  const usage = getMimiGreetingStatus(previous, nowTime);
  const lastTime = previous.lastGreetedAt ? Date.parse(previous.lastGreetedAt) : NaN;
  if (usage.greetingRemaining <= 0) {
    return Object.assign({}, previous, usage, { greetingAccepted: false, dailyLimitReached: true, friendshipChange: 0 });
  }
  const elapsed = nowTime - lastTime;
  if (!Number.isNaN(lastTime) && elapsed >= 0 && elapsed < MIMI_GREETING_COOLDOWN_MS) {
    return Object.assign({}, previous, usage, {
      greetingAccepted: false,
      dailyLimitReached: false,
      cooldownRemainingMs: MIMI_GREETING_COOLDOWN_MS - elapsed,
      friendshipChange: 0
    });
  }

  const now = new Date(nowTime).toISOString();
  const state = updateGameState((draft) => {
    if (!draft.companions.mimi.unlocked) {
      throw new Error('米米尚未加入');
    }
    draft.companions.mimi.dailyGreetingDate = usage.dailyGreetingDate;
    draft.companions.mimi.dailyGreetingCount = usage.dailyGreetingCount + 1;
    draft.companions.mimi.lastGreetedAt = now;
    draft.companions.mimi.friendship = Math.min(99, draft.companions.mimi.friendship + 1);
  });
  return Object.assign({}, state.companions.mimi, getMimiGreetingStatus(state.companions.mimi, nowTime), {
    greetingAccepted: true,
    dailyLimitReached: false,
    cooldownRemainingMs: 0,
    friendshipChange: state.companions.mimi.friendship > previous.friendship ? 1 : 0
  });
}

module.exports = {
  MAX_DAILY_MIMI_GREETINGS,
  MIMI_GREETING_COOLDOWN_MS,
  getMimiGreetingStatus,
  getCharacterOverview,
  greetMimi
};
