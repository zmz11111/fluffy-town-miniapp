/**
 * 奖励定义与用户已领取记录分开保存；第一章奖励使用稳定 ID。
 * @typedef {{id: string, type: 'star'|'item'|'furniture'|'clothing'|'achievement'|'companion', amount?: number, targetId?: string, source: object}} RewardDefinition
 */

// 第一章伙伴奖励与 Welcome 每节星星奖励共用目录，其余条目用于类型验证。
const REWARD_DEFINITIONS = [
  { id: 'demo-grade-3:reward-star-001', type: 'star', amount: 2, source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-item-001', type: 'item', targetId: 'demo-grade-3:item-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-furniture-001', type: 'furniture', targetId: 'demo-grade-3:furniture-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-clothing-001', type: 'clothing', targetId: 'demo-grade-3:clothing-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-achievement-001', type: 'achievement', targetId: 'demo-grade-3:achievement-001', source: { kind: 'original-test' } },
  { id: 'demo-grade-3:reward-chapter-001-stars', type: 'star', amount: 5, source: { kind: 'original-story' } },
  { id: 'demo-grade-3:reward-mimi-unlock', type: 'companion', targetId: 'mimi', source: { kind: 'original-story' } },
  { id: 'wj-g3-v1:unit-1:reward-first-adventure-star', type: 'star', amount: 1, source: { kind: 'curriculum-adventure-preview', reference: 'wj-g3-v1:unit-1' } },
  { id: 'wj-g3-v1:welcome:reward-session-01-star', type: 'star', amount: 1, source: { kind: 'welcome-adventure', reference: 'welcome-session-01' } },
  { id: 'wj-g3-v1:welcome:reward-session-02-star', type: 'star', amount: 1, source: { kind: 'welcome-adventure', reference: 'welcome-session-02' } },
  { id: 'wj-g3-v1:welcome:reward-session-03-star', type: 'star', amount: 1, source: { kind: 'welcome-adventure', reference: 'welcome-session-03' } },
  { id: 'wj-g3-v1:welcome:reward-session-04-star', type: 'star', amount: 1, source: { kind: 'welcome-adventure', reference: 'welcome-session-04' } },
  { id: 'wj-g3-v1:welcome:reward-session-05-star', type: 'star', amount: 1, source: { kind: 'welcome-adventure', reference: 'welcome-session-05' } },
  { id: 'wj-g3-v1:welcome:reward-session-06-star', type: 'star', amount: 1, source: { kind: 'welcome-adventure', reference: 'welcome-session-06' } },
  { id: 'wj-g3-v1:welcome:reward-session-07-star', type: 'star', amount: 1, source: { kind: 'welcome-adventure', reference: 'welcome-session-07' } }
];

module.exports = { REWARD_DEFINITIONS };
