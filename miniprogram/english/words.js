/**
 * 词条保留年级、课程、单元和来源字段，方便未来导入教材 PDF 并由人工审校后替换示例内容。
 * @typedef {{id: string, grade: number, courseId: string, unitId: string, english: string, chinese: string, source: {kind: string, reference: string|null}}} EnglishWord
 */

const DEMO_COURSE_ID = 'demo-grade-3';
const DEMO_UNIT_ID = 'treehouse-words';

// 五个示例词为通用词汇，不引用任何教材、图片或第三方音频。
const WORDS = Object.freeze([
  { id: 'word-cat', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'cat', chinese: '猫', source: { kind: 'original-sample', reference: null } },
  { id: 'word-dog', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'dog', chinese: '狗', source: { kind: 'original-sample', reference: null } },
  { id: 'word-bird', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'bird', chinese: '鸟', source: { kind: 'original-sample', reference: null } },
  { id: 'word-tree', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'tree', chinese: '树', source: { kind: 'original-sample', reference: null } },
  { id: 'word-house', grade: 3, courseId: DEMO_COURSE_ID, unitId: DEMO_UNIT_ID, english: 'house', chinese: '房子', source: { kind: 'original-sample', reference: null } }
]);

module.exports = { DEMO_COURSE_ID, DEMO_UNIT_ID, WORDS };
