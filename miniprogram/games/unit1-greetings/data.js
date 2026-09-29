const { UNIT1_PREVIEW } = require('../../curriculum/unit1/preview-content');

const GAME_ID = UNIT1_PREVIEW.gameId;
const TASK_ID = UNIT1_PREVIEW.gameTaskId;

// 返回单轮题面时保留正确答案在业务层，页面只接收文字选项。
function getRound(roundIndex) {
  const definition = UNIT1_PREVIEW.greetingGame.rounds[roundIndex];
  if (!definition) {
    return null;
  }
  return {
    audioSrc: definition.audioSrc,
    fallbackWord: definition.fallbackWord,
    correctOptionId: definition.correctOptionId,
    options: definition.options.map((option) => ({
      id: option.id,
      label: option.label,
      chinese: option.chinese
    }))
  };
}

module.exports = { GAME_ID, TASK_ID, getRound };
