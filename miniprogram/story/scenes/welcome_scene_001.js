const { CHAPTER_WELCOME } = require('../chapters/chapter_welcome');
const { WELCOME_PREVIEW } = require('../../curriculum/welcome/preview-content');

// 初次见面先邀请孩子选择问候；是否完成由 Welcome 学习任务模块记录。
const WELCOME_SCENE_001 = {
  id: CHAPTER_WELCOME.sceneIds[0],
  chapterId: CHAPTER_WELCOME.id,
  title: '团团来打招呼',
  dialogues: [
    { speakerId: 'narrator', text: '树屋里传来轻轻的脚步声，一个毛茸茸的小伙伴探出头来。' },
    { speakerId: 'tuantuan', text: '嗨，我是团团！你愿意和我打个招呼、认识一位新朋友吗？' }
  ],
  nextSceneId: CHAPTER_WELCOME.sceneIds[1],
  requiredTaskId: WELCOME_PREVIEW.taskId,
  tuantuanEmotion: 'curious',
  taskTriggers: [{ when: 'enter', taskId: WELCOME_PREVIEW.taskId }]
};

module.exports = { WELCOME_SCENE_001 };
