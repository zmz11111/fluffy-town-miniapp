const { TUANTUAN } = require('../../pets/pet');
const { getTuantuanState, interactWithTuantuan } = require('../../pets/interaction');
const { getTuantuanVisual, TREEHOUSE_BACKGROUND } = require('../../assets/visuals');
const { getGameState } = require('../../game/state');
const { UNIT1_PREVIEW } = require('../../curriculum/unit1/preview-content');
const { CHAPTER_001 } = require('../../story/chapters/chapter_001');
const { getTuantuanDialogue } = require('../../pets/tuantuan-dialogues');
const { needsWelcome, markWelcomeSeen } = require('../../guidance/welcome');

Page({
  data: {
    pet: TUANTUAN,
    interactionCount: 0,
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
    nextStep: ''
  },

  // 页面每次显示时读取本地状态，返回树屋后立即更新今日任务。
  onShow() {
    const petState = getTuantuanState();
    const gameState = getGameState();
    const chapter = gameState.chapterProgress[UNIT1_PREVIEW.chapterId];
    const anotherStoryActive = Boolean(gameState.currentStory &&
      gameState.currentStory.chapterId !== UNIT1_PREVIEW.chapterId);
    const chapterCompleted = Boolean(chapter && chapter.status === 'completed');
    const coreTaskCompleted = gameState.completedTaskIds.indexOf(UNIT1_PREVIEW.coreTaskId) !== -1;
    const greetingTaskCompleted = gameState.completedTaskIds.indexOf(UNIT1_PREVIEW.gameTaskId) !== -1;
    const completed = [coreTaskCompleted, greetingTaskCompleted, chapterCompleted].filter(Boolean).length;
    const storyStatus = anotherStoryActive ? '还有一段冒险正在进行'
      : chapterCompleted ? 'Unit 1 学习冒险已完成'
      : greetingTaskCompleted ? '问候卡已放好，等你回故事收尾'
        : coreTaskCompleted ? '团团介绍卡已完成，下一步是听问候'
          : chapter ? '树屋的新朋友 · 探索中' : '树屋的新朋友 · 还没开始';
    const nextStep = anotherStoryActive ? '下一步：先回到正在进行的故事，完成或暂停后再开始 Unit 1。'
      : chapterCompleted ? '下一步：可以结束今天的冒险，下次再继续学习。'
      : greetingTaskCompleted ? '下一步：回到故事，看看朋友墙。'
        : coreTaskCompleted ? '下一步：听一听，把问候卡放好。'
          : chapter ? '下一步：继续和团团整理朋友墙。'
            : '下一步：开始一段短冒险，帮团团准备介绍卡。';
    const taskGuide = anotherStoryActive
      ? '当前故事的进度会保留；先继续它，再开启 Unit 1。'
      : chapterCompleted
      ? '今天的核心学习任务和问候卡都完成啦。'
      : '先帮团团选介绍卡，再听两张问候卡；可以随时暂停。';
    const showWelcome = needsWelcome();
    this.setData({
      interactionCount: petState.interactionCount,
      completed,
      total: 3,
      progressPercent: Math.round((completed / 3) * 100),
      tuantuanVisual: getTuantuanVisual('idle'),
      showWelcome,
      companionMessage: showWelcome
        ? '嗨，我是团团！朋友墙有一张空卡，我们一起看看吧？'
        : chapterCompleted
          ? '今天我们一起听懂了问候，也放好了介绍卡。'
          : '我正准备一张朋友卡，要和我一起看看吗？',
      taskGuide,
      storyStatus,
      nextStep,
      startLabel: anotherStoryActive ? '继续当前冒险' : '开始学习冒险'
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

  // 角色点击只记录互动，保存失败时向用户说明。
  tapPet() {
    try {
      const petState = interactWithTuantuan();
      this.clearVisualTimer();
      this.setData({
        interactionCount: petState.interactionCount,
        companionMessage: getTuantuanDialogue('unit1Greeting').text,
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

  // 首页主入口进入 Unit 1 预览章节；旧版故事仍可从原入口继续访问。
  startAdventure() {
    const state = getGameState();
    if (state.currentStory && state.currentStory.chapterId !== UNIT1_PREVIEW.chapterId) {
      const chapterId = state.currentStory.chapterId;
      const url = chapterId === CHAPTER_001.id
        ? '/pages/story/story'
        : `/pages/story/story?chapterId=${chapterId}`;
      wx.navigateTo({ url });
      return;
    }
    wx.navigateTo({ url: `/pages/story/story?chapterId=${UNIT1_PREVIEW.chapterId}` });
  },

  openFriends() {
    wx.navigateTo({ url: '/pages/pets/pets' });
  },

  openWords() {
    wx.navigateTo({ url: '/pages/learn/learn' });
  }
});
