const { CHAPTER_001 } = require('../../story/chapters/chapter_001');
const { startChapter, getCurrentStory, advanceStory } = require('../../story/story-manager');
const { getGameState } = require('../../game/state');

Page({
  data: {
    title: CHAPTER_001.title,
    sceneTitle: '',
    sceneNumber: 0,
    sceneTotal: CHAPTER_001.sceneIds.length,
    speaker: '',
    dialogue: '',
    completed: false,
    stars: 0,
    notice: ''
  },

  // 返回故事页时从管理器恢复游标，小游戏完成后即可接着推进。
  onShow() {
    try {
      startChapter(CHAPTER_001.id);
      this.refreshStory();
    } catch (error) {
      this.setData({ notice: '故事暂时无法打开，请稍后再试。' });
    }
  },

  refreshStory() {
    const state = getGameState();
    const current = getCurrentStory();
    const completed = state.chapterProgress[CHAPTER_001.id] &&
      state.chapterProgress[CHAPTER_001.id].status === 'completed';
    this.setData({
      completed: Boolean(completed),
      stars: state.stars,
      sceneTitle: current ? current.scene.title : '',
      sceneNumber: current ? current.sceneIndex : CHAPTER_001.sceneIds.length,
      speaker: current ? ({ tuantuan: '团团', mimi: '米米', narrator: '故事' }[current.dialogue.speakerId] || '伙伴') : '',
      dialogue: current ? current.dialogue.text : '',
      notice: ''
    });
  },

  // 剧情推进、任务门槛和章节奖励全部交给 story-manager。
  next() {
    try {
      const result = advanceStory();
      if (result.status === 'task_required') {
        wx.navigateTo({ url: '/pages/games/games' });
        return;
      }
      this.refreshStory();
    } catch (error) {
      this.setData({ notice: '这一页暂时走不过去，再试一次吧。' });
    }
  },

  openFriends() {
    wx.navigateTo({ url: '/pages/pets/pets' });
  },

  backHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
