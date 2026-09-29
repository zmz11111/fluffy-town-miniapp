const { CHAPTER_UNIT1 } = require('../chapters/chapter_unit1');

// 章节完成时由故事管理器登记任务和一次性星星奖励。
const UNIT1_SCENE_004 = {
  id: CHAPTER_UNIT1.sceneIds[3],
  chapterId: CHAPTER_UNIT1.id,
  title: '朋友墙亮起来',
  dialogues: [
    { speakerId: 'tuantuan', text: '朋友卡放好啦！我们一起听懂了问候，也找到了介绍我的那句话。' },
    { speakerId: 'narrator', text: '门外的新朋友挥挥手，树屋里留下了一张新的朋友卡。' }
  ],
  nextSceneId: null,
  requiredTaskId: null,
  tuantuanEmotion: 'happy',
  taskTriggers: [{ when: 'complete', taskId: 'wj-g3-v1:unit-1:chapter-completed' }]
};

module.exports = { UNIT1_SCENE_004 };
