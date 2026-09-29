const { CHAPTER_001 } = require('../../story/chapters/chapter_001');
const { startChapter, getCurrentStory, advanceStory } = require('../../story/story-manager');
const { getGameState } = require('../../game/state');
const { getStoryAvatar, TREEHOUSE_BACKGROUND } = require('../../assets/visuals');
const { TASK_ID, REWARD_ID } = require('../../games/find-cookie/data');
const { getRewardDefinition } = require('../../reward/reward-manager');

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
    taskStatus: '',
    nextStep: '',
    gameRewardStars: 0,
    chapterRewardStars: 0,
    mimiUnlocked: false,
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
    // 任务与奖励只读取既有状态；页面不发放奖励，也不改动剧情游标。
    const taskCompleted = state.completedTaskIds.indexOf(TASK_ID) !== -1;
    const gameReward = getRewardDefinition(REWARD_ID);
    const chapterReward = getRewardDefinition('demo-grade-3:reward-chapter-001-stars');
    const claimed = state.rewards.claimedRewardIds;
    this.setData({
      completed: Boolean(completed),
      stars: state.stars,
      taskStatus: taskCompleted ? '线索任务：已完成' : '线索任务：待探索',
      nextStep: completed ? '下一步：去伙伴页看看米米。'
        : current && current.scene.requiredTaskId && !taskCompleted
          ? '下一步：读完对白，一起去听音找图。'
          : '下一步：点“继续故事”，看看会发现什么。',
      gameRewardStars: gameReward && claimed.indexOf(REWARD_ID) !== -1 ? gameReward.amount : 0,
      chapterRewardStars: chapterReward && claimed.indexOf(chapterReward.id) !== -1 ? chapterReward.amount : 0,
      mimiUnlocked: state.companions.mimi.unlocked,
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
