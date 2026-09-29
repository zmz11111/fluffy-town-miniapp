const { getGameState, updateGameState } = require('../../game/state');
const { UNIT1_PREVIEW } = require('../../curriculum/unit1/preview-content');
const { GAME_ID, TASK_ID, getRound } = require('./data');

// 题面不包含正确选项 ID，选择结果仅写入统一游戏状态。
function getGameView() {
  const state = getGameState();
  if (state.completedTaskIds.indexOf(TASK_ID) !== -1) {
    return { status: 'completed', total: UNIT1_PREVIEW.greetingGame.rounds.length };
  }
  const session = state.currentGame;
  if (!session || session.gameId !== GAME_ID) {
    return { status: 'ready', total: UNIT1_PREVIEW.greetingGame.rounds.length };
  }
  const round = getRound(session.roundIndex);
  if (!round) {
    throw new Error('问候卡回合位置无效');
  }
  return {
    status: 'playing',
    title: UNIT1_PREVIEW.greetingGame.title,
    prompt: UNIT1_PREVIEW.greetingGame.prompt,
    roundNumber: session.roundIndex + 1,
    total: UNIT1_PREVIEW.greetingGame.rounds.length,
    audioSrc: round.audioSrc,
    fallbackWord: round.fallbackWord,
    options: round.options.map((option) => ({ id: option.id, label: option.label, chinese: option.chinese }))
  };
}

// 剧情场景触发后才能开始；当前回合在本地状态中可恢复。
function startGame() {
  const state = getGameState();
  if (state.triggeredTaskIds.indexOf(TASK_ID) === -1) {
    throw new Error('请先在故事里找到问候卡');
  }
  if (state.completedTaskIds.indexOf(TASK_ID) !== -1) {
    return getGameView();
  }
  if (state.currentGame && state.currentGame.gameId !== GAME_ID) {
    throw new Error('另一个任务正在进行');
  }
  if (!state.currentGame) {
    updateGameState((draft) => {
      draft.currentGame = { gameId: GAME_ID, roundIndex: 0, correctCount: 0, wrongAttempts: 0 };
    });
  }
  return getGameView();
}

// 答错可以重听；完成两张卡后只登记任务，不提前发放章节星星。
function chooseGreetingCard(optionId) {
  const state = getGameState();
  if (state.completedTaskIds.indexOf(TASK_ID) !== -1) {
    return { correct: true, completed: true, message: '问候卡都放好啦，我们回去告诉团团。' };
  }
  const session = state.currentGame;
  if (!session || session.gameId !== GAME_ID) {
    throw new Error('请先开始问候卡任务');
  }
  const round = getRound(session.roundIndex);
  if (!round || !round.options.some((option) => option.id === optionId)) {
    throw new Error('请选择一张问候卡');
  }
  if (optionId !== round.correctOptionId) {
    updateGameState((draft) => { draft.currentGame.wrongAttempts += 1; });
    return { correct: false, completed: false, message: '这张卡也很熟悉，再听一次，我们一起找。' };
  }

  const isFinalRound = session.roundIndex === UNIT1_PREVIEW.greetingGame.rounds.length - 1;
  updateGameState((draft) => {
    draft.currentGame.correctCount += 1;
    if (isFinalRound) {
      draft.currentGame = null;
      if (draft.completedTaskIds.indexOf(TASK_ID) === -1) {
        draft.completedTaskIds.push(TASK_ID);
      }
    } else {
      draft.currentGame.roundIndex += 1;
    }
  });
  return {
    correct: true,
    completed: isFinalRound,
    message: isFinalRound ? '两张问候卡都找到了！回去看看朋友墙吧。' : '找到了！我们再听一张。'
  };
}

module.exports = { GAME_ID, TASK_ID, getGameView, startGame, chooseGreetingCard };
