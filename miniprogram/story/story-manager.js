const { CHAPTER_001 } = require('./chapters/chapter_001');
const { CHAPTER_UNIT1 } = require('./chapters/chapter_unit1');
const { CHAPTER_WELCOME } = require('./chapters/chapter_welcome');
const { SCENE_001 } = require('./scenes/scene_001');
const { SCENE_002 } = require('./scenes/scene_002');
const { SCENE_003 } = require('./scenes/scene_003');
const { SCENE_004 } = require('./scenes/scene_004');
const { SCENE_005 } = require('./scenes/scene_005');
const { UNIT1_SCENE_001 } = require('./scenes/unit1_scene_001');
const { UNIT1_SCENE_002 } = require('./scenes/unit1_scene_002');
const { UNIT1_SCENE_003 } = require('./scenes/unit1_scene_003');
const { UNIT1_SCENE_004 } = require('./scenes/unit1_scene_004');
const { WELCOME_SCENE_001 } = require('./scenes/welcome_scene_001');
const { WELCOME_SCENE_002 } = require('./scenes/welcome_scene_002');
const { getTuantuanDialogue } = require('../pets/tuantuan-dialogues');
const { getGameState, updateGameState } = require('../game/state');
const { isValidContentId } = require('../game/model');
const { normalizeScene, getScenePresentation } = require('./scene-model');
const { applyRewardToGameState } = require('../reward/reward-manager');
const { UNIT1_PREVIEW } = require('../curriculum/unit1/preview-content');
const { beginLearningChapter, setCurrentTask, applyLearningChapterCompleted } = require('../english/learning-state');

// 故事内容集中登记，章节定义与孩子的个人进度始终分离。
const CHAPTERS = Object.create(null);
const SCENES = Object.create(null);
CHAPTERS[CHAPTER_001.id] = CHAPTER_001;
CHAPTERS[CHAPTER_UNIT1.id] = CHAPTER_UNIT1;
CHAPTERS[CHAPTER_WELCOME.id] = CHAPTER_WELCOME;
[
  SCENE_001, SCENE_002, SCENE_003, SCENE_004, SCENE_005,
  UNIT1_SCENE_001, UNIT1_SCENE_002, UNIT1_SCENE_003, UNIT1_SCENE_004,
  WELCOME_SCENE_001, WELCOME_SCENE_002
].forEach((scene) => {
  SCENES[scene.id] = scene;
});

// 每个章节只从目录取奖励 ID；第一章旧奖励继续保留，Unit 1 只发一颗星。
const CHAPTER_REWARD_IDS = Object.freeze({
  [CHAPTER_WELCOME.id]: Object.freeze([]),
  [CHAPTER_001.id]: Object.freeze([
    'demo-grade-3:reward-chapter-001-stars',
    'demo-grade-3:reward-mimi-unlock'
  ]),
  [CHAPTER_UNIT1.id]: Object.freeze([UNIT1_PREVIEW.rewardId])
});

// 返回内容副本，防止页面意外修改剧情定义。
function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function getChapter(chapterId) {
  return CHAPTERS[chapterId] ? copy(CHAPTERS[chapterId]) : null;
}

function getScene(sceneId) {
  return SCENES[sceneId] ? normalizeScene(SCENES[sceneId]) : null;
}

// 团团对白从角色对话池解析，其他角色对白由场景提供。
function resolveDialogue(line) {
  if (line.speakerId === 'tuantuan' && line.dialogueKey) {
    const dialogue = getTuantuanDialogue(line.dialogueKey);
    if (!dialogue) {
      throw new Error('团团对白不存在');
    }
    return { speakerId: 'tuantuan', text: dialogue.text, expression: line.expression };
  }
  if (!isValidContentId(line.speakerId) || typeof line.text !== 'string' || !line.text.trim()) {
    throw new Error('角色对白数据无效');
  }
  return { speakerId: line.speakerId, text: line.text, expression: line.expression };
}

// 检查场景归属与转场 ID，避免错误内容包破坏进度。
function requireScene(chapter, sceneId) {
  const scene = getScene(sceneId);
  if (!scene || scene.chapterId !== chapter.id || chapter.sceneIds.indexOf(sceneId) === -1 ||
      !Array.isArray(scene.dialogues) || scene.dialogues.length === 0 ||
      !Array.isArray(scene.taskTriggers) ||
      !scene.taskTriggers.every((trigger) => ['enter', 'complete'].indexOf(trigger.when) !== -1 && isValidContentId(trigger.taskId)) ||
      (scene.requiredTaskId !== null && !isValidContentId(scene.requiredTaskId)) ||
      (scene.nextSceneId !== null && chapter.sceneIds.indexOf(scene.nextSceneId) === -1)) {
    throw new Error('剧情场景数据无效');
  }
  scene.dialogues.forEach(resolveDialogue);
  return scene;
}

// 触发任务只表示它已出现；小游戏负责在完成后写入完成记录。
function recordTaskTriggers(draft, scene, when) {
  scene.taskTriggers.filter((trigger) => trigger.when === when).forEach((trigger) => {
    if (draft.triggeredTaskIds.indexOf(trigger.taskId) === -1) {
      draft.triggeredTaskIds.push(trigger.taskId);
    }
  });
}

// 进入场景时更新游标和团团情绪，并记录米米首次见面。
function enterScene(draft, chapter, scene) {
  draft.currentStory = { chapterId: chapter.id, sceneId: scene.id, dialogueIndex: 0 };
  draft.chapterProgress[chapter.id] = {
    status: 'in_progress',
    currentNodeId: scene.id,
    updatedAt: new Date().toISOString()
  };
  draft.companions.tuantuan.emotion = scene.tuantuanEmotion;
  draft.companions.tuantuan.lastStorySceneId = scene.id;
  if (scene.id === SCENE_001.id && draft.companions.mimi.storyProgress === 'not_met') {
    draft.companions.mimi.storyProgress = 'met';
  }
  recordTaskTriggers(draft, scene, 'enter');
}

// 进入第一章时保留已有游标；完成后重进只补发遗漏的奖励。
function startChapter(chapterId) {
  const chapter = CHAPTERS[chapterId];
  if (!chapter) {
    throw new Error('未知剧情章节');
  }
  const state = getGameState();
  if (state.currentStory && state.currentStory.chapterId !== chapterId) {
    throw new Error('请先继续当前冒险，再开始另一段故事');
  }
  const resumingSameStory = Boolean(state.currentStory && state.currentStory.chapterId === chapterId);
  if (chapter.learningUnitId && !resumingSameStory) {
    beginLearningChapter(chapter.courseId, chapter.learningUnitId, chapter.id);
  }
  if (state.chapterProgress[chapterId] && state.chapterProgress[chapterId].status === 'completed') {
    return ensureChapterRewards(chapterId);
  }
  if (resumingSameStory) {
    return state;
  }
  const scene = requireScene(chapter, chapter.firstSceneId);
  const updated = updateGameState((draft) => { enterScene(draft, chapter, scene); });
  if (chapter.learningUnitId && scene.requiredTaskId) {
    setCurrentTask(scene.requiredTaskId, 0);
  }
  return updated;
}

// 返回当前对白与场景位置，页面只读取展示所需信息。
function getCurrentStory() {
  const cursor = getGameState().currentStory;
  if (!cursor) {
    return null;
  }
  const chapter = CHAPTERS[cursor.chapterId];
  if (!chapter) {
    throw new Error('当前剧情章节不存在');
  }
  const scene = requireScene(chapter, cursor.sceneId);
  if (cursor.dialogueIndex >= scene.dialogues.length) {
    throw new Error('当前对白位置无效');
  }
  return {
    chapter: copy(chapter),
    scene: copy(scene),
    sceneIndex: chapter.sceneIds.indexOf(scene.id) + 1,
    dialogue: resolveDialogue(scene.dialogues[cursor.dialogueIndex]),
    presentation: getScenePresentation(scene, resolveDialogue(scene.dialogues[cursor.dialogueIndex])),
    dialogueIndex: cursor.dialogueIndex,
    isLastDialogue: cursor.dialogueIndex === scene.dialogues.length - 1
  };
}

// 第一章完成后按奖励 ID 补发，重复进入不会重复增加星星或角色。
function ensureChapterRewards(chapterId) {
  const rewardIds = CHAPTER_REWARD_IDS[chapterId];
  if (!rewardIds) {
    throw new Error('未知剧情章节');
  }
  const state = getGameState();
  if (!state.chapterProgress[chapterId] || state.chapterProgress[chapterId].status !== 'completed') {
    return state;
  }
  return updateGameState((draft) => {
    rewardIds.forEach((rewardId) => applyRewardToGameState(draft, rewardId));
  });
}

// 推进对白；寻找线索场景必须先完成听音找图任务。
function advanceStory() {
  const state = getGameState();
  const cursor = state.currentStory;
  if (!cursor) {
    throw new Error('当前没有进行中的剧情');
  }
  const chapter = CHAPTERS[cursor.chapterId];
  if (!chapter) {
    throw new Error('当前剧情章节不存在');
  }
  const scene = requireScene(chapter, cursor.sceneId);
  if (cursor.dialogueIndex >= scene.dialogues.length) {
    throw new Error('当前对白位置无效');
  }
  const isLastDialogue = cursor.dialogueIndex === scene.dialogues.length - 1;
  if (isLastDialogue && scene.requiredTaskId &&
      state.completedTaskIds.indexOf(scene.requiredTaskId) === -1) {
    return { status: 'task_required', taskId: scene.requiredTaskId };
  }
  const nextScene = scene.nextSceneId ? requireScene(chapter, scene.nextSceneId) : null;

  const updated = updateGameState((draft, archive) => {
    if (!isLastDialogue) {
      draft.currentStory.dialogueIndex += 1;
      return;
    }
    recordTaskTriggers(draft, scene, 'complete');
    if (nextScene) {
      enterScene(draft, chapter, nextScene);
      return;
    }
    draft.currentStory = null;
    draft.chapterProgress[chapter.id] = {
      status: 'completed',
      currentNodeId: null,
      updatedAt: new Date().toISOString()
    };
    // 章节完成、伙伴解锁与星星一起保存，失败时仍停留在最后一句对白。
    if (chapter.learningUnitId) {
      applyLearningChapterCompleted(archive.learningState, chapter.learningUnitId, chapter.id, new Date().toISOString());
    }
    CHAPTER_REWARD_IDS[chapter.id].forEach((rewardId) => applyRewardToGameState(draft, rewardId));
  });

  if (updated.chapterProgress[chapter.id].status === 'completed') {
    return { status: 'chapter_completed' };
  }
  if (chapter.learningUnitId && nextScene && nextScene.requiredTaskId) {
    setCurrentTask(nextScene.requiredTaskId, 0);
  }
  return { status: 'advanced' };
}

module.exports = {
  getChapter,
  getScene,
  startChapter,
  getCurrentStory,
  advanceStory,
  ensureChapterRewards
};
