/**
 * 场景以角色对白、下一场景和任务触发条件描述流程，不含页面渲染代码。
 * @typedef {{speakerId: string, text: string}} StoryDialogue
 * @typedef {{when: 'enter'|'complete', taskId: string}} TaskTrigger
 * @typedef {{id: string, chapterId: string, dialogues: StoryDialogue[], nextSceneId: string|null, taskTriggers: TaskTrigger[]}} StoryScene
 */

// 对白和任务 ID 仅供验证引擎结构，不构成正式章节或玩法。
const SCENE_001 = {
  id: 'demo-grade-3:scene_001',
  chapterId: 'demo-grade-3:chapter_001',
  dialogues: [
    { speakerId: 'tuantuan', text: '我们一起看看这个测试场景吧。' },
    { speakerId: 'narrator', text: '这段文字只用于验证对白顺序。' }
  ],
  nextSceneId: null,
  taskTriggers: [
    { when: 'complete', taskId: 'demo-grade-3:story-test-task' }
  ]
};

module.exports = { SCENE_001 };
