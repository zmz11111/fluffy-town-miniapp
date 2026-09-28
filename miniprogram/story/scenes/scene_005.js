// 场景五完成第一章，随后由奖励模块解锁米米。
const SCENE_005 = {
  id: 'demo-grade-3:scene_005',
  chapterId: 'demo-grade-3:chapter_001',
  title: '米米加入',
  dialogues: [
    { speakerId: 'mimi', text: '你们找线索真有趣。下次也带上我，好吗？' },
    { speakerId: 'tuantuan', dialogueKey: 'welcomeMimi' }
  ],
  nextSceneId: null,
  requiredTaskId: null,
  tuantuanEmotion: 'excited',
  taskTriggers: [
    { when: 'complete', taskId: 'demo-grade-3:chapter-001-finished' }
  ]
};

module.exports = { SCENE_005 };
