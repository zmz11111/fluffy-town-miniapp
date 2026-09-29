const { TUANTUAN } = require('../../pets/pet');
const { getTuantuanState, interactWithTuantuan } = require('../../pets/interaction');
const { getLearningSummary } = require('../../english/learning');
const { getTuantuanVisual, TREEHOUSE_BACKGROUND } = require('../../assets/visuals');

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
    characterImageFailed: false
  },

  // 页面每次显示时读取本地状态，返回树屋后立即更新今日任务。
  onShow() {
    const petState = getTuantuanState();
    const summary = getLearningSummary();
    this.setData({
      interactionCount: petState.interactionCount,
      completed: summary.completed,
      total: summary.total,
      progressPercent: Math.round((summary.completed / summary.total) * 100),
      tuantuanVisual: getTuantuanVisual('idle')
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

