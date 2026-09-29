/**
 * 教材内容只描述经发布的知识，不保存儿童的学习、剧情或奖励进度。
 * 难度统一为 1～5：1 为入门，5 为本内容库中最高难度。
 * @typedef {{kind: string, reference: string|null, rightsStatus: string, reviewStatus: string}} ContentSource
 * @typedef {{id: string, title: string, edition: string, grade: number, volume: string, contentVersion: string, source: ContentSource, unitIds: string[]}} Textbook
 * @typedef {{id: string, textbookId: string, number: number, title: string, topic: string, difficulty: number, vocabularyIds: string[], sentenceIds: string[]}} CurriculumUnit
 * @typedef {{id: string, textbookId: string, unitId: string, english: string, chinese: string, difficulty: number, audioSrc: string|null, imageSrc: string|null}} CurriculumWord
 * @typedef {{id: string, textbookId: string, unitId: string, text: string, meaning: string, pattern: string, difficulty: number, vocabularyIds: string[]}} CurriculumSentence
 */

// 此文件集中说明内容契约，供人工审阅及后续内容导入流程参照。
module.exports = {};
