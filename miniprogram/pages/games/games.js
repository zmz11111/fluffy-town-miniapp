const { startGame, chooseImage } = require('../../games/find-cookie/game-manager');
const { getGameState } = require('../../game/state');
const { REWARD_ID, TASK_ID } = require('../../games/find-cookie/data');
const { getRewardDefinition } = require('../../reward/reward-manager');
const { getNextCourseEntry } = require('../../english/learning-state');
const {
  startGame: startGreetingGame,
  getGameView: getGreetingGameView,
  chooseGreetingCard
} = require('../../games/unit1-greetings/game-manager');

Page({
  data: {
    mode: 'cookie',
    status: 'loading',
    roundNumber: 0,
    total: 0,
    options: [],
    audioSrc: '',
    fallbackWord: '',
    audioFailed: false,
    submitting: false,
    message: '听一听，找出对应的图片。',
    foundCount: 0,
    taskStatus: '',
    nextStep: '',
    rewardStars: 0
  },

  onLoad(options) {
    this.gameMode = options && options.mode === 'unit1-greetings' ? 'unit1-greetings' : 'cookie';
    this.setData({ mode: this.gameMode });
    if (this.gameMode === 'unit1-greetings') {
      wx.setNavigationBarTitle({ title: '听听问候卡' });
    }
    // 音频实例只供播放；答题进度始终由小游戏管理器保存。
    this.audio = wx.createInnerAudioContext();
    this.audio.onError(() => {
      this.setData({
        audioFailed: true,
        message: this.gameMode === 'unit1-greetings'
          ? '声音暂时不能播放，可以看问候词后继续。'
          : '声音暂时不能播放，看看单词再找图片吧。'
      });
    });
  },

  onShow() {
    this.clearSubmitTimer();
    this.submitting = false;
    if (this.gameMode === 'unit1-greetings') {
      try {
        this.showGreetingGame(startGreetingGame());
      } catch (error) {
        this.setData({ status: 'locked', message: '先回故事里看看问候卡吧。' });
      }
      return;
    }
    try {
      this.showRound(startGame());
    } catch (error) {
      this.setData({ status: 'locked', message: '先到故事里寻找线索，再来听音找图吧。' });
    }
  },

  onUnload() {
    this.clearSubmitTimer();
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
      submitting: this.submitting,
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

  showGreetingGame(view) {
    const completed = view.status === 'completed';
    this.setData({
      mode: 'unit1-greetings',
      status: view.status,
      roundNumber: view.roundNumber || 0,
      total: view.total,
      options: view.options || [],
      submitting: this.submitting,
      audioSrc: view.audioSrc || '',
      fallbackWord: view.fallbackWord || '',
      audioFailed: false,
      rewardStars: 0,
      foundCount: completed ? view.total : Math.max(0, (view.roundNumber || 1) - 1),
      taskStatus: completed ? '问候卡：已放好' : '问候卡：一起寻找中',
      nextStep: completed ? '下一步：回故事看看朋友墙。' : '下一步：听一听，再选问候卡。',
      message: completed ? '团团：两张卡都找到啦！' : '团团：我们慢慢听，可以再放一次。'
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
    if (this.isSubmittingLocked()) {
      return;
    }
    this.lockSubmitting();
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
    } finally {
      this.releaseSubmittingAfterDelay();
    }
  },

  chooseGreeting(event) {
    if (this.isSubmittingLocked()) {
      return;
    }
    this.lockSubmitting();
    try {
      const result = chooseGreetingCard(event.currentTarget.dataset.optionId);
      this.showGreetingGame(getGreetingGameView());
      this.setData({ message: result.message });
    } catch (error) {
      this.setData({ message: '问候卡暂时没有放好，再试一次吧。' });
    } finally {
      this.releaseSubmittingAfterDelay();
    }
  },

  backStory() {
    wx.navigateBack();
  },

  openStory() {
    if (getGameState().currentStory) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    const chapterId = getNextCourseEntry().chapterId;
    wx.navigateTo({ url: `/pages/story/story?chapterId=${chapterId}` });
  },

  isSubmittingLocked() {
    return Boolean(this.submitting || (this.lastChoiceAt && Date.now() - this.lastChoiceAt < 300));
  },

  lockSubmitting() {
    this.submitting = true;
    this.lastChoiceAt = Date.now();
    this.setData({ submitting: true });
  },

  releaseSubmittingAfterDelay() {
    this.clearSubmitTimer();
    this.submitTimer = setTimeout(() => {
      this.submitting = false;
      this.setData({ submitting: false });
      this.submitTimer = null;
    }, 300);
  },

  clearSubmitTimer() {
    if (this.submitTimer) {
      clearTimeout(this.submitTimer);
      this.submitTimer = null;
    }
  }
});
