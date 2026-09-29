// 首次欢迎只保存界面引导是否看过，不写入游戏进度或学习记录。
const WELCOME_KEY = 'fluffy-town:welcome:v1';

function needsWelcome() {
  try {
    return wx.getStorageSync(WELCOME_KEY) !== true;
  } catch (error) {
    return true;
  }
}

function markWelcomeSeen() {
  try {
    wx.setStorageSync(WELCOME_KEY, true);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = { WELCOME_KEY, needsWelcome, markWelcomeSeen };
