const { getTuantuanBondLabel } = require('./affinity');
const { getWelcomeProgress } = require('../english/welcome-learning');

// 把互动限额、关系阶段和课程进度整理成温暖的儿童文案，不暴露学习目标名称。
function getTuantuanFeedback(interaction) {
  const progress = getWelcomeProgress();
  const remaining = interaction.remainingDailyInteractions;
  const bondLabel = getTuantuanBondLabel();
  let message;
  if (!interaction.interactionAccepted && interaction.dailyLimitReached) {
    message = '今天的招呼次数用完啦，明天团团会再来和你见面。';
  } else if (!interaction.interactionAccepted) {
    message = '团团还在眨眼休息，过一小会儿再来点它吧。';
  } else if (interaction.feedbackLevel === 'high') {
    message = progress.completedSessions
      ? `团团开心地回应了你的问候！我们已经一起完成 ${progress.completedSessions} 节 Welcome。`
      : `团团开心地回应了你的问候！今天一起打开 Welcome 第 ${progress.currentSessionIndex} 节吧。`;
  } else {
    message = `团团笑着陪在你身边。今天还可以打 ${remaining} 次招呼。`;
  }
  return {
    message,
    remaining,
    maximum: interaction.maxDailyInteractions,
    recoveryHint: interaction.recoveryHint,
    bondLabel,
    courseHint: progress.isComplete ? 'Welcome 已经学完，Unit 1 已开放。'
      : `团团会陪你继续认识 Welcome · 第 ${progress.currentSessionIndex} 节。`
  };
}

module.exports = { getTuantuanFeedback };
