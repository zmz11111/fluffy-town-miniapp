const { CHAPTER_WELCOME } = require('../chapters/chapter_welcome');

// 团团在学习任务完成后接回剧情，并为后续 Welcome 小冒险留出入口。
const WELCOME_SCENE_002 = {
  id: CHAPTER_WELCOME.sceneIds[1],
  chapterId: CHAPTER_WELCOME.id,
  title: '星星徽章回来了',
  dialogues: [
    { speakerId: 'tuantuan', text: 'Hello，米米！你听懂了我们的问候，还把星星徽章找回来啦！谢谢你陪我一起试着说英语。' },
    { speakerId: 'narrator', text: '星星徽章回到了团团手上。还有几节 Welcome 小冒险，等你们继续一起探索。' }
  ],
  nextSceneId: null,
  requiredTaskId: null,
  tuantuanEmotion: 'happy',
  taskTriggers: []
};

module.exports = { WELCOME_SCENE_002 };
