const { CHAPTER_WELCOME } = require('../chapters/chapter_welcome');

// 收尾告别后进入 Unit 1；此章节没有额外星星奖励。
const WELCOME_SCENE_002 = {
  id: CHAPTER_WELCOME.sceneIds[1],
  chapterId: CHAPTER_WELCOME.id,
  title: '一起慢慢来',
  dialogues: [
    { speakerId: 'tuantuan', text: '认识你真开心！听一听、看一看、试着说一说，都可以按自己的节奏来。' },
    { speakerId: 'narrator', text: '团团挥挥手，还有几节 Welcome 小课等着你们一起探索。' }
  ],
  nextSceneId: null,
  requiredTaskId: null,
  tuantuanEmotion: 'happy',
  taskTriggers: []
};

module.exports = { WELCOME_SCENE_002 };
