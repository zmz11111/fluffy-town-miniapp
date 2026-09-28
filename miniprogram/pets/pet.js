/**
 * Sprint 1 沿用 pets 目录；团团的角色定位是陪伴伙伴，不按宠物养成规则处理。
 * @typedef {{id: string, name: string, role: string, kind: string, introduction: string}} Companion
 * @typedef {{petId: string, interactionCount: number, mood: string, lastInteractedAt: string|null}} PetState
 */

// 团团是项目原创角色；当前视觉形象由页面内的简单占位图形表达。
const TUANTUAN = Object.freeze({
  id: 'tuantuan',
  name: '团团',
  role: 'companion',
  kind: '毛茸茸的小熊',
  introduction: '住在树屋里，喜欢和你一起探索新发现。'
});

module.exports = { TUANTUAN };
