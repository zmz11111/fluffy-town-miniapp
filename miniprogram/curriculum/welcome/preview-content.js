const {
  COURSE_ID,
  WELCOME_UNIT_ID,
  WELCOME_CHAPTER_ID,
  WELCOME_TASK_ID
} = require('../../english/learning-state-model');
const { getUnitKnowledgePackage } = require('../curriculum-manager');
const WELCOME_UNIT_INFO = require('./unit-info.json');
const WELCOME_DAILY_PLAN = require('./daily-plan.json');

const WELCOME_KNOWLEDGE = getUnitKnowledgePackage(WELCOME_UNIT_ID);
const VOCABULARY_BY_ID = Object.create(null);
const SENTENCES_BY_ID = Object.create(null);
WELCOME_KNOWLEDGE.vocabulary.forEach((entry) => { VOCABULARY_BY_ID[entry.id] = entry; });
WELCOME_KNOWLEDGE.sentences.forEach((entry) => { SENTENCES_BY_ID[entry.id] = entry; });

const DAILY_ACTIVITIES = Object.create(null);
WELCOME_DAILY_PLAN.activities.forEach((activity) => { DAILY_ACTIVITIES[activity.id] = activity; });
const wordActivity = DAILY_ACTIVITIES['new-words'];
const sentenceActivity = DAILY_ACTIVITIES['sentence-practice'];
const listeningActivity = DAILY_ACTIVITIES.listening;
const interactionActivity = DAILY_ACTIVITIES['tuantuan-interaction'];
const hello = VOCABULARY_BY_ID['wj-g3-v1:welcome:hello'];
const hi = VOCABULARY_BY_ID['wj-g3-v1:welcome:hi'];
const nameSentence = SENTENCES_BY_ID['wj-g3-v1:welcome:sentence-my-name-is'];
const helloSentence = SENTENCES_BY_ID['wj-g3-v1:welcome:sentence-hello'];

// Welcome 是正式课程单元；当前短课复用故事与学习页，内容仍处于审核预览状态。
const WELCOME_PREVIEW = Object.freeze({
  courseId: COURSE_ID,
  unitId: WELCOME_UNIT_ID,
  chapterId: WELCOME_CHAPTER_ID,
  taskId: WELCOME_TASK_ID,
  contentVersion: 'sprint-8a-welcome-preview-1',
  title: WELCOME_UNIT_INFO.title,
  displayTitle: WELCOME_UNIT_INFO.displayTitle,
  taskTitle: WELCOME_DAILY_PLAN.title,
  recommendedMinutes: WELCOME_DAILY_PLAN.recommendedMinutes,
  reviewStatus: WELCOME_UNIT_INFO.reviewStatus,
  releaseStatus: WELCOME_UNIT_INFO.releaseStatus,
  steps: [
    {
      id: wordActivity.id,
      kind: 'learn-vocabulary',
      prompt: '先看看这三个新朋友词：Hello、Hi 和 name。可以听一听，再慢慢读。',
      vocabularyIds: wordActivity.vocabularyIds,
      options: [{ id: 'seen-vocabulary', label: '我看过啦，继续' }],
      objectiveIds: wordActivity.objectiveIds
    },
    {
      id: sentenceActivity.id,
      kind: 'practice-sentence',
      prompt: '米米想介绍自己的名字，哪句话适合介绍自己？',
      sentenceIds: sentenceActivity.sentenceIds,
      options: [
        { id: 'my-name-is', label: 'My name is Mimi.', sentenceId: nameSentence.id },
        { id: 'hello', label: helloSentence.text, sentenceId: helloSentence.id }
      ],
      correctOptionId: 'my-name-is',
      retryMessage: '我们看看哪张句子卡里提到了名字，再选一次。',
      objectiveIds: sentenceActivity.objectiveIds
    },
    {
      id: listeningActivity.id,
      kind: 'listen-and-identify',
      prompt: '听一听团团说了哪句问候，再选对应的卡片。',
      audioSrc: '/assets/audio/hello.wav',
      options: [
        { id: 'hello', label: hello.english, chinese: hello.chinese, audioSrc: hello.audioSrc || '/assets/audio/hello.wav' },
        { id: 'hi', label: hi.english, chinese: hi.chinese, audioSrc: hi.audioSrc || '/assets/audio/hi.wav' }
      ],
      correctOptionId: 'hello',
      retryMessage: '可以再听一次，看看哪张卡和声音一样。',
      objectiveIds: listeningActivity.objectiveIds
    },
    {
      id: interactionActivity.id,
      kind: 'companion-interaction',
      prompt: '最后和团团打个招呼吧。轻轻点一下就好。',
      objectiveIds: interactionActivity.objectiveIds
    }
  ],
  sourceReferences: WELCOME_UNIT_INFO.sourceReferences
});

module.exports = { WELCOME_PREVIEW, WELCOME_KNOWLEDGE, WELCOME_DAILY_PLAN };
