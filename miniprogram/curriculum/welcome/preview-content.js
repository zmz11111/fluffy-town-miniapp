const {
  COURSE_ID,
  WELCOME_UNIT_ID,
  WELCOME_CHAPTER_ID,
  WELCOME_TASK_ID
} = require('../../english/learning-state-model');
const { getUnitKnowledgePackage } = require('../curriculum-manager');
const { createChallengeTask } = require('../../english/challenge-task-model');
const { WELCOME_ADVENTURES } = require('../../story/welcome-adventures');
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
const imSentence = SENTENCES_BY_ID['wj-g3-v1:welcome:sentence-im'];

// 每次载入课程时打乱选项，避免正确答案固定在同一位置。
function shuffleOptions(options) {
  const shuffled = options.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = current;
  }
  return shuffled;
}

// 课程释义允许缺省；缺失时使用可读的英文或通用提示继续生成任务。
function getTextOrFallback(value, fallback) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

// 首课先听读 Hello / Hi，再完成听音辨认和句子拼组，最后和团团一起找回星星。
const FIRST_SESSION_STEPS = [
  {
    id: wordActivity.id + ':greeting-input',
    kind: 'greeting-input',
    prompt: '书架后传来轻轻的声音。先听听 Hello 和 Hi，帮团团认出两种问候。',
    vocabularyIds: [hello.id, hi.id],
    requiredAudioVocabularyIds: [hello.id, hi.id],
    retryMessage: '再听一听两张问候卡，听过 Hello 和 Hi 后才能继续找声音。',
    correctMessage: 'Hello 和 Hi 都听过啦！团团听见书架后有动静。',
    correctDialogue: '你把两种问候都听清楚了！书架后好像有星星徽章的声音。'
  },
  {
    id: listeningActivity.id,
    kind: 'listen-and-identify',
    prompt: '米米从书架后喊了一声。听一听，再选出她说的问候。',
    audioSrc: hi.audioSrc || '/assets/audio/hi.wav',
    requireAudioPlayed: true,
    options: shuffleOptions([
      { id: hello.id, label: hello.english, audioSrc: hello.audioSrc || '/assets/audio/hello.wav' },
      { id: hi.id, label: hi.english, audioSrc: hi.audioSrc || '/assets/audio/hi.wav' }
    ]),
    correctOptionId: hi.id,
    correctMessage: '听对啦！米米说的是 Hi！',
    retryMessage: '再听一次，注意米米的声音和 Hello、Hi 哪张卡相同。',
    correctDialogue: '米米听见你认出了 Hi！她指了指书架旁边闪闪发亮的角落。',
    retryDialogue: '没关系，我们再听听。米米就在书架后等着我们。'
  },
  {
    id: sentenceActivity.id + ':build-greeting',
    kind: 'sentence-build',
    prompt: '米米想向团团介绍自己。按顺序拼出这句话，看看星星徽章藏在哪里。',
    sentenceIds: [imSentence.id],
    tiles: [
      { id: 'session-01-hi', label: 'Hi!' },
      { id: 'session-01-im', label: "I'm" },
      { id: 'session-01-mimi', label: 'Mimi.' },
      { id: 'session-01-hello', label: 'Hello.' },
      { id: 'session-01-name', label: 'name' }
    ],
    correctTileIds: ['session-01-hi', 'session-01-im', 'session-01-mimi'],
    correctMessage: '句子拼好啦：Hi! I\'m Mimi. 米米笑着指向星星徽章！',
    retryMessage: '顺序不太对，再想想问候之后，团团要怎样介绍自己。',
    correctDialogue: '太棒了！团团用完整句子介绍了自己。米米从书架后找到了星星徽章！',
    retryDialogue: '不着急，团团陪你一起看看词块的顺序。'
  },
  {
    id: interactionActivity.id,
    kind: 'companion-interaction',
    prompt: WELCOME_ADVENTURES['welcome-session-01'].companionPrompt,
    buttonLabel: WELCOME_ADVENTURES['welcome-session-01'].companionButtonLabel,
    objectiveIds: interactionActivity.objectiveIds,
    retryMessage: '团团还在等你的鼓励，轻轻点一下，和它一起收下徽章吧。',
    correctMessage: '你和团团一起找回了星星徽章！'
  }
];

// 后续分课也使用有答案、有反馈的互动挑战，不再用“我看过了”按钮代替学习行为。
function buildReleaseSessionSteps(session, sessionIndex) {
  const safeSessionIndex = Number.isInteger(sessionIndex) && sessionIndex >= 0 ? sessionIndex : 0;
  const adventure = WELCOME_ADVENTURES[session.id];
  const steps = [];
  const vocabulary = (session.vocabularyIds || []).map((id) => VOCABULARY_BY_ID[id]).filter(Boolean);
  if (vocabulary.length) {
    const choices = vocabulary.slice(0, 3);
    const target = choices[safeSessionIndex % choices.length] || choices[0];
    const targetEnglish = getTextOrFallback(target && target.english, '这个单词');
    const targetMeaning = getTextOrFallback(target && target.chinese, targetEnglish);
    steps.push({
      id: `${session.id}:vocabulary`,
      kind: 'learn-vocabulary',
      prompt: `团团需要找到“${targetMeaning}”这张词卡，帮它选一选。`,
      vocabularyIds: session.vocabularyIds,
      options: shuffleOptions(choices.map((entry) => ({
        id: entry.id,
        label: getTextOrFallback(entry.english, '单词卡')
      }))),
      correctOptionId: target.id,
      correctMessage: `找到了！${targetEnglish} 是“${targetMeaning}”。`,
      retryMessage: `再看看中文线索，团团陪你一起找。`
    });
  }
  const sentences = (session.sentenceIds || []).map((id) => SENTENCES_BY_ID[id]).filter(Boolean);
  if (sentences.length) {
    const choices = sentences.slice(0, 3);
    const target = choices[safeSessionIndex % choices.length] || choices[0];
    const targetText = getTextOrFallback(target && target.text, '这句话');
    const targetMeaning = getTextOrFallback(target && target.chinese, targetText);
    steps.push({
      id: `${session.id}:sentences`,
      kind: 'practice-sentence',
      prompt: `团团想找到“${targetMeaning}”这句话，帮它读一读再选择。`,
      sentenceIds: session.sentenceIds,
      options: shuffleOptions(choices.map((entry) => ({
        id: entry.id,
        label: getTextOrFallback(entry.text, '句子卡')
      }))),
      correctOptionId: target.id,
      correctMessage: `选对啦！${targetText} 这句话找到了。`,
      retryMessage: '再读一读中文线索，团团会陪你一起想。'
    });
  }
  if (session.alphabetLetters && session.alphabetLetters.length) {
    const letters = session.alphabetLetters;
    letters.forEach((letter, index) => {
      const choices = [letter.toLowerCase(), letters[(index + 1) % letters.length].toLowerCase(), letters[(index + 2) % letters.length].toLowerCase()];
      steps.push({
        id: `${session.id}:letter-${letter}`,
        kind: 'letter-match',
        targetLetter: letter,
        prompt: `团团找到大写 ${letter} 了，哪张小写卡是它的朋友？`,
        options: shuffleOptions(choices.map((choice) => ({ id: choice, label: choice }))),
        correctOptionId: letter.toLowerCase(),
        correctMessage: `配对成功！${letter} 和 ${letter.toLowerCase()} 是字母朋友。`,
        retryMessage: `再看看大写 ${letter} 的小写字母伙伴。`
      });
    });
  }
  steps.push({
    id: `${session.id}:companion`,
    kind: 'companion-interaction',
    prompt: adventure.companionPrompt,
    buttonLabel: adventure.companionButtonLabel,
    objectiveIds: session.objectiveIdsToComplete || []
  });
  return steps;
}

const firstSessionDefinition = WELCOME_DAILY_PLAN.releaseSessions[0];
const firstSessionAdventure = WELCOME_ADVENTURES[firstSessionDefinition.id];
const FIRST_SESSION_CHALLENGE_TASK = createChallengeTask({
  id: firstSessionDefinition.taskId,
  unitId: WELCOME_UNIT_ID,
  sessionId: firstSessionDefinition.id,
  story: {
    goal: firstSessionAdventure.goal,
    openingDialogue: firstSessionAdventure.openingDialogue
  },
  englishInput: [
    { kind: 'vocabulary', contentIds: [hello.id, hi.id] },
    { kind: 'listening', contentIds: [hello.id, hi.id] },
    { kind: 'sentence', contentIds: [imSentence.id] }
  ],
  childActions: FIRST_SESSION_STEPS,
  feedback: {
    error: firstSessionAdventure.retryDialogue,
    success: firstSessionAdventure.successDialogue,
    completion: firstSessionAdventure.completionDialogue
  },
  reward: {
    id: firstSessionAdventure.rewardId,
    type: 'star',
    amount: 1,
    message: firstSessionAdventure.rewardMessage
  }
});

const WELCOME_SESSIONS = WELCOME_DAILY_PLAN.releaseSessions.map((session, index) => {
  const indexedSession = Object.assign({}, session, { index });
  return Object.assign(indexedSession, {
    adventure: WELCOME_ADVENTURES[session.id],
    challengeTask: index === 0 ? FIRST_SESSION_CHALLENGE_TASK : null,
    steps: index === 0 ? FIRST_SESSION_CHALLENGE_TASK.childActions : buildReleaseSessionSteps(indexedSession, index)
  });
});

// Welcome 保留原有七节次序和教材映射，每一节只释放自己的互动任务。
const WELCOME_PREVIEW = Object.freeze({
  courseId: COURSE_ID,
  unitId: WELCOME_UNIT_ID,
  chapterId: WELCOME_CHAPTER_ID,
  taskId: WELCOME_TASK_ID,
  contentVersion: 'sprint-10-welcome-challenge-1',
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

module.exports = {
  WELCOME_PREVIEW,
  WELCOME_SESSIONS,
  WELCOME_KNOWLEDGE,
  WELCOME_DAILY_PLAN,
  FIRST_SESSION_CHALLENGE_TASK,
  buildReleaseSessionSteps
};
