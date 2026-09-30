const debug = require('../../debug/debug-manager');

Page({
  data: {
    snapshot: null,
    lessonNumber: 1,
    lessonOptions: ['第1课', '第2课', '第3课', '第4课', '第5课', '第6课', '第7课'],
    message: ''
  },

  onLoad() {
    if (!debug.isDevTools()) {
      wx.redirectTo({ url: '/pages/home/home' });
      return;
    }
    this.refresh();
  },

  refresh() {
    try { this.setData({ snapshot: debug.getSnapshot() }); }
    catch (error) { this.setData({ message: error.message }); }
  },

  // 所有按钮只调用独立调试模块，不直接改页面数据存档。
  run(action) {
    try {
      const snapshot = action();
      this.setData({ snapshot, message: '测试存档已更新，返回首页可查看效果。' });
    } catch (error) {
      this.setData({ message: error.message });
    }
  },

  resetWelcome() { this.run(debug.resetWelcome); },
  completeLesson() { this.run(debug.completeCurrentLesson); },
  unlockUnit1() { this.run(debug.unlockUnit1ForTest); },
  clearLearning() { this.run(debug.clearLearningSave); },
  clearCompanions() { this.run(debug.clearCompanionInteractions); },
  selectLesson(event) { this.setData({ lessonNumber: Number(event.detail.value) + 1 }); },
  jumpLesson() { this.run(() => debug.jumpToWelcomeLesson(this.data.lessonNumber)); }
});
