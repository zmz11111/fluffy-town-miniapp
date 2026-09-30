const { greetMimi } = require('../../pets/character-manager');
const { getCompanionPageState } = require('../../pets/companion-progress');
const { getCompanionGreeting, recordCompanionGreeting } = require('../../pets/companion-greetings');

Page({
  data: {
    tuantuan: {},
    stars: 0,
    mimi: {},
    welcomeCompleted: false,
    notice: '',
    mimiGreetingLine: '',
    mimiActionLabel: '',
    storyCompleted: false,
    taskCompleted: false,
    completedMilestones: 0,
    totalMilestones: 3,
    storyStatus: '',
    taskStatus: ''
  },

  // 角色卡片读取合并视图，解锁状态由章节奖励更新。
  onShow() {
    this.refresh();
  },

  refresh() {
    try {
      const view = getCompanionPageState();
      const characters = view.characters;
      const greeting = characters.mimi.unlocked ? getCompanionGreeting('mimi') : null;
      this.pendingMimiGreeting = greeting;
      this.setData({
        tuantuan: characters.tuantuan,
        stars: view.stars,
        mimi: characters.mimi,
        welcomeCompleted: view.welcomeCompleted,
        storyCompleted: view.storyCompleted,
        taskCompleted: view.taskCompleted,
        completedMilestones: view.completedMilestones,
        totalMilestones: view.totalMilestones,
        storyStatus: view.storyStatus,
        taskStatus: view.taskStatus,
        mimiGreetingLine: greeting ? greeting.text : '',
        mimiActionLabel: view.action.label,
        notice: ''
      });
    } catch (error) {
      this.setData({ notice: '伙伴档案暂时打不开。' });
    }
  },

  greet() {
    try {
      const greeting = this.pendingMimiGreeting || getCompanionGreeting('mimi');
      const result = greetMimi();
      if (result.greetingAccepted) {
        recordCompanionGreeting(greeting);
      }
      this.refresh();
      const notice = result.greetingAccepted
        ? result.friendshipChange ? '米米轻轻眨眨眼，收下了你的招呼。' : '米米朝你笑了笑。'
        : result.dailyLimitReached
          ? '今天和米米打招呼的次数用完啦，明天再来找她吧。'
          : '米米还在回应刚才的招呼，等一小会儿再试试。';
      this.setData({ notice });
    } catch (error) {
      this.refresh();
      this.setData({ notice: this.data.mimi.unlocked ? '招呼暂时没有保存好，稍后再试试吧。' : '米米还在故事中等着和你见面。' });
    }
  },

  openStory() {
    // 点击时再读最新状态，不使用之前渲染过的按钮目标。
    const action = getCompanionPageState().action;
    if (action.kind === 'home') wx.reLaunch({ url: action.url });
    else wx.navigateTo({ url: action.url });
  }
});
