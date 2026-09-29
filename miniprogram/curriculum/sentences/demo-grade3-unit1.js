// 句型模板为本项目编写的演示数据，不摘录真实教材课文。
const DEMO_SENTENCES = [
  {
    id: 'demo-g3-v1:unit-1:sentence-hello',
    textbookId: 'demo-g3-v1',
    unitId: 'demo-g3-v1:unit-1',
    text: 'Hello!',
    meaning: '你好！',
    pattern: 'Hello!',
    difficulty: 1,
    vocabularyIds: ['demo-g3-v1:unit-1:hello']
  },
  {
    id: 'demo-g3-v1:unit-1:sentence-name',
    textbookId: 'demo-g3-v1',
    unitId: 'demo-g3-v1:unit-1',
    text: 'My name is ...',
    meaning: '我的名字是……',
    pattern: 'My name is ...',
    difficulty: 2,
    vocabularyIds: ['demo-g3-v1:unit-1:name']
  }
];

module.exports = { DEMO_SENTENCES };
