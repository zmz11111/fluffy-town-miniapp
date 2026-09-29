const {
  COURSE_ID,
  WELCOME_UNIT_ID,
  WELCOME_CHAPTER_ID,
  WELCOME_TASK_ID
} = require('../../english/learning-state-model');
const { getUnitKnowledgePackage } = require('../curriculum-manager');
const WELCOME_UNIT_INFO = require('./unit-info.runtime');
const WELCOME_DAILY_PLAN = require('./daily-plan.runtime');

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

// Welcome 首课复用现有故事任务，其余分课按单元顺序渐进开放。
const FIRST_SESSION_STEPS = [
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
];

function buildReleaseSessionSteps(session) {
  const steps = [];
  if (session.vocabularyIds.length) {
    steps.push({
      id: `${session.id}:vocabulary`,
      kind: 'learn-vocabulary',
      prompt: session.vocabularyPrompt || '先看看这一组新词，想一想它们会在什么时候用到。',
      vocabularyIds: session.vocabularyIds,
      options: [{ id: `${session.id}:vocabulary-seen`, label: '词卡看过啦，继续' }]
    });
  }
  if (session.sentenceIds.length) {
    steps.push({
      id: `${session.id}:sentences`,
      kind: 'practice-sentence',
      prompt: session.sentencePrompt || '跟着团团把这些表达读一读，再选“我试过啦”。',
      sentenceIds: session.sentenceIds,
      options: [{ id: `${session.id}:sentences-practiced`, label: '我试着说过啦，继续' }]
    });
  }
  if (session.alphabetLetters && session.alphabetLetters.length) {
    steps.push({
      id: `${session.id}:alphabet`,
      kind: 'recognize-letters',
      prompt: session.prompt,
      letters: session.alphabetLetters
    });
  }
  return steps;
}

const WELCOME_SESSIONS = WELCOME_DAILY_PLAN.releaseSessions.map((session, index) => Object.assign({}, session, {
  index,
  steps: index === 0 ? FIRST_SESSION_STEPS : buildReleaseSessionSteps(session)
}));

// Welcome 是完整课程单元；每节约15分钟，仅向儿童逐步释放对应内容。
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
  sessions: WELCOME_SESSIONS,
  steps: FIRST_SESSION_STEPS,
  sourceReferences: WELCOME_UNIT_INFO.sourceReferences
});

module.exports = { WELCOME_PREVIEW, WELCOME_SESSIONS, WELCOME_KNOWLEDGE, WELCOME_DAILY_PLAN };
