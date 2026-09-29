const {
  COURSE_ID,
  WELCOME_UNIT_ID,
  WELCOME_CHAPTER_ID,
  WELCOME_TASK_ID
} = require('../../english/learning-state-model');
const { getUnitKnowledgePackage } = require('../curriculum-manager');
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
const nameWord = VOCABULARY_BY_ID['wj-g3-v1:welcome:name'];
const nameSentence = SENTENCES_BY_ID['wj-g3-v1:welcome:sentence-my-name-is'];
const helloSentence = SENTENCES_BY_ID['wj-g3-v1:welcome:sentence-hello'];

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

// 首课把找词、听辨、句型选择和伙伴互动串成同一条找回星星的任务链。
const FIRST_SESSION_STEPS = [
  {
    id: wordActivity.id,
    kind: 'learn-vocabulary',
    prompt: '团团想找回表示“名字”的单词卡。你能从三张卡里找出来吗？',
    vocabularyIds: wordActivity.vocabularyIds,
    options: shuffleOptions([hello, hi, nameWord].map((word) => ({ id: word.id, label: word.english }))),
    correctOptionId: nameWord.id,
    correctMessage: '找到了！name 是“名字”。团团可以向米米介绍自己了。',
    retryMessage: '再看看哪张单词卡表示“名字”，团团陪你一起找。'
  },
  {
    id: listeningActivity.id,
    kind: 'listen-and-identify',
    prompt: '团团听见米米走近了。先听声音，再选出团团说的问候。',
    audioSrc: '/assets/audio/hello.wav',
    requireAudioPlayed: true,
    options: shuffleOptions([
      { id: hello.id, label: hello.english, audioSrc: hello.audioSrc || '/assets/audio/hello.wav' },
      { id: hi.id, label: hi.english, audioSrc: hi.audioSrc || '/assets/audio/hi.wav' }
    ]),
    correctOptionId: hello.id,
    correctMessage: '你听对了！团团说的是 Hello。',
    retryMessage: '再听一次，注意团团说的是哪句问候。'
  },
  {
    id: sentenceActivity.id,
    kind: 'practice-sentence',
    prompt: '米米问团团的名字。团团应该怎样介绍自己？',
    sentenceIds: sentenceActivity.sentenceIds.concat([helloSentence.id]),
    options: shuffleOptions([
      { id: 'my-name-is', label: 'My name is Mimi.', sentenceId: nameSentence.id },
      { id: 'hello', label: helloSentence.text, sentenceId: helloSentence.id }
    ]),
    correctOptionId: 'my-name-is',
    correctMessage: '对啦！My name is Mimi. 可以介绍名字。',
    retryMessage: '再看看米米问的是什么，选一句介绍名字的话。'
  },
  {
    id: `${interactionActivity.id}:choose-greeting`,
    kind: 'speak-choice',
    prompt: '轮到我们向米米打招呼了。选一句适合初次见面的问候，也可以轻轻读出来。',
    options: shuffleOptions([
      { id: 'greet-hello', label: 'Hello, Mimi!' },
      { id: 'greet-goodbye', label: 'Goodbye, Mimi!' }
    ]),
    correctOptionId: 'greet-hello',
    correctMessage: '这句问候很合适！米米听见我们啦。',
    retryMessage: '我们刚见到米米，选一句见面时的问候吧。'
  },
  {
    id: interactionActivity.id,
    kind: 'companion-interaction',
    prompt: WELCOME_ADVENTURES['welcome-session-01'].companionPrompt,
    buttonLabel: WELCOME_ADVENTURES['welcome-session-01'].companionButtonLabel,
    objectiveIds: interactionActivity.objectiveIds
  }
];

// 后续分课也使用有答案、有反馈的互动挑战，不再用“我看过了”按钮代替学习行为。
function buildReleaseSessionSteps(session) {
  const adventure = WELCOME_ADVENTURES[session.id];
  const steps = [];
  const vocabulary = (session.vocabularyIds || []).map((id) => VOCABULARY_BY_ID[id]).filter(Boolean);
  if (vocabulary.length) {
    const choices = vocabulary.slice(0, 3);
    const target = choices[session.index % choices.length];
    steps.push({
      id: `${session.id}:vocabulary`,
      kind: 'learn-vocabulary',
      prompt: `团团需要找到“${target.chinese}”这张词卡，帮它选一选。`,
      vocabularyIds: session.vocabularyIds,
      options: shuffleOptions(choices.map((entry) => ({ id: entry.id, label: entry.english }))),
      correctOptionId: target.id,
      correctMessage: `找到了！${target.english} 是“${target.chinese}”。`,
      retryMessage: `再看看中文线索，团团陪你一起找。`
    });
  }
  const sentences = (session.sentenceIds || []).map((id) => SENTENCES_BY_ID[id]).filter(Boolean);
  if (sentences.length) {
    const choices = sentences.slice(0, 3);
    const target = choices[session.index % choices.length];
    steps.push({
      id: `${session.id}:sentences`,
      kind: 'practice-sentence',
      prompt: `团团想找到“${target.chinese || target.text}”这句话，帮它读一读再选择。`,
      sentenceIds: session.sentenceIds,
      options: shuffleOptions(choices.map((entry) => ({ id: entry.id, label: entry.text }))),
      correctOptionId: target.id,
      correctMessage: `选对啦！${target.text} 这句话找到了。`,
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

const WELCOME_SESSIONS = WELCOME_DAILY_PLAN.releaseSessions.map((session, index) => Object.assign({}, session, {
  index,
  adventure: WELCOME_ADVENTURES[session.id],
  steps: index === 0 ? FIRST_SESSION_STEPS : buildReleaseSessionSteps(session)
}));

// Welcome 保留原有七节次序和教材映射，每一节只释放自己的互动任务。
const WELCOME_PREVIEW = Object.freeze({
  courseId: COURSE_ID,
  unitId: WELCOME_UNIT_ID,
  chapterId: WELCOME_CHAPTER_ID,
  taskId: WELCOME_TASK_ID,
  contentVersion: 'sprint-9-welcome-adventure-2',
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
