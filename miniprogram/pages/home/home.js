const { TUANTUAN } = require('../../pets/pet');
const { getTuantuanState, interactWithTuantuan } = require('../../pets/interaction');
const { getLearningSummary } = require('../../english/learning');
const { getTuantuanVisual, TREEHOUSE_BACKGROUND } = require('../../assets/visuals');
const { getGameState } = require('../../game/state');
const { CHAPTER_001 } = require('../../story/chapters/chapter_001');
const { TASK_ID } = require('../../games/find-cookie/data');
const { needsWelcome, markWelcomeSeen } = require('../../guidance/welcome');

Page({
  data: {
    pet: TUANTUAN,
    interactionCount: 0,
    completed: 0,
    total: 6,
    progressPercent: 0,
    sceneSrc: TREEHOUSE_BACKGROUND,
    sceneImageFailed: false,
    tuantuanVisual: getTuantuanVisual('idle'),
    characterImageFailed: false,
    showWelcome: false,
    companionMessage: '',
    taskGuide: '',
    storyStatus: '',
    nextStep: ''
  },

  // 页面每次显示时读取本地状态，返回树屋后立即更新今日任务。
  onShow() {
    const petState = getTuantuanState();
    const summary = getLearningSummary();
    const gameState = getGameState();
    const chapter = gameState.chapterProgress[CHAPTER_001.id];
    const chapterCompleted = Boolean(chapter && chapter.status === 'completed');
    const taskCompleted = gameState.completedTaskIds.indexOf(TASK_ID) !== -1;
    const storyStatus = chapterCompleted ? '第一章已完成'
      : taskCompleted ? '线索已找到，等待回到故事'
        : chapter ? '第一章探索中' : '第一章还没开始';
    const nextStep = chapterCompleted ? '下一步：去伙伴页看看米米，或回顾故事。'
      : taskCompleted ? '下一步：回到故事，把线索告诉米米。'
        : chapter ? '下一步：继续故事，和团团一起找线索。'
          : '下一步：点“开始冒险”，认识米米并寻找星星饼干。';
    const taskGuide = summary.completed === summary.total
      ? '六张示例词卡都认识啦，想再一起看看故事吗？'
      : summary.completed > 0
        ? `已经认识 ${summary.completed} 个词啦，还可以点“单词卡”继续看看。`
        : '可以先看“单词卡”，也可以直接开始冒险。';
    const showWelcome = needsWelcome();
    this.setData({
      interactionCount: petState.interactionCount,
      completed: summary.completed,
      total: summary.total,
      progressPercent: Math.round((summary.completed / summary.total) * 100),
      tuantuanVisual: getTuantuanVisual('idle'),
      showWelcome,
      companionMessage: showWelcome
        ? '嗨，我是团团！这是我们的树屋。我们一起看看今天会发现什么？'
        : chapterCompleted
          ? '我们找到了星星饼干，米米也加入啦！想再去看看伙伴吗？'
          : taskCompleted
            ? '线索已经找齐了！我们回故事里看看吧。'
            : '树屋里有新线索，我陪你一起慢慢找。',
      taskGuide,
      storyStatus,
      nextStep
    });
  },

  // 欢迎卡只出现一次；即使存储暂时不可用，也允许继续体验。
  finishWelcome() {
    markWelcomeSeen();
    this.setData({
      showWelcome: false,
      companionMessage: '很高兴认识你！可以先看单词卡，也可以直接去冒险。'
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

  // 角色点击只记录互动，保存失败时向用户说明。
  tapPet() {
    try {
      const petState = interactWithTuantuan();
      this.clearVisualTimer();
      this.setData({
        interactionCount: petState.interactionCount,
        tuantuanVisual: getTuantuanVisual('happy'),
        characterImageFailed: false
      });
      this.visualTimer = setTimeout(() => {
        this.setData({ tuantuanVisual: getTuantuanVisual('idle') });
        this.visualTimer = null;
      }, 1200);
      wx.showToast({ title: '团团向你挥挥手！', icon: 'none' });
    } catch (error) {
      wx.showToast({ title: '互动暂时无法保存', icon: 'none' });
    }
  },

  // 冒险入口进入第一章，词卡仍可单独预览。
  startAdventure() {
    wx.navigateTo({ url: '/pages/story/story' });
  },

  openFriends() {
    wx.navigateTo({ url: '/pages/pets/pets' });
  },

  openWords() {
    wx.navigateTo({ url: '/pages/learn/learn' });
  }
});
