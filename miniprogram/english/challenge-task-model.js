// 课程挑战的通用结构，供不同单元复用同一套剧情、输入、操作、反馈和奖励约定。
function isText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIdList(value) {
  return Array.isArray(value) && value.length > 0 &&
    value.every((id) => typeof id === 'string' && /^[a-z0-9][a-z0-9:._-]*$/i.test(id));
}

function isChallengeTask(value) {
  return Boolean(value && value.schemaVersion === 1 && isText(value.id) && isText(value.unitId) &&
    isText(value.sessionId) && value.story && isText(value.story.goal) && isText(value.story.openingDialogue) &&
    Array.isArray(value.englishInput) && value.englishInput.length > 0 &&
    value.englishInput.every((input) => isText(input.kind) && isIdList(input.contentIds)) &&
    Array.isArray(value.childActions) && value.childActions.length > 0 &&
    value.childActions.every((step) => isText(step.id) && isText(step.kind) && isText(step.prompt) &&
      isText(step.retryMessage) && isText(step.correctMessage)) &&
    value.feedback && isText(value.feedback.error) && isText(value.feedback.success) &&
    isText(value.feedback.completion) && value.reward && isText(value.reward.id) &&
    isText(value.reward.type) &&
    (value.reward.type !== 'star' || (Number.isInteger(value.reward.amount) && value.reward.amount > 0)) &&
    (value.reward.amount === undefined || (Number.isInteger(value.reward.amount) && value.reward.amount > 0)) &&
    (value.reward.targetId === undefined || isText(value.reward.targetId)) &&
    isText(value.reward.message));
}

// 以统一契约保存一节挑战；未知字段保留给后续听说读写任务扩展。
function createChallengeTask(definition) {
  const task = Object.assign({ schemaVersion: 1 }, definition || {});
  if (!isChallengeTask(task)) {
    throw new Error('课程挑战数据结构不完整');
  }
  return Object.freeze(task);
}

module.exports = {
  CHALLENGE_TASK_SCHEMA_VERSION: 1,
  createChallengeTask,
  isChallengeTask
};