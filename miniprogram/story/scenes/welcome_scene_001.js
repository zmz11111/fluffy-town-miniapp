const { CHAPTER_WELCOME } = require('../chapters/chapter_welcome');
const { WELCOME_PREVIEW } = require('../../curriculum/welcome/preview-content');

// 第一段剧情把教材问候任务变成团团找回星星徽章的明确目标。
const WELCOME_SCENE_001 = {
  id: CHAPTER_WELCOME.sceneIds[0],
  chapterId: CHAPTER_WELCOME.id,
  title: '团团的星星徽章不见了',
  sceneVersion: 1,
  presentation: {
    backgroundId: 'treehouse-day',
    characters: [{ characterId: 'tuantuan', position: 'center', expression: 'thinking' }]
  },
  dialogues: [
    { speakerId: 'narrator', text: '树屋边传来轻轻的滚动声，一枚星星徽章滚到了书架后面。' },
    { speakerId: 'tuantuan', text: '我想请米米帮忙找，可我有点着急。你陪我听听问候、挑句子，一起把星星找回来，好吗？' }
  ],
  nextSceneId: CHAPTER_WELCOME.sceneIds[1],
  requiredTaskId: WELCOME_PREVIEW.taskId,
  tuantuanEmotion: 'worried',
  taskTriggers: [{ when: 'enter', taskId: WELCOME_PREVIEW.taskId }]
};

module.exports = { WELCOME_SCENE_001 };
