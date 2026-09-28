const { WORDS } = require('../../english/words');

const GAME_ID = 'demo-grade-3:find-cookie-game';
const TASK_ID = 'demo-grade-3:find-cookie';
const REWARD_ID = 'demo-grade-3:reward-star-001';

// 三轮听音找图只使用本项目的测试词和原创占位图片。
const ROUND_DEFINITIONS = [
  { id: 'round-star', correctWordId: 'word-star', optionWordIds: ['word-cookie', 'word-star', 'word-dog'] },
  { id: 'round-cat', correctWordId: 'word-cat', optionWordIds: ['word-dog', 'word-cat', 'word-star'] },
  { id: 'round-cookie', correctWordId: 'word-cookie', optionWordIds: ['word-cookie', 'word-dog', 'word-cat'] }
];

// 内容模块负责把稳定单词 ID 解析为测试数据，页面不接触正确答案。
function getWord(wordId) {
  const word = WORDS.find((item) => item.id === wordId);
  if (!word || !word.audioSrc || !word.imageSrc) {
    throw new Error('小游戏词条资源不完整');
  }
  return word;
}

function getRound(roundIndex) {
  const round = ROUND_DEFINITIONS[roundIndex];
  if (!round) {
    return null;
  }
  const target = getWord(round.correctWordId);
  return {
    id: round.id,
    correctWordId: round.correctWordId,
    audioSrc: target.audioSrc,
    fallbackWord: target.english,
    options: round.optionWordIds.map((wordId) => {
      const word = getWord(wordId);
      return { wordId: word.id, imageSrc: word.imageSrc, altText: `${word.chinese}图片` };
    })
  };
}

module.exports = { GAME_ID, TASK_ID, REWARD_ID, ROUND_DEFINITIONS, getRound };
