/**
 * 词条保留年级、课程、单元和来源字段，方便未来导入教材 PDF 并由人工审校后替换示例内容。
 * @typedef {{id: string, grade: number, courseId: string, unitId: string, english: string, chinese: string, phonetic: string, phoneticAccent: string, pronunciationReviewStatus: string, audioSrc: string, imageSrc: string|null, source: {kind: string, reference: string|null}}} EnglishWord
 */

const DEMO_COURSE_ID = 'demo-grade-3';
const DEMO_UNIT_ID = 'treehouse-words';

// 六个示例词仅供第一章试玩，不绑定教材；图片原创，音频来源见 docs/素材来源.md。
const WORDS = Object.freeze([
  { id: 'word-hello', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'hello', chinese: '你好', phonetic: '/həˈləʊ/', phoneticAccent: 'en-GB', pronunciationReviewStatus: 'pending_human_review', audioSrc: '/assets/audio/hello.wav', imageSrc: null, source: { kind: 'original-sample', reference: null } },
  { id: 'word-hi', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'hi', chinese: '嗨', phonetic: '/haɪ/', phoneticAccent: 'en-GB', pronunciationReviewStatus: 'pending_human_review', audioSrc: '/assets/audio/hi.wav', imageSrc: null, source: { kind: 'original-sample', reference: null } },
  { id: 'word-cat', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'cat', chinese: '猫', phonetic: '/kæt/', phoneticAccent: 'en-GB', pronunciationReviewStatus: 'pending_human_review', audioSrc: '/assets/audio/cat.wav', imageSrc: '/assets/pictures/cat.png', source: { kind: 'original-sample', reference: null } },
  { id: 'word-dog', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'dog', chinese: '狗', phonetic: '/dɒɡ/', phoneticAccent: 'en-GB', pronunciationReviewStatus: 'pending_human_review', audioSrc: '/assets/audio/dog.wav', imageSrc: '/assets/pictures/dog.png', source: { kind: 'original-sample', reference: null } },
  { id: 'word-cookie', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'cookie', chinese: '饼干', phonetic: '/ˈkʊki/', phoneticAccent: 'en-GB', pronunciationReviewStatus: 'pending_human_review', audioSrc: '/assets/audio/cookie.wav', imageSrc: '/assets/pictures/cookie.png', source: { kind: 'original-sample', reference: null } },
  { id: 'word-star', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'star', chinese: '星星', phonetic: '/stɑː/', phoneticAccent: 'en-GB', pronunciationReviewStatus: 'pending_human_review', audioSrc: '/assets/audio/star.wav', imageSrc: '/assets/pictures/star.png', source: { kind: 'original-sample', reference: null } }
]);

module.exports = { DEMO_COURSE_ID, DEMO_UNIT_ID, WORDS };
