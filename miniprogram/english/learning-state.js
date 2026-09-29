const { loadState, updateState } = require('../storage/local');
const {
  COURSE_ID,
  WELCOME_UNIT_ID,
  WELCOME_CHAPTER_ID,
  WELCOME_TASK_ID,
  UNIT1_UNIT_ID,
  UNIT1_CHAPTER_ID,
  UNIT1_CORE_TASK_ID,
  UNIT1_GREETING_TASK_ID
} = require('./learning-state-model');

const TASK_UNITS = Object.freeze({
  [WELCOME_TASK_ID]: WELCOME_UNIT_ID,
  [UNIT1_CORE_TASK_ID]: UNIT1_UNIT_ID,
  [UNIT1_GREETING_TASK_ID]: UNIT1_UNIT_ID
});

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function addUnique(ids, id) {
  if (ids.indexOf(id) === -1) {
    ids.push(id);
  }
}

function getLearningState() {
  return copy(loadState().learningState);
}

function isWelcomeCompleted(state) {
  const learning = state ? state.learningState || state : getLearningState();
  return learning.completedUnitIds.indexOf(WELCOME_UNIT_ID) !== -1;
}

function hasWelcomePrerequisite(state) {
  const learning = state ? state.learningState || state : getLearningState();
  return isWelcomeCompleted(learning);
}

// 首页和课程入口按 Welcome → Unit 1 的顺序选择下一段可进入内容。
function getNextCourseEntry() {
  if (!isWelcomeCompleted()) {
    return { courseId: COURSE_ID, unitId: WELCOME_UNIT_ID, chapterId: WELCOME_CHAPTER_ID, title: 'Welcome · 初次见面' };
  }
  return { courseId: COURSE_ID, unitId: UNIT1_UNIT_ID, chapterId: UNIT1_CHAPTER_ID, title: 'Unit 1 · 树屋的新朋友' };
}

function getUnitProgress(unitId) {
  return copy(getLearningState().unitProgressById[unitId] || null);
}

function getChapterProgress(chapterId) {
  return copy(getLearningState().chapterProgressById[chapterId] || null);
}

// 供业务模块在同一档案更新中同步写入任务游标和完成事实。
function applyTaskStarted(learning, taskId, stepIndex, now) {
  const unitId = TASK_UNITS[taskId];
  if (!unitId || !Number.isInteger(stepIndex) || stepIndex < 0 || learning.currentUnitId !== unitId) {
    throw new Error('当前课程顺序不允许开始该任务');
  }
  const previous = learning.taskProgressById[taskId];
  if (previous && previous.status === 'completed') {
    learning.currentTaskId = null;
    return;
  }
  learning.currentTaskId = taskId;
  learning.taskProgressById[taskId] = {
    status: 'in_progress',
    stepIndex: previous ? Math.max(previous.stepIndex, stepIndex) : stepIndex,
    startedAt: previous && previous.startedAt ? previous.startedAt : now,
    completedAt: null,
    updatedAt: now
  };
  learning.updatedAt = now;
}

function applyTaskStep(learning, taskId, stepIndex, now) {
  applyTaskStarted(learning, taskId, stepIndex, now);
}

function applyTaskCompleted(learning, taskId, now) {
  const unitId = TASK_UNITS[taskId];
  if (!unitId) {
    throw new Error('未知学习任务');
  }
  const previous = learning.taskProgressById[taskId];
  if (!previous || previous.status !== 'completed') {
    learning.taskProgressById[taskId] = {
      status: 'completed',
      stepIndex: previous ? previous.stepIndex : 0,
      startedAt: previous ? previous.startedAt : now,
      completedAt: now,
      updatedAt: now
    };
  }
  addUnique(learning.unitProgressById[unitId].completedTaskIds, taskId);
  if (learning.currentTaskId === taskId) {
    learning.currentTaskId = null;
  }
  learning.updatedAt = now;
}

function beginLearningChapter(courseId, unitId, chapterId) {
  if (courseId !== COURSE_ID || [WELCOME_UNIT_ID, UNIT1_UNIT_ID].indexOf(unitId) === -1 ||
      [WELCOME_CHAPTER_ID, UNIT1_CHAPTER_ID].indexOf(chapterId) === -1) {
    throw new Error('课程章节不存在');
  }
  if (unitId === UNIT1_UNIT_ID && !isWelcomeCompleted()) {
    throw new Error('请先和团团完成 Welcome 初次见面');
  }

  const now = new Date().toISOString();
  return updateState((draft) => {
    const learning = draft.learningState;
    const sameChapter = learning.currentChapterId === chapterId && learning.currentUnitId === unitId;
    learning.currentCourseId = courseId;
    learning.currentUnitId = unitId;
    learning.currentChapterId = chapterId;
    if (!sameChapter) {
      learning.currentTaskId = null;
    }
    const unit = learning.unitProgressById[unitId];
    if (unit.status !== 'completed') {
      unit.status = 'in_progress';
    }
    unit.updatedAt = now;
    const chapter = learning.chapterProgressById[chapterId] || { status: 'not_started', updatedAt: null };
    if (chapter.status !== 'completed') {
      chapter.status = 'in_progress';
    }
    chapter.updatedAt = now;
    learning.chapterProgressById[chapterId] = chapter;
    learning.updatedAt = now;
  }).learningState;
}

function setCurrentTask(taskId, stepIndex) {
  const now = new Date().toISOString();
  return updateState((draft) => {
    applyTaskStarted(draft.learningState, taskId, stepIndex, now);
  }).learningState;
}

function completeTask(taskId) {
  const now = new Date().toISOString();
  return updateState((draft) => {
    applyTaskCompleted(draft.learningState, taskId, now);
  }).learningState;
}

function completeLearningChapter(unitId, chapterId) {
  if ([WELCOME_UNIT_ID, UNIT1_UNIT_ID].indexOf(unitId) === -1 ||
      [WELCOME_CHAPTER_ID, UNIT1_CHAPTER_ID].indexOf(chapterId) === -1) {
    throw new Error('课程章节不存在');
  }
  if (unitId === WELCOME_UNIT_ID && !isWelcomeCompleted()) {
    const taskProgress = getLearningState().taskProgressById[WELCOME_TASK_ID];
    if (!taskProgress || taskProgress.status !== 'completed') {
      throw new Error('Welcome 学习任务尚未完成');
    }
  }

  const now = new Date().toISOString();
  return updateState((draft) => {
    const learning = draft.learningState;
    learning.chapterProgressById[chapterId] = { status: 'completed', updatedAt: now };
    addUnique(learning.completedChapterIds, chapterId);
    const unit = learning.unitProgressById[unitId];
    unit.updatedAt = now;
    if (unitId === WELCOME_UNIT_ID) {
      unit.status = 'completed';
      addUnique(learning.completedUnitIds, unitId);
      learning.currentUnitId = UNIT1_UNIT_ID;
      learning.currentChapterId = UNIT1_CHAPTER_ID;
    } else {
      // 当前 Unit 1 内容只是首个学习冒险，不能据此声称整册 Unit 1 已学完。
      unit.status = 'in_progress';
    }
    learning.currentCourseId = COURSE_ID;
    learning.currentTaskId = null;
    learning.updatedAt = now;
  }).learningState;
}

module.exports = {
  getLearningState,
  getNextCourseEntry,
  getUnitProgress,
  getChapterProgress,
  isWelcomeCompleted,
  hasWelcomePrerequisite,
  beginLearningChapter,
  setCurrentTask,
  applyTaskStarted,
  applyTaskStep,
  applyTaskCompleted,
  completeTask,
  completeLearningChapter
};
