/**
 * 章节只描述内容顺序与适用课程，不包含孩子的个人进度。
 * @typedef {{id: string, grade: number, courseId: string, contentVersion: string, title: string, firstSceneId: string, sceneIds: string[], source: object}} StoryChapter
 */

// 第一章为本项目原创试玩剧情，不引用教材或第三方故事。
const CHAPTER_001 = {
  id: 'demo-grade-3:chapter_001',
  grade: 3,
  courseId: 'demo-grade-3',
  contentVersion: 'sprint-2',
  title: '消失的星星饼干',
  firstSceneId: 'demo-grade-3:scene_001',
  sceneIds: [
    'demo-grade-3:scene_001',
    'demo-grade-3:scene_002',
    'demo-grade-3:scene_003',
    'demo-grade-3:scene_004',
    'demo-grade-3:scene_005'
  ],
  source: { kind: 'original-story', reference: null }
};

module.exports = { CHAPTER_001 };
