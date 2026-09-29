const { WORDS } = require('../../english/words');
const { getLearnedWordIds, markWordLearned } = require('../../english/learning');
const {
  startLearningTask,
  chooseIntroduction
} = require('../../english/unit1-learning');

Page({
  data: {
    unit1Mode: false,
    unit1Status: 'ready',
    unit1Title: '',
    unit1Keyword: null,
    unit1Prompt: '',
    unit1Support: '',
    unit1Options: [],
    unit1Message: '',
    words: [],
    completed: 0,
    total: WORDS.length
  },

  onLoad(options) {
    this.unit1Mode = Boolean(options && options.mode === 'unit1-core');
    if (this.unit1Mode) {
      wx.setNavigationBarTitle({ title: '团团的介绍卡' });
    }
  },

  // Unit 1 任务与原有测试词卡共用学习页面，但进度分别由各自模块管理。
  onShow() {
    if (this.unit1Mode) {
      this.refreshUnit1Task();
      return;
    }
    this.refreshWords();
  },

  refreshUnit1Task() {
    try {
      const view = startLearningTask();
      this.setData({
        unit1Mode: true,
        unit1Status: view.status,
        unit1Title: view.title || '',
        unit1Keyword: view.keyword || null,
        unit1Prompt: view.prompt || '',
        unit1Support: view.support || '',
        unit1Options: view.options || [],
        unit1Message: view.status === 'completed' ? '这张介绍卡已经放好啦。' : '团团陪你一起看看。'
      });
    } catch (error) {
      this.setData({ unit1Mode: true, unit1Status: 'locked', unit1Message: '先回故事里看看团团的介绍卡吧。' });
    }
  },

  chooseIntroduction(event) {
    try {
      const result = chooseIntroduction(event.currentTarget.dataset.optionId);
      if (result.completed) {
        this.setData({ unit1Status: 'completed', unit1Message: result.message });
        this.returnTimer = setTimeout(() => this.backToStory(), 700);
        return;
      }
      this.setData({ unit1Message: result.message });
    } catch (error) {
      this.setData({ unit1Message: '介绍卡暂时没有选上，再试一次吧。' });
    }
  },

  // 根据本地记录计算按钮状态，避免页面内另存一份进度。
  refreshWords() {
    const learnedIds = getLearnedWordIds();
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

  onUnload() {
    if (this.returnTimer) {
      clearTimeout(this.returnTimer);
      this.returnTimer = null;
    }
  },

  backToStory() {
    wx.navigateBack({ delta: 1 });
  },

  // 返回首页后首页的 onShow 会更新任务进度。
  backHome() {
    wx.navigateBack({ delta: 1 });
  }
});
