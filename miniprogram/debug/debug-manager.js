const { loadState, updateState, createInitialState } = require('../storage/local');
const { createInitialLearningState, COURSE_ID, WELCOME_UNIT_ID, WELCOME_CHAPTER_ID, UNIT1_UNIT_ID, UNIT1_CHAPTER_ID, WELCOME_OBJECTIVE_IDS } = require('../english/learning-state-model');
const { createInitialGameState } = require('../game/model');
const { WELCOME_SESSIONS } = require('../curriculum/welcome/preview-content');
const { getDailyInteractionStatus } = require('../pets/interaction');
const { getMimiGreetingStatus } = require('../pets/character-manager');
const { getRewardDefinition } = require('../reward/reward-manager');

// 双重限定开发版与开发者工具；环境信息不可读取时默认关闭。
function isDevTools() {
  try {
    return wx.getAccountInfoSync().miniProgram.envVersion === 'develop' &&
      wx.getSystemInfoSync().platform === 'devtools';
  } catch (error) {
    return false;
  }
}

function requireDevTools() {
  if (!isDevTools()) throw new Error('DEV ONLY：仅微信开发者工具的开发版可用');
}

function getSnapshot() {
  requireDevTools();
  const state = loadState();
  const learning = state.learningState;
  const completedLessons = WELCOME_SESSIONS.filter((session) =>
    learning.taskProgressById[session.taskId] && learning.taskProgressById[session.taskId].status === 'completed'
  ).map((session) => session.index + 1);
  const nextSession = WELCOME_SESSIONS.find((session) => completedLessons.indexOf(session.index + 1) === -1);
  const tuantuan = getDailyInteractionStatus();
  const mimi = getMimiGreetingStatus(state.gameState.companions.mimi);
  return {
    courseId: learning.currentCourseId,
    unitId: learning.currentUnitId,
    chapterId: learning.currentChapterId,
    taskId: learning.currentTaskId || '无',
    completedChapterIds: learning.completedChapterIds,
    completedChapterText: learning.completedChapterIds.join('、') || '无',
    completedLessons,
    completedLessonText: completedLessons.join('、') || '无',
    nextLesson: nextSession ? nextSession.index + 1 : 0,
    stars: state.gameState.stars,
    tuantuanUsed: tuantuan.usedToday,
    tuantuanRemaining: tuantuan.remainingDailyInteractions,
    mimiUsed: mimi.dailyGreetingCount,
    mimiRemaining: mimi.greetingRemaining
  };
}

// 用正式任务、目标与奖励 ID 重建测试进度，不加入课程解锁旁路。
function setWelcomeCompletedCount(count) {
  requireDevTools();
  if (!Number.isInteger(count) || count < 0 || count > WELCOME_SESSIONS.length) {
    throw new Error('Welcome 课次超出范围');
  }
  const now = new Date().toISOString();
  updateState((draft) => {
    const learning = draft.learningState;
    const game = draft.gameState;
    const taskIds = WELCOME_SESSIONS.map((session) => session.taskId);
    const rewardIds = WELCOME_SESSIONS.map((session) => session.adventure.rewardId);
    rewardIds.forEach((id) => {
      if (game.rewards.claimedRewardIds.indexOf(id) !== -1) {
        game.stars = Math.max(0, game.stars - getRewardDefinition(id).amount);
      }
    });
    game.rewards.claimedRewardIds = game.rewards.claimedRewardIds.filter((id) => rewardIds.indexOf(id) === -1);
    game.completedTaskIds = game.completedTaskIds.filter((id) => taskIds.indexOf(id) === -1);
    game.triggeredTaskIds = game.triggeredTaskIds.filter((id) => taskIds.indexOf(id) === -1);
    delete game.chapterProgress[WELCOME_CHAPTER_ID];
    // 倒退课程时清除正在运行的故事与小游戏，避免首页恢复到旧的 Unit 1 页面。
    game.currentStory = null;
    game.currentGame = null;
    taskIds.forEach((id) => { delete learning.taskProgressById[id]; });
    WELCOME_OBJECTIVE_IDS.forEach((id) => { delete learning.objectiveProgressById[id]; });
    learning.unitProgressById[WELCOME_UNIT_ID].completedTaskIds = [];
    learning.completedChapterIds = learning.completedChapterIds.filter((id) => id !== WELCOME_CHAPTER_ID);
    learning.completedUnitIds = learning.completedUnitIds.filter((id) => id !== WELCOME_UNIT_ID);
    learning.prerequisiteBypassUnitIds = learning.prerequisiteBypassUnitIds.filter((id) => id !== WELCOME_UNIT_ID);
    delete learning.chapterProgressById[WELCOME_CHAPTER_ID];
    WELCOME_SESSIONS.slice(0, count).forEach((session) => {
      learning.taskProgressById[session.taskId] = {
        status: 'completed', stepIndex: 0, startedAt: now, completedAt: now, updatedAt: now
      };
      learning.unitProgressById[WELCOME_UNIT_ID].completedTaskIds.push(session.taskId);
      game.completedTaskIds.push(session.taskId);
      (session.objectiveIdsToComplete || []).forEach((id) => {
        learning.objectiveProgressById[id] = { status: 'completed', evidenceTaskIds: [session.taskId], updatedAt: now };
      });
      const reward = getRewardDefinition(session.adventure.rewardId);
      game.rewards.claimedRewardIds.push(reward.id);
      game.stars += reward.amount;
    });
    const complete = count === WELCOME_SESSIONS.length && WELCOME_OBJECTIVE_IDS.every((id) =>
      learning.objectiveProgressById[id] && learning.objectiveProgressById[id].status === 'completed'
    );
    learning.currentCourseId = COURSE_ID;
    learning.currentUnitId = complete ? UNIT1_UNIT_ID : WELCOME_UNIT_ID;
    learning.currentChapterId = complete ? UNIT1_CHAPTER_ID : WELCOME_CHAPTER_ID;
    learning.currentTaskId = null;
    learning.unitProgressById[WELCOME_UNIT_ID].status = complete ? 'completed' : count ? 'in_progress' : 'not_started';
    learning.unitProgressById[WELCOME_UNIT_ID].updatedAt = now;
    if (count) learning.chapterProgressById[WELCOME_CHAPTER_ID] = { status: complete ? 'completed' : 'in_progress', updatedAt: now };
    if (complete) {
      learning.completedUnitIds.push(WELCOME_UNIT_ID);
      learning.completedChapterIds.push(WELCOME_CHAPTER_ID);
    }
    learning.updatedAt = now;
  });
  return getSnapshot();
}

function resetWelcome() { return setWelcomeCompletedCount(0); }

function jumpToWelcomeLesson(lessonNumber) {
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > WELCOME_SESSIONS.length) {
    throw new Error('请选择 Welcome 第 1 至 7 课');
  }
  return setWelcomeCompletedCount(lessonNumber - 1);
}

function completeCurrentLesson() {
  requireDevTools();
  const snapshot = getSnapshot();
  if (snapshot.nextLesson === 0) throw new Error('Welcome 已完成全部 7 课');
  return setWelcomeCompletedCount(snapshot.nextLesson);
}

function unlockUnit1ForTest() { return setWelcomeCompletedCount(WELCOME_SESSIONS.length); }

// 清除课程与游戏测试存档，保留伙伴状态以便单独测试互动。
function clearLearningSave() {
  requireDevTools();
  updateState((draft) => {
    const initial = createInitialState();
    const companions = draft.gameState.companions;
    draft.progress = initial.progress;
    draft.learningRecords = [];
    draft.learningState = createInitialLearningState();
    draft.gameState = createInitialGameState();
    draft.gameState.companions = companions;
  });
  return getSnapshot();
}

// 清理互动次数和对白历史，保留友谊与奖励。
function clearCompanionInteractions() {
  requireDevTools();
  updateState((draft) => {
    const pet = draft.petState;
    pet.interactionCount = 0;
    pet.dailyInteractionDate = null;
    pet.dailyInteractionCount = 0;
    pet.lastInteractedAt = null;
    pet.lastAffinityChange = null;
    const tuantuan = draft.gameState.companions.tuantuan;
    tuantuan.lastGreetingAt = null;
    tuantuan.greetingHistoryByState = {};
    tuantuan.seenCompletedTaskIds = [];
    const mimi = draft.gameState.companions.mimi;
    mimi.dailyGreetingDate = null;
    mimi.dailyGreetingCount = 0;
    mimi.lastGreetedAt = null;
    mimi.lastGreetingAt = null;
    mimi.greetingHistoryByState = {};
    mimi.seenCompletedTaskIds = [];
  });
  return getSnapshot();
}

module.exports = { isDevTools, getSnapshot, resetWelcome, jumpToWelcomeLesson, completeCurrentLesson, unlockUnit1ForTest, clearLearningSave, clearCompanionInteractions };
