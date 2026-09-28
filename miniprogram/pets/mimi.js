/**
 * 米米是橘色小猫侦探伙伴；静态设定与玩家的友谊进度分开保存。
 * @typedef {{id: string, name: string, type: string, personality: string[], role: string, friendship: number, storyProgress: string}} CompanionProfile
 */

const MIMI = Object.freeze({
  id: 'mimi',
  name: '米米 Mimi',
  type: '橘色小猫',
  role: '侦探伙伴',
  personality: ['聪明', '好奇', '略傲娇'],
  friendship: 0,
  storyProgress: 'not_met'
});

module.exports = { MIMI };
