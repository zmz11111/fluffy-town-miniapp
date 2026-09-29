const { WELCOME_PREVIEW } = require('../../curriculum/welcome/preview-content');

// Welcome 是课程入门章节，使用现有故事页承载首次体验，不创建新页面系统。
const CHAPTER_WELCOME = {
  id: WELCOME_PREVIEW.chapterId,
  grade: 3,
  courseId: WELCOME_PREVIEW.courseId,
  unitId: WELCOME_PREVIEW.unitId,
  learningUnitId: WELCOME_PREVIEW.unitId,
  contentVersion: WELCOME_PREVIEW.contentVersion,
  reviewStatus: WELCOME_PREVIEW.reviewStatus,
  releaseStatus: WELCOME_PREVIEW.releaseStatus,
  title: WELCOME_PREVIEW.title,
  firstSceneId: 'wj-g3-v1:welcome:scene-first-meeting',
  sceneIds: [
    'wj-g3-v1:welcome:scene-first-meeting',
    'wj-g3-v1:welcome:scene-goodbye'
  ],
  completion: {
    title: '欢迎来到毛茸茸小镇！',
    message: '我们一起打过招呼、认识了新朋友，也知道可以慢慢来。',
    actionLabel: '回到树屋',
    nextStep: '下一步：回到树屋后，Unit 1 就可以开始啦。'
  },
  source: { kind: 'welcome-learning-preview', reference: WELCOME_PREVIEW.unitId }
};

module.exports = { CHAPTER_WELCOME };
