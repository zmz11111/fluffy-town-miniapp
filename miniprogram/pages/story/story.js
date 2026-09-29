const { CHAPTER_001 } = require('../../story/chapters/chapter_001');
const { startChapter, getCurrentStory, advanceStory } = require('../../story/story-manager');
const { getGameState } = require('../../game/state');
const { getStoryAvatar, TREEHOUSE_BACKGROUND } = require('../../assets/visuals');

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
    notice: '',
    sceneSrc: TREEHOUSE_BACKGROUND,
    sceneImageFailed: false,
    avatarSrc: '',
    avatarAlt: '',
    avatarFallbackText: '',
    avatarImageFailed: false
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
    const avatar = current
      ? getStoryAvatar(current.dialogue.speakerId, state.companions.tuantuan.emotion)
      : null;
    this.setData({
      completed: Boolean(completed),
      stars: state.stars,
      sceneTitle: current ? current.scene.title : '',
      sceneNumber: current ? current.sceneIndex : CHAPTER_001.sceneIds.length,
      speaker: current ? ({ tuantuan: '团团', mimi: '米米', narrator: '故事' }[current.dialogue.speakerId] || '伙伴') : '',
      dialogue: current ? current.dialogue.text : '',
      avatarSrc: avatar ? avatar.src : '',
      avatarAlt: avatar ? avatar.alt : '',
      avatarFallbackText: avatar ? avatar.fallbackText : '',
      avatarImageFailed: false,
      notice: ''
    });
  },

  // 角色与背景资源可以独立替换；加载失败只影响展示，不影响剧情推进。
  onAvatarImageError() {
    this.setData({ avatarImageFailed: true });
  },

  onSceneImageError() {
    this.setData({ sceneImageFailed: true });
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

