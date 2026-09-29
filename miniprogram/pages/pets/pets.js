const { getCharacterOverview, greetMimi } = require('../../pets/character-manager');
const { CHAPTER_001 } = require('../../story/chapters/chapter_001');
const { getNextCourseEntry, isWelcomeCompleted } = require('../../english/learning-state');

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
        welcomeCompleted: isWelcomeCompleted()
      });
    } catch (error) {
      this.setData({ notice: '伙伴档案暂时打不开。' });
    }
  },

  greet() {
    try {
      greetMimi();
      this.refresh();
      this.setData({ notice: '米米眨眨眼：哼，我也正想和你打招呼呢！' });
    } catch (error) {
      this.setData({ notice: '先和团团一起完成第一章，再来认识米米吧。' });
    }
  },

  openStory() {
    const chapterId = isWelcomeCompleted() ? CHAPTER_001.id : getNextCourseEntry().chapterId;
    wx.navigateTo({ url: `/pages/story/story?chapterId=${chapterId}` });
  }
});
