const { TUANTUAN } = require('../../pets/pet');
const { getTuantuanState, interactWithTuantuan } = require('../../pets/interaction');
const { getLearningSummary } = require('../../english/learning');

Page({
  data: {
    pet: TUANTUAN,
    interactionCount: 0,
    completed: 0,
    total: 5,
    progressPercent: 0
  },

  // 页面每次显示时读取本地状态，返回树屋后立即更新今日任务。
  onShow() {
    const petState = getTuantuanState();
    const summary = getLearningSummary();
    this.setData({
      interactionCount: petState.interactionCount,
      completed: summary.completed,
      total: summary.total,
      progressPercent: Math.round((summary.completed / summary.total) * 100)
    });
  },

  // 角色点击只记录互动，保存失败时向用户说明。
  tapPet() {
    try {
      const petState = interactWithTuantuan();
      this.setData({ interactionCount: petState.interactionCount });
      wx.showToast({ title: '团团向你挥挥手！', icon: 'none' });
    } catch (error) {
      wx.showToast({ title: '互动暂时无法保存', icon: 'none' });
    }
  },

  // 冒险入口先进入五词预览，后续可替换为章节地图。
  startAdventure() {
    wx.navigateTo({ url: '/pages/learn/learn' });
  }
});
