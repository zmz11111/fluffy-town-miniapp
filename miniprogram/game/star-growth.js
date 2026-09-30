const { REWARD_DEFINITIONS } = require('../reward/catalog');

// 成长只由已有星星余额推导，不另存等级，不参与教材与伙伴解锁。
function deriveStarGrowth(stars) {
  if (!Number.isInteger(stars) || stars < 0) throw new Error('星星数量必须是非负整数');
  const stage = stars >= 20 ? 'decorated' : stars >= 10 ? 'lit' : 'ordinary';
  const nextThreshold = stars < 10 ? 10 : stars < 20 ? 20 : null;
  return {
    stage,
    title: { ordinary: '普通树屋', lit: '亮灯树屋', decorated: '装饰树屋' }[stage],
    lightsOn: stars >= 10,
    decorationsOn: stars >= 20,
    nextThreshold,
    starsToNextStage: nextThreshold === null ? 0 : nextThreshold - stars,
    hint: nextThreshold === null ? '灯光和星星装饰，记录着我们一起的发现。'
      : `再一起收集 ${nextThreshold - stars} 颗星星，${stars < 10 ? '就能点亮树屋的小灯' : '就能为树屋添上星星装饰'}。`
  };
}

// 只追踪已登记且真正领取过的星星奖励，调整数字或领取物品不伪造奖励提示。
function getStarRewardIds(gameState) {
  return gameState.rewards.claimedRewardIds.filter((id) =>
    REWARD_DEFINITIONS.some((reward) => reward.id === id && reward.type === 'star')
  );
}

function buildStarFeedback(gameState) {
  const currentIds = getStarRewardIds(gameState);
  const seenIds = gameState.rewards.seenStarRewardIds;
  // 旧档没有展示记录时以当前奖励建立基线，不重播历史奖励。
  const unseenIds = seenIds === undefined ? [] : currentIds.filter((id) => seenIds.indexOf(id) === -1);
  const total = unseenIds.reduce((amount, id) => amount + REWARD_DEFINITIONS.find((reward) => reward.id === id).amount, 0);
  const amount = Math.min(total, gameState.stars);
  const growth = deriveStarGrowth(gameState.stars);
  const previousGrowth = deriveStarGrowth(Math.max(0, gameState.stars - amount));
  const stageChanged = amount > 0 && growth.stage !== previousGrowth.stage;
  return {
    amount,
    visible: amount > 0,
    stageChanged,
    message: stageChanged
      ? growth.decorationsOn ? '树屋挂上星星装饰啦！团团想和你一起看看。' : '树屋的小灯亮起来啦！这是我们一起的发现。'
      : '星星带回树屋啦！团团和你一起收下这份发现。',
    seenStarRewardIds: currentIds
  };
}

module.exports = { deriveStarGrowth, buildStarFeedback };
