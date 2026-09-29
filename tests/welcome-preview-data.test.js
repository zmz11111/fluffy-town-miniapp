const test = require('node:test');
const assert = require('node:assert/strict');

const {
  WELCOME_SESSIONS,
  WELCOME_KNOWLEDGE,
  WELCOME_DAILY_PLAN,
  buildReleaseSessionSteps
} = require('../miniprogram/curriculum/welcome/preview-content');

const CHOICE_STEP_KINDS = new Set([
  'learn-vocabulary',
  'practice-sentence',
  'listen-and-identify',
  'speak-choice',
  'letter-match'
]);

test('Welcome 七节课程都包含可完成的学习任务、伙伴互动和完整步骤字段', () => {
  assert.equal(WELCOME_SESSIONS.length, 7);
  assert.equal(WELCOME_SESSIONS.length, WELCOME_DAILY_PLAN.releaseSessions.length);

  WELCOME_SESSIONS.forEach((session, index) => {
    assert.equal(session.index, index, `${session.id} 应保留正确课次索引`);
    assert.ok(session.id, '课程必须有稳定 ID');
    assert.ok(session.taskId, `${session.id} 必须有关联任务 ID`);
    assert.ok(session.title, `${session.id} 必须有课程标题`);
    assert.ok(Array.isArray(session.steps) && session.steps.length > 0, `${session.id} 必须生成步骤`);

    const adventureFields = [
      'goal', 'openingDialogue', 'retryDialogue', 'successDialogue',
      'companionPrompt', 'companionButtonLabel', 'completionDialogue',
      'rewardId', 'rewardMessage'
    ];
    adventureFields.forEach((field) => {
      assert.equal(typeof session.adventure[field], 'string', `${session.id} 的冒险字段 ${field} 必须是文本`);
      assert.ok(session.adventure[field].trim(), `${session.id} 的冒险字段 ${field} 不能是空值`);
    });

    const learningSteps = session.steps.filter((step) => CHOICE_STEP_KINDS.has(step.kind));
    assert.ok(learningSteps.length > 0, `${session.id} 必须先有英语或字母学习挑战`);
    assert.ok(session.steps.some((step) => step.kind === 'companion-interaction'), `${session.id} 必须有团团互动`);

    session.steps.forEach((step) => {
      assert.ok(typeof step.id === 'string' && step.id, `${session.id} 的每一步都要有 ID`);
      assert.ok(typeof step.kind === 'string' && step.kind, `${session.id} 的每一步都要有类型`);
      assert.ok(typeof step.prompt === 'string' && step.prompt, `${session.id}/${step.id} 必须有任务提示`);

      if (CHOICE_STEP_KINDS.has(step.kind)) {
        assert.ok(Array.isArray(step.options) && step.options.length >= 2, `${session.id}/${step.id} 必须有选择项`);
        step.options.forEach((option) => {
          assert.ok(typeof option.id === 'string' && option.id, `${session.id}/${step.id} 的选项必须有 ID`);
          assert.ok(typeof option.label === 'string' && option.label, `${session.id}/${step.id} 的选项必须有显示文字`);
        });
        assert.ok(step.options.some((option) => option.id === step.correctOptionId), `${session.id}/${step.id} 的正确选项必须存在`);
        assert.ok(step.correctMessage, `${session.id}/${step.id} 必须有答对反馈`);
        assert.ok(step.retryMessage, `${session.id}/${step.id} 必须有鼓励重试反馈`);
      }

      if (step.kind === 'companion-interaction') {
        assert.ok(step.buttonLabel, `${session.id} 的团团互动必须有按钮文字`);
      }

      if (step.requireAudioPlayed) {
        assert.ok(typeof step.audioSrc === 'string' && step.audioSrc, `${session.id}/${step.id} 听力题必须有音频路径`);
      }
    });
  });
});

test('缺少中文释义时生成器使用默认文案，且原始课次没有 index 也不崩溃', () => {
  const sourceSession = WELCOME_DAILY_PLAN.releaseSessions[1];
  const vocabulary = WELCOME_KNOWLEDGE.vocabulary.find((entry) => entry.id === sourceSession.vocabularyIds[0]);
  const sentence = WELCOME_KNOWLEDGE.sentences.find((entry) => entry.id === sourceSession.sentenceIds[0]);
  const originalVocabularyMeaning = vocabulary.chinese;
  const originalSentenceMeaning = sentence.chinese;

  try {
    delete vocabulary.chinese;
    delete sentence.chinese;

    const generatedSteps = buildReleaseSessionSteps(sourceSession);
    const vocabularyStep = generatedSteps.find((step) => step.kind === 'learn-vocabulary');
    const sentenceStep = generatedSteps.find((step) => step.kind === 'practice-sentence');

    assert.match(vocabularyStep.prompt, new RegExp(vocabulary.english));
    assert.match(vocabularyStep.correctMessage, new RegExp(vocabulary.english));
    assert.match(sentenceStep.prompt, new RegExp(sentence.text));
    assert.match(sentenceStep.correctMessage, new RegExp(sentence.text));
    assert.doesNotMatch(JSON.stringify(generatedSteps), /undefined/);
  } finally {
    vocabulary.chinese = originalVocabularyMeaning;
    sentence.chinese = originalSentenceMeaning;
  }
});
