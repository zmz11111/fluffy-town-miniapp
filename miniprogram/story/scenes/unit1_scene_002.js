const { CHAPTER_UNIT1 } = require('../chapters/chapter_unit1');
const { UNIT1_PREVIEW } = require('../../curriculum/unit1/preview-content');

// 进入本场景时触发一项句型识别任务，故事管理器负责拦截并恢复进度。
const UNIT1_SCENE_002 = {
  id: CHAPTER_UNIT1.sceneIds[1],
  chapterId: CHAPTER_UNIT1.id,
  title: '团团的介绍卡',
  dialogues: [
    { speakerId: 'tuantuan', text: UNIT1_PREVIEW.coreTask.prompt }
  ],
  nextSceneId: CHAPTER_UNIT1.sceneIds[2],
  requiredTaskId: UNIT1_PREVIEW.coreTaskId,
  tuantuanEmotion: 'curious',
  taskTriggers: [{ when: 'enter', taskId: UNIT1_PREVIEW.coreTaskId }]
};

module.exports = { UNIT1_SCENE_002 };
