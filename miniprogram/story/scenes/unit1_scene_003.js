const { CHAPTER_UNIT1 } = require('../chapters/chapter_unit1');
const { UNIT1_PREVIEW } = require('../../curriculum/unit1/preview-content');

// 问候小游戏只使用已有的 hello/hi 示例录音和文字卡片。
const UNIT1_SCENE_003 = {
  id: CHAPTER_UNIT1.sceneIds[2],
  chapterId: CHAPTER_UNIT1.id,
  title: '听听问候卡',
  dialogues: [
    { speakerId: 'narrator', text: '朋友墙边还空着两张问候卡，我们听听哪张卡该放上去。' },
    { speakerId: 'tuantuan', text: '声音可以再听一次，我们慢慢找。' }
  ],
  nextSceneId: CHAPTER_UNIT1.sceneIds[3],
  requiredTaskId: UNIT1_PREVIEW.gameTaskId,
  tuantuanEmotion: 'curious',
  taskTriggers: [{ when: 'enter', taskId: UNIT1_PREVIEW.gameTaskId }]
};

module.exports = { UNIT1_SCENE_003 };
