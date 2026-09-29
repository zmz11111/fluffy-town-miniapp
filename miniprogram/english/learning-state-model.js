// 课程顺序只收录当前已接入的 Welcome 和 Unit 1；其余单元待内容审核后加入。
const COURSE_ID = 'wj-g3-v1';
const WELCOME_UNIT_ID = 'wj-g3-v1:welcome';
const WELCOME_CHAPTER_ID = 'wj-g3-v1:welcome:chapter';
const WELCOME_TASK_ID = 'wj-g3-v1:welcome:task-greeting-and-introduction';
const WELCOME_SESSION_TASK_IDS = Object.freeze([
  WELCOME_TASK_ID,
  'wj-g3-v1:welcome:task-self-introduction',
  'wj-g3-v1:welcome:task-morning-greetings',
  'wj-g3-v1:welcome:task-farewell',
  'wj-g3-v1:welcome:task-classroom-actions-one',
  'wj-g3-v1:welcome:task-classroom-actions-two',
  'wj-g3-v1:welcome:task-letter-recognition'
]);
const WELCOME_OBJECTIVE_IDS = Object.freeze([
  'greet-in-context',
  'introduce-self',
  'understand-learning-actions',
  'farewell',
  'recognize-letters'
]);
const UNIT1_UNIT_ID = 'wj-g3-v1:unit-1';
const UNIT1_CHAPTER_ID = 'wj-g3-v1:unit-1:chapter-first-adventure';
const UNIT1_CORE_TASK_ID = 'wj-g3-v1:unit-1:task-self-introduction';
const UNIT1_GREETING_TASK_ID = 'wj-g3-v1:unit-1:task-greeting-cards';
const UNIT1_GREETING_GAME_ID = 'wj-g3-v1:unit-1:game-greeting-cards';

function createUnitProgress(chapterId) {
  return { status: 'not_started', chapterId, completedTaskIds: [], updatedAt: null };
}

// 返回全新对象，课程进度不会在不同新档案间共享引用。
function createInitialLearningState() {
  return {
    currentCourseId: COURSE_ID,
    currentUnitId: WELCOME_UNIT_ID,
    currentChapterId: WELCOME_CHAPTER_ID,
    currentTaskId: null,
    completedChapterIds: [],
    completedUnitIds: [],
    prerequisiteBypassUnitIds: [],
    objectiveProgressById: {},
    unitProgressById: {
      [WELCOME_UNIT_ID]: createUnitProgress(WELCOME_CHAPTER_ID),
      [UNIT1_UNIT_ID]: createUnitProgress(UNIT1_CHAPTER_ID)
    },
    chapterProgressById: {},
    taskProgressById: {},
    updatedAt: null
  };
}

function isContentId(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]*$/i.test(value);
}

function isUniqueIdList(value) {
  return Array.isArray(value) && value.every(isContentId) && new Set(value).size === value.length;
}

function isAnswerDraftMap(value) {
  return value === undefined || Boolean(
    value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).every((stepId) => isContentId(stepId) && isUniqueIdList(value[stepId]))
  );
}

function isProgressMap(value, allowedStatuses, requiresChapter) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).every((id) => {
      const entry = value[id];
      return isContentId(id) && entry && allowedStatuses.indexOf(entry.status) !== -1 &&
        (entry.updatedAt === null || typeof entry.updatedAt === 'string') &&
        (!requiresChapter || isContentId(entry.chapterId)) &&
        (!requiresChapter || isUniqueIdList(entry.completedTaskIds)) &&
        (entry.stepIndex === undefined || (Number.isInteger(entry.stepIndex) && entry.stepIndex >= 0)) &&
        (entry.startedAt === undefined || entry.startedAt === null || typeof entry.startedAt === 'string') &&
        (entry.completedAt === undefined || entry.completedAt === null || typeof entry.completedAt === 'string') &&
        isAnswerDraftMap(entry.answerDraftByStepId);
    }));
}

// 存档加载和迁移都用同一份结构校验，避免损坏的任务游标进入页面。
function isValidLearningState(value) {
  const allowedProgress = ['not_started', 'in_progress', 'completed'];
  return Boolean(
    value && isContentId(value.currentCourseId) &&
    isContentId(value.currentUnitId) && isContentId(value.currentChapterId) &&
    (value.currentTaskId === null || isContentId(value.currentTaskId)) &&
    isUniqueIdList(value.completedChapterIds) && isUniqueIdList(value.completedUnitIds) &&
    isUniqueIdList(value.prerequisiteBypassUnitIds) &&
    (value.objectiveProgressById === undefined ||
      isProgressMap(value.objectiveProgressById, ['in_progress', 'completed'], false)) &&
    isProgressMap(value.unitProgressById, allowedProgress, true) &&
    isProgressMap(value.chapterProgressById, allowedProgress, false) &&
    isProgressMap(value.taskProgressById, ['in_progress', 'paused', 'completed', 'skipped'], false) &&
    (value.updatedAt === null || typeof value.updatedAt === 'string')
  );
}

// 旧档若已进入 Unit 1，仅记录先修豁免，不伪造 Welcome 学习完成证据。
function createLearningStateFromLegacy(gameState) {
  const learningState = createInitialLearningState();
  const unit1Chapter = gameState.chapterProgress[UNIT1_CHAPTER_ID];
  const hasUnit1Progress = Boolean(unit1Chapter && unit1Chapter.status !== 'not_started');
  const hasUnit1Story = Boolean(gameState.currentStory && gameState.currentStory.chapterId === UNIT1_CHAPTER_ID);

  if (hasUnit1Progress || hasUnit1Story) {
    const now = new Date().toISOString();
    learningState.prerequisiteBypassUnitIds.push(WELCOME_UNIT_ID);
    learningState.currentUnitId = UNIT1_UNIT_ID;
    learningState.currentChapterId = UNIT1_CHAPTER_ID;
    // 旧 Alpha 章节只覆盖 Unit 1 的一部分，不等同于整单元完成。
    learningState.unitProgressById[UNIT1_UNIT_ID].status = 'in_progress';
    learningState.unitProgressById[UNIT1_UNIT_ID].updatedAt = now;
    learningState.chapterProgressById[UNIT1_CHAPTER_ID] = {
      status: unit1Chapter && unit1Chapter.status === 'completed' ? 'completed' : 'in_progress',
      updatedAt: now
    };
    if (unit1Chapter && unit1Chapter.status === 'completed') {
      learningState.completedChapterIds.push(UNIT1_CHAPTER_ID);
    }
    if (hasUnit1Story) {
      learningState.currentTaskId = gameState.currentGame && gameState.currentGame.gameId === UNIT1_CORE_TASK_ID
        ? UNIT1_CORE_TASK_ID
        : gameState.currentGame && gameState.currentGame.gameId === UNIT1_GREETING_GAME_ID
          ? UNIT1_GREETING_TASK_ID : null;
    }
    gameState.completedTaskIds.forEach((taskId) => {
      if (taskId === UNIT1_CORE_TASK_ID || taskId === UNIT1_GREETING_TASK_ID) {
        learningState.taskProgressById[taskId] = {
          status: 'completed', stepIndex: 0, startedAt: null, completedAt: now, updatedAt: now
        };
        learningState.unitProgressById[UNIT1_UNIT_ID].completedTaskIds.push(taskId);
      }
    });
    learningState.currentCourseId = COURSE_ID;
    learningState.updatedAt = now;
  }

  return learningState;
}

module.exports = {
  COURSE_ID,
  WELCOME_UNIT_ID,
  WELCOME_CHAPTER_ID,
  WELCOME_TASK_ID,
  WELCOME_SESSION_TASK_IDS,
  WELCOME_OBJECTIVE_IDS,
  UNIT1_UNIT_ID,
  UNIT1_CHAPTER_ID,
  UNIT1_CORE_TASK_ID,
  UNIT1_GREETING_TASK_ID,
  UNIT1_GREETING_GAME_ID,
  createInitialLearningState,
  createLearningStateFromLegacy,
  isValidLearningState
};
