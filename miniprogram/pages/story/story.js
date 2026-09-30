const { CHAPTER_001 } = require('../../story/chapters/chapter_001');
const { startChapter, getChapter, getCurrentStory, advanceStory } = require('../../story/story-manager');
const { getGameState } = require('../../game/state');
const { getStoryAvatar, TREEHOUSE_BACKGROUND } = require('../../assets/visuals');
const { getMimiVisual } = require('../../assets/welcome-visuals');
const { TASK_ID, REWARD_ID } = require('../../games/find-cookie/data');
const { getRewardDefinition } = require('../../reward/reward-manager');
const { UNIT1_PREVIEW } = require('../../curriculum/unit1/preview-content');
const { WELCOME_PREVIEW } = require('../../curriculum/welcome/preview-content');
const { getNextCourseEntry } = require('../../english/learning-state');

Page({
  data: {
    title: CHAPTER_001.title,
    isWelcome: false,
    welcomeSceneKey: 'welcome',
    welcomeTuantuanVisual: null,
    welcomeMimiVisual: getMimiVisual('idle'),
    welcomeShowMimi: false,
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
    showMimiUnlockReward: false,
    completionTitle: '',
    completionMessage: '',
    finishActionLabel: '回到树屋',
    actionBusy: false,
    notice: '',
    sceneSrc: TREEHOUSE_BACKGROUND,
    sceneAlt: '毛茸茸树屋',
    sceneCharacters: [],
    sceneImageFailed: false,
    avatarSrc: '',
    avatarAlt: '',
    avatarFallbackText: '',
    avatarImageFailed: false
  },

  // 没有指定剧情时进入当前课程单元，避免旧剧情成为首次课程入口。
  onLoad(options) {
    this.chapterId = options && options.chapterId ? options.chapterId : getNextCourseEntry().chapterId;
  },

  // 返回故事页时从管理器恢复游标，小游戏完成后即可接着推进。
  onShow() {
    this.clearActionTimer();
    this.actionBusy = false;
    try {
      const chapter = getChapter(this.chapterId || getNextCourseEntry().chapterId);
      if (!chapter) {
        throw new Error('未知剧情章节');
      }
      wx.setNavigationBarTitle({ title: chapter.title });
      startChapter(chapter.id);
      this.refreshStory();
    } catch (error) {
      this.actionBusy = false;
      this.setData({ actionBusy: false, notice: '故事暂时无法打开，请稍后再试。' });
    }
  },

  refreshStory() {
    const state = getGameState();
    const current = getCurrentStory();
    const chapter = getChapter(this.chapterId || getNextCourseEntry().chapterId);
    const isUnit1 = chapter.id === UNIT1_PREVIEW.chapterId;
    const isWelcome = chapter.id === WELCOME_PREVIEW.chapterId;
    const chapterProgress = state.chapterProgress[chapter.id];
    const presentation = current && current.presentation;
    const welcomeTuantuan = isWelcome && presentation && presentation.characters.find((actor) => actor.characterId === 'tuantuan');
    const welcomeMimi = isWelcome && presentation && presentation.characters.find((actor) => actor.characterId === 'mimi');
    const completed = chapterProgress && chapterProgress.status === 'completed';
    const avatar = current
      ? getStoryAvatar(current.dialogue.speakerId, state.companions.tuantuan.emotion)
      : null;
    // 任务与奖励只读取既有状态；页面不发放奖励，也不改动剧情游标。
    const oldTaskCompleted = state.completedTaskIds.indexOf(TASK_ID) !== -1;
    const coreTaskCompleted = state.completedTaskIds.indexOf(UNIT1_PREVIEW.coreTaskId) !== -1;
    const greetingTaskCompleted = state.completedTaskIds.indexOf(UNIT1_PREVIEW.gameTaskId) !== -1;
    const welcomeTaskCompleted = state.completedTaskIds.indexOf(WELCOME_PREVIEW.taskId) !== -1;
    const gameReward = getRewardDefinition(REWARD_ID);
    const chapterRewardId = isUnit1 ? UNIT1_PREVIEW.rewardId : !isWelcome ? 'demo-grade-3:reward-chapter-001-stars' : null;
    const chapterReward = chapterRewardId ? getRewardDefinition(chapterRewardId) : null;
    const claimed = state.rewards.claimedRewardIds;
    const taskStatus = isWelcome
      ? `初次问候和自我介绍：${welcomeTaskCompleted ? '已完成' : '待完成'}`
      : isUnit1
        ? `团团介绍卡：${coreTaskCompleted ? '已完成' : '待完成'} · 问候卡：${greetingTaskCompleted ? '已完成' : '待完成'}`
        : oldTaskCompleted ? '线索任务：已完成' : '线索任务：待探索';
    const requiredTaskId = current && current.scene.requiredTaskId;
    const actionLabel = requiredTaskId && state.completedTaskIds.indexOf(requiredTaskId) === -1
      ? requiredTaskId === WELCOME_PREVIEW.taskId ? '和团团打个招呼'
        : requiredTaskId === UNIT1_PREVIEW.coreTaskId ? '开始学习任务'
          : requiredTaskId === UNIT1_PREVIEW.gameTaskId ? '开始听问候卡'
            : '开始听音找图'
      : '继续故事';
    const nextStep = completed
      ? isWelcome || isUnit1 ? chapter.completion.nextStep : '下一步：去伙伴页看看米米，或回顾故事。'
      : requiredTaskId && state.completedTaskIds.indexOf(requiredTaskId) === -1
        ? requiredTaskId === WELCOME_PREVIEW.taskId ? '下一步：选一句问候，再认识米米。'
          : requiredTaskId === UNIT1_PREVIEW.coreTaskId ? '下一步：帮团团选一张介绍自己的卡片。'
            : requiredTaskId === UNIT1_PREVIEW.gameTaskId ? '下一步：听一听，把问候卡放好。'
              : '下一步：听一听，一起找图片线索。'
        : '下一步：点“继续故事”，看看接下来会发现什么。';
    const chapterRewardStars = chapterReward && claimed.indexOf(chapterReward.id) !== -1
      ? chapterReward.amount : 0;
    this.setData({
      title: chapter.title,
      isWelcome,
      welcomeSceneKey: current ? current.scene.id : 'welcome-completed',
      welcomeTuantuanVisual: welcomeTuantuan || null,
      welcomeMimiVisual: getMimiVisual(welcomeMimi ? welcomeMimi.expression : 'idle'),
      welcomeShowMimi: Boolean(welcomeMimi),
      chapterLabel: isWelcome ? 'Welcome 入门章节' : isUnit1 ? 'Unit 1 学习冒险' : '第一章',
      sceneTotal: chapter.sceneIds.length,
      completed: Boolean(completed),
      stars: state.stars,
      taskStatus,
      nextStep,
      actionLabel,
      gameRewardStars: !isUnit1 && !isWelcome && gameReward && claimed.indexOf(REWARD_ID) !== -1 ? gameReward.amount : 0,
      chapterRewardStars,
      mimiUnlocked: state.companions.mimi.unlocked,
      showMimiUnlockReward: !isUnit1 && !isWelcome && state.companions.mimi.unlocked,
      completionTitle: chapter.completion ? chapter.completion.title : '星星饼干找到了！',
      completionMessage: chapter.completion ? chapter.completion.message : '我们一起找到了星星饼干！真开心！',
      finishActionLabel: chapter.completion ? chapter.completion.actionLabel : '去看看米米',
      actionBusy: this.actionBusy,
      sceneTitle: current ? current.scene.title : '',
      sceneSrc: presentation ? presentation.background.src : TREEHOUSE_BACKGROUND,
      sceneAlt: presentation ? presentation.background.alt : '毛茸茸树屋',
      sceneImageFailed: this.data.sceneSrc === (presentation ? presentation.background.src : TREEHOUSE_BACKGROUND)
        ? this.data.sceneImageFailed : false,
      sceneCharacters: presentation ? presentation.characters.map((actor) => {
        const previous = this.data.sceneCharacters.find((entry) => entry.characterId === actor.characterId && entry.src === actor.src);
        return Object.assign({}, actor, { imageFailed: Boolean(previous && previous.imageFailed) });
      }) : [],
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

  // 单个角色图片失败时保留角色位和姓名，其余场景继续显示。
  onSceneCharacterError(event) {
    const characterId = event.currentTarget.dataset.characterId;
    this.setData({ sceneCharacters: this.data.sceneCharacters.map((actor) =>
      Object.assign({}, actor, { imageFailed: actor.imageFailed || actor.characterId === characterId })
    ) });
  },

  // 剧情推进、任务门槛和章节奖励全部交给 story-manager。
  next() {
    if (this.actionBusy) {
      return;
    }
    this.actionBusy = true;
    this.setData({ actionBusy: true });
    try {
      const result = advanceStory();
      if (result.status === 'task_required') {
        if (result.taskId === WELCOME_PREVIEW.taskId) {
          wx.navigateTo({
            url: `/pages/learn/learn?mode=welcome&taskId=${encodeURIComponent(WELCOME_PREVIEW.taskId)}`
          });
        } else if (result.taskId === UNIT1_PREVIEW.coreTaskId) {
          wx.navigateTo({ url: '/pages/learn/learn?mode=unit1-core' });
        } else if (result.taskId === UNIT1_PREVIEW.gameTaskId) {
          wx.navigateTo({ url: '/pages/games/games?mode=unit1-greetings' });
        } else {
          wx.navigateTo({ url: '/pages/games/games' });
        }
        return;
      }
      this.refreshStory();
      this.releaseActionAfterDelay();
    } catch (error) {
      this.setData({ notice: '这一页暂时走不过去，再试一次吧。' });
      this.releaseActionAfterDelay();
    }
  },

  // 短暂保留提交锁，避免快速连点推进多句或叠出多个页面。
  releaseActionAfterDelay() {
    this.clearActionTimer();
    this.actionTimer = setTimeout(() => {
      this.actionBusy = false;
      this.setData({ actionBusy: false });
      this.actionTimer = null;
    }, 300);
  },

  clearActionTimer() {
    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }
  },

  openFriends() {
    wx.navigateTo({ url: '/pages/pets/pets' });
  },

  // Welcome 和 Unit 1 回到树屋；旧第一章的唯一出口带孩子查看已解锁伙伴。
  finishAction() {
    if (this.actionBusy) {
      return;
    }
    this.actionBusy = true;
    if (this.chapterId === UNIT1_PREVIEW.chapterId || this.chapterId === WELCOME_PREVIEW.chapterId) {
      wx.reLaunch({ url: '/pages/home/home' });
      return;
    }
    this.openFriends();
  },

  onUnload() {
    this.clearActionTimer();
  }
});
