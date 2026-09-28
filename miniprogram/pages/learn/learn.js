const { WORDS } = require('../../english/words');
const { markWordLearned } = require('../../english/learning');
const { loadState } = require('../../storage/local');

Page({
  data: {
    words: [],
    completed: 0,
    total: WORDS.length
  },

  // 预览页只展示示例词条和保存入口，正式题型留到后续 Sprint。
  onShow() {
    this.refreshWords();
  },

  // 根据本地记录计算按钮状态，避免页面内另存一份进度。
  refreshWords() {
    const learnedIds = loadState().progress.completedWordIds;
    this.setData({
      words: WORDS.map((word) => ({
        id: word.id,
        english: word.english,
        chinese: word.chinese,
        learned: learnedIds.indexOf(word.id) !== -1
      })),
      completed: WORDS.filter((word) => learnedIds.indexOf(word.id) !== -1).length
    });
  },

  // 点击“我认识了”写入一条去重的学习记录。
  markLearned(event) {
    try {
      markWordLearned(event.currentTarget.dataset.wordId);
      this.refreshWords();
      wx.showToast({ title: '已经记下啦', icon: 'none' });
    } catch (error) {
      wx.showToast({ title: '学习记录暂时无法保存', icon: 'none' });
    }
  },

  // 返回首页后首页的 onShow 会更新任务进度。
  backHome() {
    wx.navigateBack({ delta: 1 });
  }
});
