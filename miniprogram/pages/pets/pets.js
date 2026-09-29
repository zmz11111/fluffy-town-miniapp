const { getCharacterOverview, greetMimi } = require('../../pets/character-manager');
const { CHAPTER_001 } = require('../../story/chapters/chapter_001');
const { getNextCourseEntry, isWelcomeCompleted, getLearningState } = require('../../english/learning-state');
const { WELCOME_PREVIEW } = require('../../curriculum/welcome/preview-content');

Page({
  data: {
    tuantuan: {},
    mimi: {},
    welcomeCompleted: false,
    notice: ''
  },

  // 角色卡片读取合并视图，解锁状态由章节奖励更新。
  onShow() {
    this.refresh();
  },

  refresh() {
    try {
      const characters = getCharacterOverview();
      this.setData({
        tuantuan: characters.tuantuan,
        mimi: characters.mimi,
        welcomeCompleted: isWelcomeCompleted(),
        notice: ''
      });
    } catch (error) {
      this.setData({ notice: '伙伴档案暂时打不开。' });
    }
  },

  greet() {
    try {
      const result = greetMimi();
      this.refresh();
      const notice = result.greetingAccepted
        ? result.friendshipChange
          ? '米米眨眨眼：哼，我也正想和你打招呼呢！今天的招呼次数已经记下啦。'
          : '米米眨眨眼：你们已经是很好的伙伴啦！'
        : result.dailyLimitReached
          ? '今天和米米打招呼的次数用完啦，明天再来找她吧。'
          : '米米还在回应刚才的招呼，等一小会儿再试试。';
      this.setData({ notice });
    } catch (error) {
      this.setData({ notice: '先和团团一起完成第一章，再来认识米米吧。' });
    }
  },

  openStory() {
    const welcomeTask = getLearningState().taskProgressById[WELCOME_PREVIEW.taskId];
    if (!isWelcomeCompleted() && welcomeTask && welcomeTask.status === 'completed') {
      wx.navigateTo({ url: '/pages/learn/learn?mode=welcome' });
      return;
    }
    const chapterId = isWelcomeCompleted() ? CHAPTER_001.id : getNextCourseEntry().chapterId;
    wx.navigateTo({ url: `/pages/story/story?chapterId=${chapterId}` });
  }
});
