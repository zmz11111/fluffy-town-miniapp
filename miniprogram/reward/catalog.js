/**
 * 奖励定义与用户已领取记录分开保存；第一章奖励使用稳定 ID。
 * @typedef {{id: string, type: 'star'|'item'|'furniture'|'clothing'|'achievement'|'companion', amount?: number, targetId?: string, source: object}} RewardDefinition
 */

// 第一章星星与米米解锁是本阶段实际奖励，其余条目用于类型验证。
const REWARD_DEFINITIONS = [
  { id: 'demo-grade-3:reward-star-001', type: 'star', amount: 2, source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-item-001', type: 'item', targetId: 'demo-grade-3:item-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-furniture-001', type: 'furniture', targetId: 'demo-grade-3:furniture-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-clothing-001', type: 'clothing', targetId: 'demo-grade-3:clothing-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-achievement-001', type: 'achievement', targetId: 'demo-grade-3:achievement-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-chapter-001-stars', type: 'star', amount: 5, source: { kind: 'original-story' } },
  { id: 'demo-grade-3:reward-mimi-unlock', type: 'companion', targetId: 'mimi', source: { kind: 'original-story' } },
  { id: 'wj-g3-v1:unit-1:reward-first-adventure-star', type: 'star', amount: 1, source: { kind: 'curriculum-adventure-preview', reference: 'wj-g3-v1:unit-1' } }
];

module.exports = { REWARD_DEFINITIONS };
