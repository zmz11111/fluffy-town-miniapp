const { getGameState, updateGameState, recordTaskCompletedInState } = require('../../game/state');
const { applyReward, applyRewardToGameState } = require('../../reward/reward-manager');
const { GAME_ID, TASK_ID, REWARD_ID, ROUND_DEFINITIONS, getRound } = require('./data');

// 完成任务后补发星星；重复调用不会重复领奖。
function ensureGameReward() {
  const state = getGameState();
  if (state.completedTaskIds.indexOf(TASK_ID) !== -1) {
    applyReward(REWARD_ID);
  }
}

// 只返回页面所需的题面，不暴露正确图片 ID。
function getGameView() {
  const state = getGameState();
  if (state.completedTaskIds.indexOf(TASK_ID) !== -1) {
    ensureGameReward();
    return { status: 'completed', total: ROUND_DEFINITIONS.length };
  }
  const session = state.currentGame;
  if (!session || session.gameId !== GAME_ID) {
    return { status: 'ready', total: ROUND_DEFINITIONS.length };
  }
  const round = getRound(session.roundIndex);
  if (!round) {
    throw new Error('小游戏回合位置无效');
  }
  return {
    status: 'playing',
    roundNumber: session.roundIndex + 1,
    total: ROUND_DEFINITIONS.length,
    audioSrc: round.audioSrc,
    fallbackWord: round.fallbackWord,
    options: round.options
  };
}

// 任务由剧情场景触发后才可开始；已有回合从本地进度恢复。
function startGame() {
  const state = getGameState();
  if (state.triggeredTaskIds.indexOf(TASK_ID) === -1) {
    throw new Error('请先在故事里找到线索');
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

// 错误选择保留当前回合；正确选择推进回合，末轮完成任务并发奖。
function chooseImage(wordId) {
  const state = getGameState();
  const session = state.currentGame;
  if (!session || session.gameId !== GAME_ID) {
    throw new Error('请先开始听音找图任务');
  }
  const round = getRound(session.roundIndex);
  if (!round || !round.options.some((item) => item.wordId === wordId)) {
    throw new Error('请选择当前回合的一张图片');
  }
  if (wordId !== round.correctWordId) {
    updateGameState((draft) => { draft.currentGame.wrongAttempts += 1; });
    return { correct: false, completed: false, message: '这张图有点像线索。再听一次，我们继续找！' };
  }

  const isFinalRound = session.roundIndex === ROUND_DEFINITIONS.length - 1;
  updateGameState((draft) => {
    draft.currentGame.correctCount += 1;
    if (isFinalRound) {
      draft.currentGame = null;
      recordTaskCompletedInState(draft, TASK_ID);
      applyRewardToGameState(draft, REWARD_ID);
    } else {
      draft.currentGame.roundIndex += 1;
    }
  });
  return {
    correct: true,
    completed: isFinalRound,
    message: isFinalRound ? '三张图片都找到了！我们回故事里看看。' : '找到了！一起听下一条线索。'
  };
}

module.exports = { getGameView, startGame, chooseImage, ensureGameReward };
