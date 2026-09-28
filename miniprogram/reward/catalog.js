/**
 * 奖励定义与用户已领取记录分开保存；以下条目只用于验证五种奖励类型。
 * @typedef {{id: string, type: 'star'|'item'|'furniture'|'clothing'|'achievement', amount?: number, targetId?: string, source: object}} RewardDefinition
 */

// 测试奖励不含图片、服装图稿或未经授权的第三方素材。
const TEST_REWARDS = [
  { id: 'demo-grade-3:reward-star-001', type: 'star', amount: 2, source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-item-001', type: 'item', targetId: 'demo-grade-3:item-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-furniture-001', type: 'furniture', targetId: 'demo-grade-3:furniture-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-clothing-001', type: 'clothing', targetId: 'demo-grade-3:clothing-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-achievement-001', type: 'achievement', targetId: 'demo-grade-3:achievement-001', source: { kind: 'original-test' } }
];

module.exports = { TEST_REWARDS };
