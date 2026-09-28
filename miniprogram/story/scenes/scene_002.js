// 场景二提出寻找目标，避免暗示有人拿走饼干。
const SCENE_002 = {
  id: 'demo-grade-3:scene_002',
  chapterId: 'demo-grade-3:chapter_001',
  title: '星星饼干消失',
  dialogues: [
    { speakerId: 'narrator', text: '桌上的星星饼干不见了。' },
    { speakerId: 'mimi', text: '奇怪，刚才它还在这里呢。' },
    { speakerId: 'tuantuan', dialogueKey: 'missingCookie' }
  ],
  nextSceneId: 'demo-grade-3:scene_003',
  requiredTaskId: null,
  tuantuanEmotion: 'worried',
  taskTriggers: []
};

module.exports = { SCENE_002 };
