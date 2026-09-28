// 场景三触发听音找图任务，完成后才能继续下一场景。
const SCENE_003 = {
  id: 'demo-grade-3:scene_003',
  chapterId: 'demo-grade-3:chapter_001',
  title: '寻找线索',
  dialogues: [
    { speakerId: 'narrator', text: '树屋周围有几张图卡。听一听，找出对应的图片。' },
    { speakerId: 'tuantuan', dialogueKey: 'clueSearch' }
  ],
  nextSceneId: 'demo-grade-3:scene_004',
  requiredTaskId: 'demo-grade-3:find-cookie',
  tuantuanEmotion: 'curious',
  taskTriggers: [
    { when: 'enter', taskId: 'demo-grade-3:find-cookie' }
  ]
};

module.exports = { SCENE_003 };
