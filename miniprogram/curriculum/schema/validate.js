// 发布前检查教材内容的结构与交叉引用；本模块不接触玩家档案。
function requireCondition(condition, message) {
  if (!condition) {
    throw new Error(`教材内容无效：${message}`);
  }
}

function isId(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]*$/i.test(value);
}

function isText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDifficulty(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function isIdList(value) {
  return Array.isArray(value) && value.every(isId) && new Set(value).size === value.length;
}

// 静态资源允许缺省；正式发布还需检查路径对应的文件和素材授权。
function isAssetPath(value) {
  return value === null || (typeof value === 'string' && /^\/assets\/[a-z0-9/_-]+\.[a-z0-9]+$/i.test(value));
}

function validateTextbook(textbook) {
  requireCondition(textbook && isId(textbook.id), '教材 ID');
  requireCondition(isText(textbook.title) && isText(textbook.edition), '教材名称或版本');
  requireCondition(Number.isInteger(textbook.grade) && textbook.grade >= 1 && textbook.grade <= 12, '年级');
  requireCondition(isText(textbook.volume) && isText(textbook.contentVersion), '册别或内容版本');
  requireCondition(isIdList(textbook.unitIds) && textbook.unitIds.length > 0, '教材单元列表');
  const source = textbook.source;
  requireCondition(source && isText(source.kind) && isText(source.rightsStatus) &&
    isText(source.reviewStatus) && (source.reference === null || isText(source.reference)), '内容来源');
}

function validateUnit(unit) {
  requireCondition(unit && isId(unit.id) && isId(unit.textbookId), '单元标识');
  requireCondition(Number.isInteger(unit.number) && unit.number > 0, '单元序号');
  requireCondition(isText(unit.title) && isText(unit.topic) && isDifficulty(unit.difficulty), '单元主题或难度');
  requireCondition(isIdList(unit.vocabularyIds) && unit.vocabularyIds.length > 0, '单元词表');
  requireCondition(isIdList(unit.sentenceIds), '单元句型列表');
}

function validateWord(word) {
  requireCondition(word && isId(word.id) && isId(word.textbookId) && isId(word.unitId), '单词标识');
  requireCondition(isText(word.english) && isText(word.chinese) && isDifficulty(word.difficulty), '单词内容或难度');
  requireCondition(isAssetPath(word.audioSrc) && isAssetPath(word.imageSrc), '单词资源路径');
}

function validateSentence(sentence) {
  requireCondition(sentence && isId(sentence.id) && isId(sentence.textbookId) && isId(sentence.unitId), '句型标识');
  requireCondition(isText(sentence.text) && isText(sentence.meaning) &&
    isText(sentence.pattern) && isDifficulty(sentence.difficulty), '句型内容或难度');
  requireCondition(isIdList(sentence.vocabularyIds), '句型词条引用');
}

// 交叉引用必须落在同一教材和单元，避免多教材内容被意外混用。
function validateCatalog(catalog) {
  const { textbooks, units, vocabulary, sentences } = catalog;
  requireCondition(Array.isArray(textbooks) && Array.isArray(units) &&
    Array.isArray(vocabulary) && Array.isArray(sentences), '内容目录');
  textbooks.forEach(validateTextbook);
  units.forEach(validateUnit);
  vocabulary.forEach(validateWord);
  sentences.forEach(validateSentence);
  const all = textbooks.concat(units, vocabulary, sentences);
  requireCondition(new Set(all.map((item) => item.id)).size === all.length, '内容 ID 重复');
  const booksById = new Map(textbooks.map((item) => [item.id, item]));
  const unitsById = new Map(units.map((item) => [item.id, item]));
  const wordsById = new Map(vocabulary.map((item) => [item.id, item]));
  const sentencesById = new Map(sentences.map((item) => [item.id, item]));
  textbooks.forEach((book) => book.unitIds.forEach((unitId) => {
    requireCondition(unitsById.has(unitId) && unitsById.get(unitId).textbookId === book.id, '教材单元引用');
  }));
  units.forEach((unit) => {
    const book = booksById.get(unit.textbookId);
    requireCondition(book && book.unitIds.indexOf(unit.id) !== -1, '单元所属教材');
    unit.vocabularyIds.forEach((wordId) => {
      const word = wordsById.get(wordId);
      requireCondition(word && word.unitId === unit.id && word.textbookId === book.id, '单元单词引用');
    });
    unit.sentenceIds.forEach((sentenceId) => {
      const sentence = sentencesById.get(sentenceId);
      requireCondition(sentence && sentence.unitId === unit.id && sentence.textbookId === book.id, '单元句型引用');
      sentence.vocabularyIds.forEach((wordId) => {
        requireCondition(unit.vocabularyIds.indexOf(wordId) !== -1, '句型单词引用');
      });
    });
  });
  requireCondition(vocabulary.every((word) => {
    const unit = unitsById.get(word.unitId);
    return unit && unit.vocabularyIds.indexOf(word.id) !== -1;
  }), '未归属单词');
  requireCondition(sentences.every((sentence) => {
    const unit = unitsById.get(sentence.unitId);
    return unit && unit.sentenceIds.indexOf(sentence.id) !== -1;
  }), '未归属句型');
  return true;
}

module.exports = { validateCatalog };
