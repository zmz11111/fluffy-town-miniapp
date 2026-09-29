// Unit 1 运行预览只选取少量候选知识；人工内容与版权审核通过前不得用于正式发布。
const UNIT1_PREVIEW = Object.freeze({
  unitId: 'wj-g3-v1:unit-1',
  contentVersion: 'sprint-7-preview-1',
  reviewStatus: 'pending_human_review',
  releaseStatus: 'development_preview_only',
  chapterId: 'wj-g3-v1:unit-1:chapter-first-adventure',
  coreTaskId: 'wj-g3-v1:unit-1:task-self-introduction',
  gameId: 'wj-g3-v1:unit-1:game-greeting-cards',
  gameTaskId: 'wj-g3-v1:unit-1:task-greeting-cards',
  rewardId: 'wj-g3-v1:unit-1:reward-first-adventure-star',
  coreTask: {
    id: 'wj-g3-v1:unit-1:task-self-introduction',
    title: '帮团团选一张介绍卡',
    keyword: { english: 'friend', chinese: '朋友' },
    prompt: '团团要亲自介绍自己。哪句话是团团会说的？',
    support: '自己介绍自己时，可以先看 I’m… 这张句型卡。',
    options: [
      { id: 'self-introduction', label: 'I’m Tuantuan.' },
      { id: 'friend-introduction', label: 'He’s Tuantuan.' }
    ],
    correctOptionId: 'self-introduction',
    feedback: '对啦，团团把自己的介绍卡找到了！',
    retryFeedback: '我们看看是谁在说话，再选一次。',
    sourceReferences: [
      {
        documentId: 'student-book',
        sourceFile: '英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
        pdfPage: 13,
        printedPage: 8,
        locator: 'Start up：自我介绍句型候选'
      },
      {
        documentId: 'teacher-book',
        sourceFile: '新标准外研版三上教师用书.pdf',
        pdfPage: 12,
        printedPage: 8,
        locator: 'Unit 1 教学目标第 2 条'
      }
    ]
  },
  greetingGame: {
    title: '听听问候卡',
    prompt: '听一听，把听到的问候词放到树屋朋友墙上。',
    rounds: [
      {
        audioSrc: '/assets/audio/hello.wav',
        fallbackWord: 'hello',
        correctOptionId: 'hello',
        options: [
          { id: 'hello', label: 'Hello!', chinese: '你好！' },
          { id: 'hi', label: 'Hi!', chinese: '嗨！' }
        ]
      },
      {
        audioSrc: '/assets/audio/hi.wav',
        fallbackWord: 'hi',
        correctOptionId: 'hi',
        options: [
          { id: 'hello', label: 'Hello!', chinese: '你好！' },
          { id: 'hi', label: 'Hi!', chinese: '嗨！' }
        ]
      }
    ],
    sourceReferences: [
      {
        documentId: 'word-list',
        sourceFile: '三上外研版三起点英语【单词表】.pdf',
        pdfPage: 1,
        printedPage: null,
        locator: 'Welcome 词表：hello、hi（先修内容）'
      },
      {
        documentId: 'student-book',
        sourceFile: '英语 三年级上册 外研 (主编孙有中) (z-library.sk, 1lib.sk, z-lib.sk).pdf',
        pdfPage: 11,
        printedPage: 6,
        locator: 'Unit 1 Get ready：问候歌曲活动'
      }
    ]
  }
});

module.exports = { UNIT1_PREVIEW };
