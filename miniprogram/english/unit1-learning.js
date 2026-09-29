const { getGameState, updateGameState } = require('../game/state');
const { UNIT1_PREVIEW } = require('../curriculum/unit1/preview-content');

const TASK_ID = UNIT1_PREVIEW.coreTaskId;

// 页面只收到题面和选项，不接触正确答案或存档对象。
function getLearningTaskView() {
  const state = getGameState();
  if (state.completedTaskIds.indexOf(TASK_ID) !== -1) {
    return { status: 'completed', title: UNIT1_PREVIEW.coreTask.title };
  }
  const session = state.currentGame;
  if (!session || session.gameId !== TASK_ID) {
    return { status: 'ready', title: UNIT1_PREVIEW.coreTask.title };
  }
  return {
    status: 'playing',
    title: UNIT1_PREVIEW.coreTask.title,
    keyword: UNIT1_PREVIEW.coreTask.keyword,
    prompt: UNIT1_PREVIEW.coreTask.prompt,
    support: UNIT1_PREVIEW.coreTask.support,
    options: UNIT1_PREVIEW.coreTask.options.map((option) => ({ id: option.id, label: option.label }))
  };
}

// 只有剧情触发后才能开始；中断后依赖统一 currentGame 状态恢复。
function startLearningTask() {
  const state = getGameState();
  if (state.triggeredTaskIds.indexOf(TASK_ID) === -1) {
    throw new Error('请先在故事里看看团团的介绍卡');
  }
  if (state.completedTaskIds.indexOf(TASK_ID) !== -1) {
    return getLearningTaskView();
  }
  if (state.currentGame && state.currentGame.gameId !== TASK_ID) {
    throw new Error('另一个学习任务正在进行');
  }
  if (!state.currentGame) {
    updateGameState((draft) => {
      draft.currentGame = { gameId: TASK_ID, roundIndex: 0, correctCount: 0, wrongAttempts: 0 };
    });
  }
  return getLearningTaskView();
}

// 错误选择保留当前任务并给线索；正确选择只登记一次学习任务完成。
function chooseIntroduction(optionId) {
  const state = getGameState();
  if (state.completedTaskIds.indexOf(TASK_ID) !== -1) {
    return { correct: true, completed: true, message: UNIT1_PREVIEW.coreTask.feedback };
  }
  if (!state.currentGame || state.currentGame.gameId !== TASK_ID) {
    throw new Error('请先开始团团的介绍卡任务');
  }
  const optionExists = UNIT1_PREVIEW.coreTask.options.some((option) => option.id === optionId);
  if (!optionExists) {
    throw new Error('请选择一张介绍卡');
  }
  if (optionId !== UNIT1_PREVIEW.coreTask.correctOptionId) {
    updateGameState((draft) => { draft.currentGame.wrongAttempts += 1; });
    return { correct: false, completed: false, message: UNIT1_PREVIEW.coreTask.retryFeedback };
  }

  updateGameState((draft) => {
    draft.currentGame = null;
    if (draft.completedTaskIds.indexOf(TASK_ID) === -1) {
      draft.completedTaskIds.push(TASK_ID);
    }
  });
  return { correct: true, completed: true, message: UNIT1_PREVIEW.coreTask.feedback };
}

module.exports = { TASK_ID, getLearningTaskView, startLearningTask, chooseIntroduction };
