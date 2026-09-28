const { startGame, chooseImage } = require('../../games/find-cookie/game-manager');

Page({
  data: {
    status: 'loading',
    roundNumber: 0,
    total: 0,
    options: [],
    audioSrc: '',
    fallbackWord: '',
    audioFailed: false,
    message: '听一听，找出对应的图片。'
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
    this.setData({
      status: view.status,
      roundNumber: view.roundNumber || 0,
      total: view.total,
      options: view.options || [],
      audioSrc: view.audioSrc || '',
      fallbackWord: view.fallbackWord || '',
      audioFailed: false,
      message: view.status === 'completed' ? '线索都找到了！回去告诉米米吧。' : '听一听，找出对应的图片。'
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
      this.setData({ message: result.message });
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
