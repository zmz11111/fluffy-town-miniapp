const { loadState, updateState } = require('../storage/local');
const { getGameState } = require('../game/state');
const { WELCOME_PREVIEW, WELCOME_KNOWLEDGE } = require('../curriculum/welcome/preview-content');
const { applyTaskStarted, applyTaskStep, applyTaskCompleted } = require('./learning-state');

const TASK_ID = WELCOME_PREVIEW.taskId;

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function getTaskView() {
  const state = loadState();
  const progress = state.learningState.taskProgressById[TASK_ID];
  if (progress && progress.status === 'completed') {
    return {
      status: 'completed',
      title: WELCOME_PREVIEW.taskTitle,
      stepIndex: WELCOME_PREVIEW.steps.length,
      totalSteps: WELCOME_PREVIEW.steps.length
    };
  }
  const stepIndex = progress ? progress.stepIndex : 0;
  const step = WELCOME_PREVIEW.steps[stepIndex];
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
  return {
    status: 'playing',
    title: WELCOME_PREVIEW.taskTitle,
    stepIndex,
    totalSteps: WELCOME_PREVIEW.steps.length,
    step: visibleStep
  };
}

// 只有故事触发后才能开始；重新进入页面时按已保存的步骤恢复。
function startTask() {
  const state = getGameState();
  if (state.triggeredTaskIds.indexOf(TASK_ID) === -1) {
    throw new Error('请先和团团开始 Welcome');
  }
  const progress = loadState().learningState.taskProgressById[TASK_ID];
  if (!progress || progress.status !== 'completed') {
    applyTaskStartForCurrentStep(progress ? progress.stepIndex : 0);
  }
  return getTaskView();
}

function applyTaskStartForCurrentStep(stepIndex) {
  const now = new Date().toISOString();
  updateState((draft) => {
    applyTaskStarted(draft.learningState, TASK_ID, stepIndex, now);
  });
}

function completeTask(now) {
  updateState((draft) => {
    applyTaskCompleted(draft.learningState, TASK_ID, now);
    if (draft.gameState.completedTaskIds.indexOf(TASK_ID) === -1) {
      draft.gameState.completedTaskIds.push(TASK_ID);
    }
  });
}

function advanceTaskStep(message, audioSrc) {
  const progress = loadState().learningState.taskProgressById[TASK_ID];
  const now = new Date().toISOString();
  const nextStepIndex = progress.stepIndex + 1;
  if (nextStepIndex >= WELCOME_PREVIEW.steps.length) {
    completeTask(now);
    return {
      correct: true,
      completed: true,
      stepIndex: WELCOME_PREVIEW.steps.length,
      message: message || 'Welcome 的学习任务完成啦，我们回故事告诉团团吧。',
      audioSrc: audioSrc || ''
    };
  }
  updateState((draft) => {
    applyTaskStep(draft.learningState, TASK_ID, nextStepIndex, now);
  });
  return {
    correct: true,
    completed: false,
    stepIndex: nextStepIndex,
    message: message || '我们一起发现了新的表达。',
    audioSrc: audioSrc || ''
  };
}

function requireActiveStep() {
  const state = loadState();
  const progress = state.learningState.taskProgressById[TASK_ID];
  if (progress && progress.status === 'completed') {
    return null;
  }
  if (state.gameState.triggeredTaskIds.indexOf(TASK_ID) === -1 || !progress || progress.status !== 'in_progress') {
    throw new Error('请先开始 Welcome 学习任务');
  }
  return { progress, step: WELCOME_PREVIEW.steps[progress.stepIndex] };
}

function chooseStep(optionId) {
  const active = requireActiveStep();
  if (!active) {
    return { completed: true, stepIndex: WELCOME_PREVIEW.steps.length, message: 'Welcome 已经完成啦。' };
  }
  const { step } = active;
  if (step.kind === 'companion-interaction') {
    throw new Error('请先和团团完成这一步互动');
  }
  const option = step && step.options.find((item) => item.id === optionId);
  if (!option) {
    throw new Error('请选择当前步骤中的卡片');
  }

  if (step.correctOptionId && option.id !== step.correctOptionId) {
    return { correct: false, completed: false, stepIndex: active.progress.stepIndex, message: step.retryMessage };
  }

  if (step.kind === 'learn-vocabulary') {
    return advanceTaskStep('我们先认识了几个新词，接下来看看句子怎么说。');
  }
  if (step.kind === 'practice-sentence') {
    return advanceTaskStep('米米收到自我介绍啦！');
  }
  if (step.kind === 'listen-and-identify') {
    return advanceTaskStep('团团听到你的问候啦！', option.audioSrc);
  }
  throw new Error('Welcome 当前学习步骤无效');
}

function completeInteractionStep(interactionResult) {
  const active = requireActiveStep();
  if (!active) {
    return { completed: true, stepIndex: WELCOME_PREVIEW.steps.length, message: 'Welcome 已经完成啦。' };
  }
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
      message: '团团还在休息一小会儿，等一下再轻轻点它吧。'
    };
  }
  const message = interactionResult.dailyLimitReached
    ? '今天已经和团团打过招呼啦，这一步也完成了。'
    : interactionResult.feedbackLevel === 'high'
      ? '团团开心地回应了你！Welcome 学习任务完成啦。'
      : '团团笑着点点头，Welcome 学习任务完成啦。';
  return advanceTaskStep(message);
}

module.exports = { TASK_ID, getTaskView, startTask, chooseStep, completeInteractionStep };
