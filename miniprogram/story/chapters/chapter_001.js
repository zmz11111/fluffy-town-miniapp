/**
 * 章节只描述内容顺序与适用课程，不包含孩子的个人进度。
 * @typedef {{id: string, grade: number, courseId: string, contentVersion: string, title: string, firstSceneId: string, sceneIds: string[], source: object}} StoryChapter
 */

// chapter_001 仅为结构验证数据，不承载正式剧情或教材内容。
const CHAPTER_001 = {
  id: 'demo-grade-3:chapter_001',
  grade: 3,
  courseId: 'demo-grade-3',
  contentVersion: 'test-1',
  title: '测试章节 001',
  firstSceneId: 'demo-grade-3:scene_001',
  sceneIds: ['demo-grade-3:scene_001'],
  source: { kind: 'original-test', reference: null }
};

module.exports = { CHAPTER_001 };
