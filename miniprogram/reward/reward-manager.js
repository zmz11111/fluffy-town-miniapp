const { TEST_REWARDS } = require('./catalog');
const { isValidContentId } = require('../game/model');
const { updateGameState } = require('../game/state');

// 定义只从已登记的奖励目录读取，不接受页面传入任意数量或物品。
function getRewardDefinition(rewardId) {
  const reward = TEST_REWARDS.find((item) => item.id === rewardId);
  return reward ? JSON.parse(JSON.stringify(reward)) : null;
}

// 数组写入去重，避免同一物品或成就被重复加入。
function addUnique(ids, id) {
  if (ids.indexOf(id) === -1) {
    ids.push(id);
  }
}

// 校验内容目录中的奖励结构，未来由发布流程继续校验来源与授权。
function requireReward(rewardId) {
  const reward = getRewardDefinition(rewardId);
  if (!reward || !isValidContentId(reward.id)) {
    throw new Error('未知奖励');
  }
  if (reward.type === 'star') {
    if (!Number.isSafeInteger(reward.amount) || reward.amount < 1) {
      throw new Error('星星奖励数据无效');
    }
  } else if (['item', 'furniture', 'clothing', 'achievement'].indexOf(reward.type) === -1 ||
             !isValidContentId(reward.targetId)) {
    throw new Error('奖励目标数据无效');
  }
  return reward;
}

// 奖励按 ID 幂等应用；何时有资格获得奖励由后续规则层决定。
function applyReward(rewardId) {
  const reward = requireReward(rewardId);
  return updateGameState((draft) => {
    if (draft.rewards.claimedRewardIds.indexOf(reward.id) !== -1) {
      return;
    }

    if (reward.type === 'star') {
      const nextStars = draft.stars + reward.amount;
      if (!Number.isSafeInteger(nextStars)) {
        throw new Error('星星数量超出范围');
      }
      draft.stars = nextStars;
    } else if (reward.type === 'item') {
      addUnique(draft.inventory.itemIds, reward.targetId);
    } else if (reward.type === 'furniture') {
      addUnique(draft.inventory.furnitureIds, reward.targetId);
    } else if (reward.type === 'clothing') {
      addUnique(draft.inventory.clothingIds, reward.targetId);
    } else {
      addUnique(draft.rewards.achievementIds, reward.targetId);
    }

    draft.rewards.claimedRewardIds.push(reward.id);
  });
}

module.exports = { getRewardDefinition, applyReward };
