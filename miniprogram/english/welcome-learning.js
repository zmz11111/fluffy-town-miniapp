const { loadState, updateState } = require('../storage/local');
const { getGameState } = require('../game/state');
const { WELCOME_PREVIEW, WELCOME_SESSIONS, WELCOME_KNOWLEDGE } = require('../curriculum/welcome/preview-content');
const {
  COURSE_ID,
  WELCOME_UNIT_ID,
  WELCOME_CHAPTER_ID,
  WELCOME_TASK_ID,
  WELCOME_OBJECTIVE_IDS
} = require('./learning-state-model');
const {
  applyTaskStarted,
  applyTaskStep,
  beginLearningChapter,
  completeWelcomeSession,
  getLearningState
} = require('./learning-state');
const { adjustTuantuanAffinity } = require('../pets/affinity');
const { applyReward, getRewardDefinition } = require('../reward/reward-manager');

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function findCurrentSession(learning) {
  const taskProgress = learning.taskProgressById || {};
  return WELCOME_SESSIONS.find((session) => {
    const progress = taskProgress[session.taskId];
    return !progress || progress.status !== 'completed';
  }) || null;
}

function uniqueValues(values) {
  return Array.from(new Set(values));
}

// 当前及已完成分课的内容可查看；后续词句在完成前保持收起。
function getWelcomeProgress() {
  const learning = getLearningState();
  const taskProgress = learning.taskProgressById || {};
  const completedSessions = WELCOME_SESSIONS.filter((session) => {
    return taskProgress[session.taskId] && taskProgress[session.taskId].status === 'completed';
  });
  const currentSession = findCurrentSession(learning);
  const releasedSessions = currentSession
    ? WELCOME_SESSIONS.slice(0, currentSession.index + 1)
    : WELCOME_SESSIONS;
  const objectiveProgress = learning.objectiveProgressById || {};
  return {
    completedSessions: completedSessions.length,
    totalSessions: WELCOME_SESSIONS.length,
    currentSessionIndex: currentSession ? currentSession.index + 1 : WELCOME_SESSIONS.length,
    currentSessionTitle: currentSession ? currentSession.title : '',
    currentTaskId: currentSession ? currentSession.taskId : null,
    isComplete: !currentSession && WELCOME_OBJECTIVE_IDS.every((id) => objectiveProgress[id] && objectiveProgress[id].status === 'completed'),
    completedObjectiveCount: WELCOME_OBJECTIVE_IDS.filter((id) => objectiveProgress[id] && objectiveProgress[id].status === 'completed').length,
    totalObjectives: WELCOME_OBJECTIVE_IDS.length,
    releasedVocabularyIds: uniqueValues(releasedSessions.flatMap((session) => session.vocabularyIds)),
    releasedSentenceIds: uniqueValues(releasedSessions.flatMap((session) => session.sentenceIds))
  };
}

function getActiveSession(learning) {
  const currentTaskId = learning.currentTaskId;
  return WELCOME_SESSIONS.find((session) => session.taskId === currentTaskId) || findCurrentSession(learning);
}

function getTaskView(message) {
  const learning = loadState().learningState;
  const session = findCurrentSession(learning);
  const overview = getWelcomeProgress();
  if (!session) {
    return {
      status: 'completed',
      title: WELCOME_PREVIEW.title,
      completedSessions: overview.completedSessions,
      totalSessions: overview.totalSessions,
      sessionIndex: overview.totalSessions,
      totalSteps: 0,
      stepIndex: 0,
      adventure: null,
      audioPlayed: false
    };
  }
  const progress = learning.taskProgressById[session.taskId];
  const stepIndex = progress && progress.status === 'in_progress' ? progress.stepIndex : 0;
  const step = session.steps[stepIndex];
  if (!step) {
    throw new Error('Welcome 学习步骤位置无效');
  }
  const visibleStep = copy(step);
  visibleStep.vocabulary = (step.vocabularyIds || []).map((id) => {
    return WELCOME_KNOWLEDGE.vocabulary.find((entry) => entry.id === id);
  }).filter(Boolean);
  visibleStep.sentences = (step.sentenceIds || []).map((id) => {
    return WELCOME_KNOWLEDGE.sentences.find((entry) => entry.id === id);
  }).filter(Boolean);
  if (step.kind === 'recognize-letters') {
    const selected = progress && Array.isArray(progress.selectedLetterIds) ? progress.selectedLetterIds : [];
    visibleStep.letters = step.letters.map((letter) => ({
      value: letter,
      lowercase: letter.toLowerCase(),
      selected: selected.indexOf(letter) !== -1
    }));
    visibleStep.selectedLetterCount = selected.length;
  }
  return {
    status: 'playing',
    title: session.title,
    courseTitle: WELCOME_PREVIEW.title,
    stepIndex,
    stepNumber: stepIndex + 1,
    totalSteps: session.steps.length,
    sessionIndex: session.index + 1,
    totalSessions: WELCOME_SESSIONS.length,
    completedSessions: overview.completedSessions,
    step: visibleStep,
    adventure: copy(session.adventure),
    audioPlayed: Boolean(progress && (progress.heardAudioStepIds || []).indexOf(step.id) !== -1),
    welcomeProgress: overview,
    message: message || ''
  };
}

// 第一天必须从故事邀请进入；后续分课由课程入口接续，可随时恢复进度。
function startTask(requestedTaskId) {
  const state = getGameState();
  let learning = getLearningState();
  const progressSession = findCurrentSession(learning);
  const requestedSession = WELCOME_SESSIONS.find((item) => item.taskId === requestedTaskId);
  // 页面参数只用于校验入口课次，真实进度始终决定当前应学内容。
  const session = requestedSession && progressSession && requestedSession.taskId === progressSession.taskId
    ? requestedSession : progressSession;
  if (!session) {
    return getTaskView();
  }
  if (session.taskId === WELCOME_TASK_ID && state.triggeredTaskIds.indexOf(WELCOME_TASK_ID) === -1) {
    throw new Error('请先和团团开始 Welcome');
  }
  // 修复旧存档的课程游标漂移；只有已进入后续分课时才校准到 Welcome。
  if (session.taskId !== WELCOME_TASK_ID &&
      (learning.currentUnitId !== WELCOME_UNIT_ID || learning.currentChapterId !== WELCOME_CHAPTER_ID)) {
    beginLearningChapter(COURSE_ID, WELCOME_UNIT_ID, WELCOME_CHAPTER_ID);
    learning = getLearningState();
  }
  const progress = learning.taskProgressById[session.taskId];
  if (progress && progress.status === 'in_progress' &&
      progress.contentVersion !== WELCOME_PREVIEW.contentVersion) {
    // 冒险步骤升级后，旧步骤编号无法安全映射；未完成分课从新挑战首步继续。
    const now = new Date().toISOString();
    updateState((draft) => {
      const task = draft.learningState.taskProgressById[session.taskId];
      task.stepIndex = 0;
      task.heardAudioStepIds = [];
      task.selectedLetterIds = [];
      task.contentVersion = WELCOME_PREVIEW.contentVersion;
      task.updatedAt = now;
    });
    learning = getLearningState();
  }
  const currentProgress = learning.taskProgressById[session.taskId];
  if (!currentProgress || currentProgress.status !== 'in_progress') {
    const now = new Date().toISOString();
    updateState((draft) => {
      applyTaskStarted(draft.learningState, session.taskId, 0, now);
      draft.learningState.taskProgressById[session.taskId].contentVersion = WELCOME_PREVIEW.contentVersion;
    });
  }
  return getTaskView();
}

function completeSession(session, message, audioSrc, companionMessage) {
  const result = completeWelcomeSession(session.taskId, session.objectiveIdsToComplete || []);
  if (result.newlyCompletedObjectiveIds.length) {
    adjustTuantuanAffinity(2, `welcome-objectives:${result.newlyCompletedObjectiveIds.join(',')}`);
  }
  const reward = getRewardDefinition(session.adventure.rewardId);
  if (!reward) {
    throw new Error('Welcome 冒险奖励尚未登记');
  }
  applyReward(reward.id);
  const overview = getWelcomeProgress();
  return {
    correct: true,
    completed: true,
    sessionCompleted: true,
    courseCompleted: overview.isComplete,
    stepIndex: session.steps.length,
    totalSteps: session.steps.length,
    completedSessions: overview.completedSessions,
    totalSessions: overview.totalSessions,
    message: overview.isComplete ? 'Welcome 的词句和课堂活动都学完啦，Unit 1 已经开放。' : `${session.title}完成！`,
    companionMessage: companionMessage || session.adventure.completionDialogue,
    rewardMessage: session.adventure.rewardMessage || `完成冒险，获得 ${reward.amount} 颗星星！`,
    rewardAmount: reward.amount,
    stars: getGameState().stars,
    audioSrc: audioSrc || ''
  };
}

function advanceTaskStep(session, message, audioSrc, companionMessage) {
  const progress = loadState().learningState.taskProgressById[session.taskId];
  if (!progress || progress.status !== 'in_progress') {
    throw new Error('请先开始当前 Welcome 分课');
  }
  const nextStepIndex = progress.stepIndex + 1;
  if (nextStepIndex >= session.steps.length) {
    return completeSession(session, message, audioSrc, companionMessage);
  }
  const now = new Date().toISOString();
  updateState((draft) => {
    applyTaskStep(draft.learningState, session.taskId, nextStepIndex, now);
    draft.learningState.taskProgressById[session.taskId].contentVersion = WELCOME_PREVIEW.contentVersion;
  });
  return {
    correct: true,
    completed: false,
    stepIndex: nextStepIndex,
    message: message || '我们一起发现了新的表达。',
    companionMessage: companionMessage || session.adventure.successDialogue,
    companionEmotion: 'happy',
    audioSrc: audioSrc || ''
  };
}

function requireActiveStep() {
  const state = loadState();
  const learning = state.learningState;
  const session = getActiveSession(learning);
  const progress = session && learning.taskProgressById[session.taskId];
  if (!session || !progress || progress.status !== 'in_progress') {
    throw new Error('请先开始 Welcome 学习任务');
  }
  return { session, progress, step: session.steps[progress.stepIndex] };
}

function chooseStep(optionId) {
  const active = requireActiveStep();
  const { session, progress, step } = active;
  if (step.kind === 'companion-interaction' || step.kind === 'recognize-letters') {
    throw new Error('请使用当前步骤对应的互动方式');
  }
  if (step.requireAudioPlayed && (progress.heardAudioStepIds || []).indexOf(step.id) === -1) {
    return {
      correct: false,
      completed: false,
      stepIndex: progress.stepIndex,
      message: '先点“听一听”，听过团团的问候再来选。',
      companionMessage: '我再读一次给你听，准备好就选一张卡。',
      companionEmotion: 'thinking'
    };
  }
  const option = step && step.options.find((item) => item.id === optionId);
  if (!option) {
    throw new Error('请选择当前步骤中的卡片');
  }
  if (option.id !== step.correctOptionId) {
    return {
      correct: false,
      completed: false,
      stepIndex: progress.stepIndex,
      message: step.retryMessage || session.adventure.retryDialogue,
      companionMessage: session.adventure.retryDialogue,
      companionEmotion: 'thinking'
    };
  }
  if (['learn-vocabulary', 'practice-sentence', 'listen-and-identify', 'speak-choice', 'letter-match'].indexOf(step.kind) === -1) {
    throw new Error('Welcome 当前学习步骤无效');
  }
  return advanceTaskStep(
    session,
    step.correctMessage || '答对啦！我们一起找到新的线索。',
    option.audioSrc,
    step.correctDialogue || session.adventure.successDialogue
  );
}

function completeInteractionStep(interactionResult) {
  const active = requireActiveStep();
  if (active.step.kind !== 'companion-interaction') {
    throw new Error('当前步骤不是团团互动');
  }
  const interactedToday = Boolean(interactionResult && (
    interactionResult.interactionAccepted || interactionResult.dailyInteractionCount > 0
  ));
  if (!interactedToday) {
    return {
      correct: false,
      completed: false,
      stepIndex: active.progress.stepIndex,
      message: '团团还在休息一小会儿，等一下再轻轻点它吧。',
      companionMessage: active.session.adventure.retryDialogue,
      companionEmotion: 'thinking'
    };
  }
  const message = interactionResult.dailyLimitReached
    ? '今天的互动次数用完啦，明天再来找团团也可以；这次学习进度已经记下。'
    : '你和团团一起完成了这次小挑战！';
  return advanceTaskStep(active.session, message, '', active.session.adventure.completionDialogue);
}

// 听力选项必须先由孩子主动播放本步骤的本地授权音频。
function markCurrentAudioPlayed() {
  const active = requireActiveStep();
  if (!active.step.requireAudioPlayed || !active.step.audioSrc) {
    return false;
  }
  const heardAudioStepIds = Array.isArray(active.progress.heardAudioStepIds)
    ? active.progress.heardAudioStepIds.slice() : [];
  if (heardAudioStepIds.indexOf(active.step.id) === -1) {
    heardAudioStepIds.push(active.step.id);
    updateState((draft) => {
      const task = draft.learningState.taskProgressById[active.session.taskId];
      task.heardAudioStepIds = heardAudioStepIds;
      task.updatedAt = new Date().toISOString();
    });
  }
  return true;
}

function selectWelcomeLetter(letter) {
  const active = requireActiveStep();
  if (active.step.kind !== 'recognize-letters' || active.step.letters.indexOf(letter) === -1) {
    throw new Error('请选择字母卡上的字母');
  }
  const selected = Array.isArray(active.progress.selectedLetterIds)
    ? active.progress.selectedLetterIds.slice() : [];
  if (selected.indexOf(letter) !== -1) {
    return {
      correct: true,
      completed: false,
      selectedLetterCount: selected.length,
      totalLetters: active.step.letters.length,
      message: `字母 ${letter} 已经找到啦。`
    };
  }
  selected.push(letter);
  updateState((draft) => {
    const task = draft.learningState.taskProgressById[active.session.taskId];
    task.selectedLetterIds = selected;
    task.updatedAt = new Date().toISOString();
  });
  if (selected.length === active.step.letters.length) {
    return advanceTaskStep(active.session, '26个字母朋友都见到啦！');
  }
  return {
    correct: true,
    completed: false,
    selectedLetterCount: selected.length,
    totalLetters: active.step.letters.length,
    message: `又找到一个字母朋友！${selected.length} / ${active.step.letters.length}`
  };
}

module.exports = {
  TASK_ID: WELCOME_TASK_ID,
  getTaskView,
  getWelcomeProgress,
  startTask,
  chooseStep,
  completeInteractionStep,
  markCurrentAudioPlayed,
  selectWelcomeLetter
};
