// 场景四回应寻找过程，答案来自一处容易忽略的小篮子。
const SCENE_004 = {
  id: 'demo-grade-3:scene_004',
  chapterId: 'demo-grade-3:chapter_001',
  title: '找到饼干',
  dialogues: [
    { speakerId: 'narrator', text: '图卡指向树屋里的小篮子。' },
    { speakerId: 'mimi', text: '找到啦！饼干在这里，原来是被篮子挡住了。' },
    { speakerId: 'tuantuan', dialogueKey: 'foundCookie' }
  ],
  nextSceneId: 'demo-grade-3:scene_005',
  requiredTaskId: null,
  tuantuanEmotion: 'happy',
  taskTriggers: []
};

module.exports = { SCENE_004 };
