const { TUANTUAN } = require('../../pets/pet');
const { interactWithTuantuan, getDailyInteractionStatus } = require('../../pets/interaction');
const { getTuantuanFeedback } = require('../../pets/companion-feedback');
const { getTuantuanVisual, TREEHOUSE_BACKGROUND } = require('../../assets/visuals');
const { getGameState } = require('../../game/state');
const { UNIT1_PREVIEW } = require('../../curriculum/unit1/preview-content');
const { WELCOME_PREVIEW } = require('../../curriculum/welcome/preview-content');
const { getTuantuanDialogue } = require('../../pets/tuantuan-dialogues');
const { needsWelcome, markWelcomeSeen } = require('../../guidance/welcome');
const { getNextCourseEntry, isWelcomeCompleted, getLearningState } = require('../../english/learning-state');
const { getWelcomeProgress } = require('../../english/welcome-learning');

Page({
  data: {
    pet: TUANTUAN,
    completed: 0,
    total: 3,
    taskTitle: '和团团一起认识树屋的新朋友',
    startLabel: '开始学习冒险',
    progressPercent: 0,
    sceneSrc: TREEHOUSE_BACKGROUND,
    sceneImageFailed: false,
    tuantuanVisual: getTuantuanVisual('idle'),
    characterImageFailed: false,
    showWelcome: false,
    companionMessage: '',
    taskGuide: '',
    storyStatus: '',
    nextStep: '',
    actionBusy: false,
    interactionsRemaining: 5,
    maxDailyInteractions: 5,
    interactionRecoveryHint: '互动次数每天零点恢复。',
    tuantuanBondLabel: '刚认识',
    welcomeSessionProgress: '',
    welcomeSessionPercent: 0
  },

  // 页面每次显示时读取本地状态，返回树屋后立即更新今日任务。
  onShow() {
    this.actionBusy = false;
    const gameState = getGameState();
    const welcomeCompleted = isWelcomeCompleted();
    const welcomeProgress = getWelcomeProgress();
    const welcomeLearning = getLearningState();
    const welcomeFirstSession = welcomeLearning.taskProgressById[WELCOME_PREVIEW.taskId];
    const welcomeFirstSessionDone = Boolean(welcomeFirstSession && welcomeFirstSession.status === 'completed');
    const interactionStatus = getDailyInteractionStatus();
    const companionStatus = getTuantuanFeedback(Object.assign({ interactionAccepted: false }, interactionStatus));
    const nextEntry = getNextCourseEntry();
    const currentChapterId = gameState.currentStory
      ? gameState.currentStory.chapterId : nextEntry.chapterId;
    const currentIsWelcome = currentChapterId === WELCOME_PREVIEW.chapterId;
    const currentIsUnit1 = currentChapterId === UNIT1_PREVIEW.chapterId;
    const anotherStoryActive = Boolean(gameState.currentStory && !currentIsWelcome && !currentIsUnit1);
    const chapter = gameState.chapterProgress[currentChapterId];
    const chapterCompleted = Boolean(chapter && chapter.status === 'completed');
    const coreTaskCompleted = gameState.completedTaskIds.indexOf(UNIT1_PREVIEW.coreTaskId) !== -1;
    const greetingTaskCompleted = gameState.completedTaskIds.indexOf(UNIT1_PREVIEW.gameTaskId) !== -1;
    const completed = currentIsWelcome
      ? welcomeProgress.completedSessions
      : [coreTaskCompleted, greetingTaskCompleted, chapterCompleted].filter(Boolean).length;
    const total = currentIsWelcome ? welcomeProgress.totalSessions : 3;
    const storyStatus = anotherStoryActive ? '还有一段冒险正在进行'
      : currentIsWelcome && welcomeCompleted ? 'Welcome 学完啦，Unit 1 已开放'
      : chapterCompleted ? currentIsWelcome ? '初次见面完成啦，Welcome 还有新内容' : 'Unit 1 学习冒险已完成'
      : greetingTaskCompleted ? '问候卡已放好，等你回故事收尾'
        : coreTaskCompleted ? '团团介绍卡已完成，下一步是听问候'
          : chapter ? currentIsWelcome ? 'Welcome · 一起认识新朋友' : '树屋的新朋友 · 探索中'
            : currentIsWelcome ? 'Welcome · 还没开始' : '树屋的新朋友 · 还没开始';
    const nextStep = anotherStoryActive ? '下一步：先回到正在进行的故事，完成或暂停后再开始 Unit 1。'
      : currentIsWelcome && welcomeCompleted ? '下一步：开始 Unit 1，去树屋认识新朋友。'
      : chapterCompleted ? currentIsWelcome ? `下一步：继续 Welcome 第 ${welcomeProgress.currentSessionIndex} 节。` : '下一步：可以结束今天的冒险，下次再继续学习。'
      : greetingTaskCompleted ? '下一步：回到故事，看看朋友墙。'
        : coreTaskCompleted ? '下一步：听一听，把问候卡放好。'
          : currentIsWelcome ? '下一步：和团团打招呼，再认识米米。'
            : chapter ? '下一步：继续和团团整理朋友墙。'
              : '下一步：开始一段短冒险，帮团团准备介绍卡。';
    const taskGuide = anotherStoryActive
      ? '当前故事的进度会保留；先继续它，再回到课程。'
      : chapterCompleted
      ? currentIsWelcome ? '初次见面已经完成；团团会陪你一节一节继续 Welcome。' : '今天的核心学习任务和问候卡都完成啦。'
      : currentIsWelcome ? '先听团团问候，再认识名字和学习界面；可以随时暂停。'
        : '先帮团团选介绍卡，再听两张问候卡；可以随时暂停。';
    const showWelcome = needsWelcome();
    this.setData({
      completed,
      total,
      progressPercent: Math.round((completed / total) * 100),
      tuantuanVisual: getTuantuanVisual('idle'),
      showWelcome,
      companionMessage: showWelcome
        ? '嗨，我是团团！我们先打个招呼，再认识新朋友吧。'
        : currentIsWelcome
          ? welcomeCompleted ? 'Welcome 的内容都认识啦！团团陪你去 Unit 1 看看。'
            : `嗨，我是团团！我们已经一起完成 ${welcomeProgress.completedSessions} 节 Welcome。`
          : chapterCompleted
          ? '今天我们一起听懂了问候，也放好了介绍卡。'
          : '我正准备一张朋友卡，要和我一起看看吗？',
      taskGuide,
      storyStatus,
      nextStep,
      actionBusy: false,
      taskTitle: currentIsWelcome
        ? welcomeFirstSessionDone ? `和团团继续 Welcome · 第 ${welcomeProgress.currentSessionIndex} 节` : '和团团一起完成 Welcome 初次见面'
        : '和团团一起认识树屋的新朋友',
      startLabel: gameState.currentStory ? '继续当前冒险'
        : welcomeCompleted ? '开始 Unit 1 学习冒险'
          : welcomeFirstSessionDone ? `继续 Welcome · 第 ${welcomeProgress.currentSessionIndex} 节` : '开始 Welcome 初次见面',
      interactionsRemaining: companionStatus.remaining,
      maxDailyInteractions: companionStatus.maximum,
      interactionRecoveryHint: companionStatus.recoveryHint,
      tuantuanBondLabel: companionStatus.bondLabel,
      welcomeSessionProgress: welcomeCompleted ? '' : `Welcome · 已完成 ${welcomeProgress.completedSessions} / ${welcomeProgress.totalSessions} 节`,
      welcomeSessionPercent: welcomeCompleted ? 100 : Math.round((welcomeProgress.completedSessions / welcomeProgress.totalSessions) * 100)
    });
  },

  // 欢迎卡只出现一次；即使存储暂时不可用，也允许继续体验。
  finishWelcome() {
    markWelcomeSeen();
    this.setData({
      showWelcome: false,
      companionMessage: '很高兴认识你！我们可以一起开始这段小冒险。'
    });
  },

  // 页面离开后清除短暂的表情恢复计时，避免改动已退出页面。
  onHide() {
    this.clearVisualTimer();
  },

  onUnload() {
    this.clearVisualTimer();
  },

  clearVisualTimer() {
    if (this.visualTimer) {
      clearTimeout(this.visualTimer);
      this.visualTimer = null;
    }
  },

  // 图片未加载时退回原有图形占位，点击区域与互动行为保持可用。
  onSceneImageError() {
    this.setData({ sceneImageFailed: true });
  },

  onCharacterImageError() {
    this.setData({ characterImageFailed: true });
  },

  // 每日互动上限和轻点冷却由角色模块管理，页面按首次或后续互动展示不同反馈。
  tapPet() {
    try {
      const interaction = interactWithTuantuan();
      const feedback = getTuantuanFeedback(interaction);
      if (!interaction.interactionAccepted) {
        this.setData({
          companionMessage: feedback.message,
          interactionsRemaining: feedback.remaining,
          maxDailyInteractions: feedback.maximum,
          interactionRecoveryHint: feedback.recoveryHint,
          tuantuanBondLabel: feedback.bondLabel
        });
        return;
      }
      this.clearVisualTimer();
      const isWelcome = this.data.taskTitle.indexOf('Welcome') !== -1;
      const firstToday = interaction.feedbackLevel === 'high';
      this.setData({
        companionMessage: firstToday
          ? isWelcome ? `${feedback.message} ${feedback.courseHint}` : getTuantuanDialogue('unit1Greeting').text
          : feedback.message,
        tuantuanVisual: firstToday ? getTuantuanVisual('happy') : getTuantuanVisual('idle'),
        characterImageFailed: false,
        interactionsRemaining: feedback.remaining,
        maxDailyInteractions: feedback.maximum,
        interactionRecoveryHint: feedback.recoveryHint,
        tuantuanBondLabel: feedback.bondLabel
      });
      if (firstToday) {
        this.visualTimer = setTimeout(() => {
          this.setData({ tuantuanVisual: getTuantuanVisual('idle') });
          this.visualTimer = null;
        }, 1200);
      }
    } catch (error) {
      wx.showToast({ title: '互动暂时无法保存', icon: 'none' });
    }
  },

  // 首页按 Welcome → Unit 1 课程顺序进入；已有故事优先从存档位置继续。
  startAdventure() {
    if (this.actionBusy) {
      return;
    }
    this.actionBusy = true;
    this.setData({ actionBusy: true });
    const state = getGameState();
    if (state.currentStory) {
      const chapterId = state.currentStory.chapterId;
      wx.navigateTo({ url: `/pages/story/story?chapterId=${chapterId}` });
      return;
    }
    const learning = getLearningState();
    const welcomeFirstSession = learning.taskProgressById[WELCOME_PREVIEW.taskId];
    if (!isWelcomeCompleted() && welcomeFirstSession && welcomeFirstSession.status === 'completed') {
      const welcomeProgress = getWelcomeProgress();
      const taskQuery = welcomeProgress.currentTaskId
        ? `&taskId=${encodeURIComponent(welcomeProgress.currentTaskId)}` : '';
      wx.navigateTo({ url: `/pages/learn/learn?mode=welcome${taskQuery}` });
      return;
    }
    wx.navigateTo({ url: `/pages/story/story?chapterId=${getNextCourseEntry().chapterId}` });
  },

  openFriends() {
    wx.navigateTo({ url: '/pages/pets/pets' });
  },

  openWords() {
    wx.navigateTo({ url: '/pages/learn/learn?mode=course-library' });
  }
});
