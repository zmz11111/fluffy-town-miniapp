const { WORDS } = require('./words');
const { loadState, updateState } = require('../storage/local');

/**
 * 学习记录包含知识点与课程维度，家长端未来可以读取摘要而无需访问页面内部状态。
 * @typedef {{id: string, wordId: string, courseId: string, grade: number, status: string, learnedAt: string}} LearningRecord
 */

// 汇总当前示例单元完成数量；真实教材接入时按课程和单元筛选。
function getLearningSummary() {
  const state = loadState();
  const learnedIds = state.progress.completedWordIds;
  return {
    completed: WORDS.filter((word) => learnedIds.indexOf(word.id) !== -1).length,
    total: WORDS.length
  };
}

// 标记词条时使用稳定 ID 去重，重复点击不会增加记录。
function markWordLearned(wordId) {
  const word = WORDS.find((item) => item.id === wordId);
  if (!word) {
    throw new Error('未知单词');
  }

  return updateState((draft) => {
    if (draft.progress.completedWordIds.indexOf(word.id) !== -1) {
      return;
    }

    const now = new Date().toISOString();
    draft.progress.completedWordIds.push(word.id);
    draft.progress.lastStudiedAt = now;
    draft.learningRecords.push({
      id: `learned:${word.id}`,
      wordId: word.id,
      courseId: word.courseId,
      grade: word.grade,
      status: 'learned',
      learnedAt: now
    });
  });
}

module.exports = { getLearningSummary, markWordLearned };
