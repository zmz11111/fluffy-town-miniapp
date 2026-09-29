const { validateCatalog } = require('./schema/validate');
const { DEMO_TEXTBOOK } = require('./textbooks/demo-grade3-volume1');
const { DEMO_UNIT_1 } = require('./units/demo-grade3-unit1');
const { DEMO_VOCABULARY } = require('./vocabulary/demo-grade3-unit1');
const { DEMO_SENTENCES } = require('./sentences/demo-grade3-unit1');

// 内容目录只收录本阶段的原创模拟教材；后续教材须先核实授权与审校状态。
const catalog = {
  textbooks: [DEMO_TEXTBOOK],
  units: [DEMO_UNIT_1],
  vocabulary: DEMO_VOCABULARY,
  sentences: DEMO_SENTENCES
};
validateCatalog(catalog);

// 所有查询均返回副本，调用方不能改写教材定义。
function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function findById(items, id) {
  return items.find((item) => item.id === id) || null;
}

function listTextbooks() {
  return copy(catalog.textbooks);
}

function getTextbook(textbookId) {
  const book = findById(catalog.textbooks, textbookId);
  return book ? copy(book) : null;
}

function listUnits(textbookId) {
  const book = findById(catalog.textbooks, textbookId);
  return book ? copy(book.unitIds.map((id) => findById(catalog.units, id))) : [];
}

function getUnit(unitId) {
  const unit = findById(catalog.units, unitId);
  return unit ? copy(unit) : null;
}

function listVocabulary(unitId) {
  const unit = findById(catalog.units, unitId);
  return unit ? copy(unit.vocabularyIds.map((id) => findById(catalog.vocabulary, id))) : [];
}

function listSentences(unitId) {
  const unit = findById(catalog.units, unitId);
  return unit ? copy(unit.sentenceIds.map((id) => findById(catalog.sentences, id))) : [];
}

function getVocabulary(wordId) {
  const word = findById(catalog.vocabulary, wordId);
  return word ? copy(word) : null;
}

function getSentence(sentenceId) {
  const sentence = findById(catalog.sentences, sentenceId);
  return sentence ? copy(sentence) : null;
}

// 学习接口投影到现有 EnglishWord 字段，不调用旧学习记录写入函数。
function getLearningWords(unitId) {
  const unit = findById(catalog.units, unitId);
  if (!unit) {
    return [];
  }
  const book = findById(catalog.textbooks, unit.textbookId);
  return listVocabulary(unitId).map((word) => ({
    id: word.id,
    grade: book.grade,
    courseId: book.id,
    unitId: unit.id,
    english: word.english,
    chinese: word.chinese,
    audioSrc: word.audioSrc,
    imageSrc: word.imageSrc,
    difficulty: word.difficulty,
    source: { kind: book.source.kind, reference: book.source.reference }
  }));
}

// 连接接口先检查词条确实属于该单元，防止跨教材混用。
function requireUnitWord(unitId, wordId) {
  const unit = findById(catalog.units, unitId);
  const word = findById(catalog.vocabulary, wordId);
  if (!unit || !word || word.unitId !== unit.id || unit.vocabularyIds.indexOf(word.id) === -1) {
    throw new Error('单元与单词不匹配');
  }
  return { unit, word };
}

// 剧情草案含现有场景可识别的 taskTriggers；是否发布由剧情内容审核决定。
function buildStoryTask(unitId, wordId) {
  const { word } = requireUnitWord(unitId, wordId);
  const taskId = `${word.id}:story-task`;
  return {
    id: taskId,
    unitId,
    vocabularyId: word.id,
    kind: 'explore-word',
    suggestedPrompt: `团团：我们一起听听 ${word.english}，看看会发现什么？`,
    taskTriggers: [{ when: 'enter', taskId }],
    status: 'draft'
  };
}

// 听音选词题包供未来小游戏规则层使用；正确答案不得直接交给页面。
function buildMiniGameQuestion(unitId, wordId) {
  const { unit, word } = requireUnitWord(unitId, wordId);
  if (!word.audioSrc) {
    throw new Error('该单词缺少已授权音频，不能生成听音题');
  }
  const distractors = unit.vocabularyIds.filter((id) => id !== word.id).slice(0, 2);
  if (distractors.length < 2) {
    throw new Error('单元词条不足，不能生成三选一题');
  }
  const optionWordIds = distractors.slice();
  optionWordIds.splice((unit.vocabularyIds.indexOf(word.id) + 1) % 3, 0, word.id);
  return {
    id: `${word.id}:listen-question`,
    unitId,
    gameType: 'listen-select-text',
    audioSrc: word.audioSrc,
    correctWordId: word.id,
    optionWordIds,
    options: optionWordIds.map((id) => {
      const option = findById(catalog.vocabulary, id);
      return { wordId: option.id, text: option.english };
    }),
    status: 'draft'
  };
}

// 奖励任务只是待登记定义；现有 reward-manager 不接受未入目录的奖励 ID。
function buildRewardTask(unitId, wordId) {
  const { word } = requireUnitWord(unitId, wordId);
  return {
    id: `${word.id}:reward-task`,
    unitId,
    condition: { kind: 'word-learned', vocabularyId: word.id },
    rewardDefinition: {
      id: `${word.id}:first-learn-star`,
      type: 'star',
      amount: 1,
      source: { kind: 'curriculum-demo', reference: word.id }
    },
    status: 'draft'
  };
}

module.exports = {
  listTextbooks,
  getTextbook,
  listUnits,
  getUnit,
  listVocabulary,
  listSentences,
  getVocabulary,
  getSentence,
  getLearningWords,
  buildStoryTask,
  buildMiniGameQuestion,
  buildRewardTask
};
