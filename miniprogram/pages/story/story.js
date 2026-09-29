const { CHAPTER_001 } = require('../../story/chapters/chapter_001');
const { startChapter, getChapter, getCurrentStory, advanceStory } = require('../../story/story-manager');
const { getGameState } = require('../../game/state');
const { getStoryAvatar, TREEHOUSE_BACKGROUND } = require('../../assets/visuals');
const { TASK_ID, REWARD_ID } = require('../../games/find-cookie/data');
const { getRewardDefinition } = require('../../reward/reward-manager');
const { UNIT1_PREVIEW } = require('../../curriculum/unit1/preview-content');

Page({
  data: {
    title: CHAPTER_001.title,
    chapterLabel: '第一章',
    sceneTitle: '',
    sceneNumber: 0,
    sceneTotal: CHAPTER_001.sceneIds.length,
    speaker: '',
    dialogue: '',
    completed: false,
    stars: 0,
    taskStatus: '',
    nextStep: '',
    actionLabel: '继续故事',
    gameRewardStars: 0,
    chapterRewardStars: 0,
    mimiUnlocked: false,
    completionTitle: '',
    completionMessage: '',
    finishActionLabel: '回到树屋',
    notice: '',
    sceneSrc: TREEHOUSE_BACKGROUND,
    sceneImageFailed: false,
    avatarSrc: '',
    avatarAlt: '',
    avatarFallbackText: '',
    avatarImageFailed: false
  },

  // 允许首页打开 Unit 1；没有参数时保持旧版饼干故事入口兼容。
  onLoad(options) {
    this.chapterId = options && options.chapterId ? options.chapterId : CHAPTER_001.id;
  },

  // 返回故事页时从管理器恢复游标，小游戏完成后即可接着推进。
  onShow() {
    try {
      const chapter = getChapter(this.chapterId || CHAPTER_001.id);
      if (!chapter) {
        throw new Error('未知剧情章节');
      }
      wx.setNavigationBarTitle({ title: chapter.title });
      startChapter(chapter.id);
      this.refreshStory();
    } catch (error) {
      this.setData({ notice: '故事暂时无法打开，请稍后再试。' });
    }
  },

  refreshStory() {
    const state = getGameState();
    const current = getCurrentStory();
    const chapter = getChapter(this.chapterId || CHAPTER_001.id);
    const isUnit1 = chapter.id === UNIT1_PREVIEW.chapterId;
    const chapterProgress = state.chapterProgress[chapter.id];
    const completed = chapterProgress && chapterProgress.status === 'completed';
    const avatar = current
      ? getStoryAvatar(current.dialogue.speakerId, state.companions.tuantuan.emotion)
      : null;
    // 任务与奖励只读取既有状态；页面不发放奖励，也不改动剧情游标。
    const oldTaskCompleted = state.completedTaskIds.indexOf(TASK_ID) !== -1;
    const coreTaskCompleted = state.completedTaskIds.indexOf(UNIT1_PREVIEW.coreTaskId) !== -1;
    const greetingTaskCompleted = state.completedTaskIds.indexOf(UNIT1_PREVIEW.gameTaskId) !== -1;
    const gameReward = getRewardDefinition(REWARD_ID);
    const chapterRewardId = isUnit1 ? UNIT1_PREVIEW.rewardId : 'demo-grade-3:reward-chapter-001-stars';
    const chapterReward = getRewardDefinition(chapterRewardId);
    const claimed = state.rewards.claimedRewardIds;
    const taskStatus = isUnit1
      ? `团团介绍卡：${coreTaskCompleted ? '已完成' : '待完成'} · 问候卡：${greetingTaskCompleted ? '已完成' : '待完成'}`
      : oldTaskCompleted ? '线索任务：已完成' : '线索任务：待探索';
    const requiredTaskId = current && current.scene.requiredTaskId;
    const actionLabel = requiredTaskId && state.completedTaskIds.indexOf(requiredTaskId) === -1
      ? requiredTaskId === UNIT1_PREVIEW.coreTaskId ? '开始学习任务'
        : requiredTaskId === UNIT1_PREVIEW.gameTaskId ? '开始听问候卡'
          : '开始听音找图'
      : '继续故事';
    const nextStep = completed
      ? isUnit1 ? chapter.completion.nextStep : '下一步：去伙伴页看看米米，或回顾故事。'
      : requiredTaskId && state.completedTaskIds.indexOf(requiredTaskId) === -1
        ? requiredTaskId === UNIT1_PREVIEW.coreTaskId ? '下一步：帮团团选一张介绍自己的卡片。'
          : requiredTaskId === UNIT1_PREVIEW.gameTaskId ? '下一步：听一听，把问候卡放好。'
            : '下一步：听一听，一起找图片线索。'
        : '下一步：点“继续故事”，看看接下来会发现什么。';
    const chapterRewardStars = chapterReward && claimed.indexOf(chapterReward.id) !== -1
      ? chapterReward.amount : 0;
    this.setData({
      title: chapter.title,
      chapterLabel: isUnit1 ? 'Unit 1 学习冒险' : '第一章',
      sceneTotal: chapter.sceneIds.length,
      completed: Boolean(completed),
      stars: state.stars,
      taskStatus,
      nextStep,
      actionLabel,
      gameRewardStars: !isUnit1 && gameReward && claimed.indexOf(REWARD_ID) !== -1 ? gameReward.amount : 0,
      chapterRewardStars,
      mimiUnlocked: !isUnit1 && state.companions.mimi.unlocked,
      completionTitle: chapter.completion ? chapter.completion.title : '星星饼干找到了！',
      completionMessage: chapter.completion ? chapter.completion.message : '我们一起找到了星星饼干！真开心！',
      finishActionLabel: chapter.completion ? chapter.completion.actionLabel : '去看看米米',
      sceneTitle: current ? current.scene.title : '',
      sceneNumber: current ? current.sceneIndex : chapter.sceneIds.length,
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
        if (result.taskId === UNIT1_PREVIEW.coreTaskId) {
          wx.navigateTo({ url: '/pages/learn/learn?mode=unit1-core' });
        } else if (result.taskId === UNIT1_PREVIEW.gameTaskId) {
          wx.navigateTo({ url: '/pages/games/games?mode=unit1-greetings' });
        } else {
          wx.navigateTo({ url: '/pages/games/games' });
        }
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

  // Unit 1 章节只回到树屋，不重复触发旧章节的伙伴解锁入口。
  finishAction() {
    if (this.chapterId === UNIT1_PREVIEW.chapterId) {
      wx.reLaunch({ url: '/pages/home/home' });
      return;
    }
    this.openFriends();
  },

  backHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
