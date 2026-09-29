const { CHAPTER_UNIT1 } = require('../chapters/chapter_unit1');

// 开场邀请孩子和团团一起整理朋友墙，不设置倒计时或失败条件。
const UNIT1_SCENE_001 = {
  id: CHAPTER_UNIT1.sceneIds[0],
  chapterId: CHAPTER_UNIT1.id,
  title: '准备朋友墙',
  dialogues: [
    { speakerId: 'narrator', text: '树屋里多了一面朋友墙，团团想放上一张自己的介绍卡。' },
    { speakerId: 'tuantuan', text: '你愿意陪我看看，哪张卡片在介绍我吗？' }
  ],
  nextSceneId: CHAPTER_UNIT1.sceneIds[1],
  requiredTaskId: null,
  tuantuanEmotion: 'curious',
  taskTriggers: []
};

module.exports = { UNIT1_SCENE_001 };
