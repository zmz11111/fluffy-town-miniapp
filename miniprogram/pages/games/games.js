const { startGame, chooseImage } = require('../../games/find-cookie/game-manager');
const { getGameState } = require('../../game/state');
const { REWARD_ID, TASK_ID } = require('../../games/find-cookie/data');
const { getRewardDefinition } = require('../../reward/reward-manager');

Page({
  data: {
    status: 'loading',
    roundNumber: 0,
    total: 0,
    options: [],
    audioSrc: '',
    fallbackWord: '',
    audioFailed: false,
    message: '听一听，找出对应的图片。',
    foundCount: 0,
    taskStatus: '',
    nextStep: '',
    rewardStars: 0
  },

  onLoad() {
    // 音频实例只供播放；答题进度始终由小游戏管理器保存。
    this.audio = wx.createInnerAudioContext();
    this.audio.onError(() => {
      this.setData({ audioFailed: true, message: '声音暂时不能播放，看看单词再找图片吧。' });
    });
  },

  onShow() {
    try {
      this.showRound(startGame());
    } catch (error) {
      this.setData({ status: 'locked', message: '先到故事里寻找线索，再来听音找图吧。' });
    }
  },

  onUnload() {
    if (this.audio) {
      this.audio.destroy();
    }
  },

  showRound(view) {
    // 已完成数量与奖励只从管理器状态推导，页面不直接保存游戏数据。
    const state = getGameState();
    const completed = state.completedTaskIds.indexOf(TASK_ID) !== -1;
    const reward = getRewardDefinition(REWARD_ID);
    const rewardStars = reward && state.rewards.claimedRewardIds.indexOf(REWARD_ID) !== -1
      ? reward.amount : 0;
    this.setData({
      status: view.status,
      roundNumber: view.roundNumber || 0,
      total: view.total,
      options: view.options || [],
      audioSrc: view.audioSrc || '',
      fallbackWord: view.fallbackWord || '',
      audioFailed: false,
      foundCount: completed ? view.total : Math.max(0, (view.roundNumber || 1) - 1),
      taskStatus: completed ? '线索任务：已完成' : '线索任务：进行中',
      nextStep: completed ? '下一步：回到故事，告诉米米新发现。' : '下一步：听单词，点对应的图片。',
      rewardStars,
      message: completed ? '团团：我们一起找齐线索啦！' : '团团：听一听，我们一起找线索。'
    });
  },

  playWord() {
    if (!this.audio || !this.data.audioSrc) {
      return;
    }
    this.audio.stop();
    this.audio.src = this.data.audioSrc;
    this.audio.play();
  },

  // 只传词条 ID 给规则层；答错时保留回合并鼓励重听。
  selectImage(event) {
    try {
      const result = chooseImage(event.currentTarget.dataset.wordId);
      this.showRound(startGame());
      this.setData({ message: result.completed
        ? '团团：我们一起找齐线索啦！米米一定很想听。'
        : result.correct
          ? '团团：好发现！我们再找下一条线索吧。'
          : '团团：没关系，再听一遍，我们一起找。' });
      if (result.correct && !result.completed) {
        this.playWord();
      }
    } catch (error) {
      this.setData({ message: '图片暂时没选上，再试一次吧。' });
    }
  },

  backStory() {
    wx.navigateBack();
  },

  openStory() {
    wx.navigateTo({ url: '/pages/story/story' });
  }
});
