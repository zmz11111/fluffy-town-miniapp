/**
 * 场景以角色对白、下一场景和任务触发条件描述流程，不含页面渲染代码。
 * @typedef {{speakerId: string, text?: string, dialogueKey?: string}} StoryDialogue
 * @typedef {{when: 'enter'|'complete', taskId: string}} TaskTrigger
 * @typedef {{id: string, chapterId: string, title: string, dialogues: StoryDialogue[], nextSceneId: string|null, requiredTaskId: string|null, tuantuanEmotion: string, taskTriggers: TaskTrigger[]}} StoryScene
 */

// 初次见面采用简短对白，米米先以侦探伙伴身份出现。
const SCENE_001 = {
  id: 'demo-grade-3:scene_001',
  chapterId: 'demo-grade-3:chapter_001',
  title: '初次见面',
  dialogues: [
    { speakerId: 'narrator', text: '树屋旁，一只橘色小猫正在仔细看地上的小脚印。' },
    { speakerId: 'mimi', text: 'Hi，我是米米。你们也喜欢找线索吗？' },
    { speakerId: 'tuantuan', dialogueKey: 'firstMeeting' }
  ],
  nextSceneId: 'demo-grade-3:scene_002',
  requiredTaskId: null,
  tuantuanEmotion: 'curious',
  taskTriggers: [
    { when: 'complete', taskId: 'demo-grade-3:meet-mimi' }
  ]
};

module.exports = { SCENE_001 };
