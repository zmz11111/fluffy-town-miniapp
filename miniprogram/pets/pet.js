/**
 * 宠物资料与状态分开保存，未来可以增加更多宠物而不改变学习记录。
 * @typedef {{id: string, name: string, kind: string, introduction: string}} Pet
 * @typedef {{petId: string, interactionCount: number, mood: string, lastInteractedAt: string|null}} PetState
 */

// 团团是项目原创角色；当前视觉形象由页面内的简单占位图形表达。
const TUANTUAN = Object.freeze({
  id: 'tuantuan',
  name: '团团',
  kind: '毛茸茸的小熊',
  introduction: '住在树屋里，喜欢和你一起学习英语。'
});

module.exports = { TUANTUAN };
