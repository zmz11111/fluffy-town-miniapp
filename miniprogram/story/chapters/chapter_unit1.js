const { UNIT1_PREVIEW } = require('../../curriculum/unit1/preview-content');

// 章节结构只引用候选 Unit 1 内容，不把待审核数据声明为正式教材包。
const CHAPTER_UNIT1 = {
  id: UNIT1_PREVIEW.chapterId,
  grade: 3,
  courseId: 'wj-g3-v1',
  unitId: UNIT1_PREVIEW.unitId,
  contentVersion: UNIT1_PREVIEW.contentVersion,
  reviewStatus: UNIT1_PREVIEW.reviewStatus,
  releaseStatus: UNIT1_PREVIEW.releaseStatus,
  title: '树屋的新朋友',
  firstSceneId: 'wj-g3-v1:unit-1:scene-friends-wall-001',
  sceneIds: [
    'wj-g3-v1:unit-1:scene-friends-wall-001',
    'wj-g3-v1:unit-1:scene-friends-wall-002',
    'wj-g3-v1:unit-1:scene-friends-wall-003',
    'wj-g3-v1:unit-1:scene-friends-wall-004'
  ],
  rewardIds: [UNIT1_PREVIEW.rewardId],
  completion: {
    title: '朋友墙亮起来啦！',
    message: '我们一起听了问候，也帮团团放好了介绍卡。',
    actionLabel: '回到树屋',
    nextStep: '下次还可以继续认识新朋友。'
  },
  source: { kind: 'curriculum-adventure-preview', reference: UNIT1_PREVIEW.unitId }
};

module.exports = { CHAPTER_UNIT1 };
