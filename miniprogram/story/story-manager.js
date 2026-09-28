const { CHAPTER_001 } = require('./chapters/chapter_001');
const { SCENE_001 } = require('./scenes/scene_001');
const { getGameState, updateGameState } = require('../game/state');
const { isValidContentId } = require('../game/model');

// 测试内容集中登记；未来可替换为经过审校的版本化内容包。
const CHAPTERS = Object.create(null);
const SCENES = Object.create(null);
CHAPTERS[CHAPTER_001.id] = CHAPTER_001;
SCENES[SCENE_001.id] = SCENE_001;

// 返回内容副本，防止页面或其他模块意外修改静态剧情。
function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function getChapter(chapterId) {
  return CHAPTERS[chapterId] ? copy(CHAPTERS[chapterId]) : null;
}

function getScene(sceneId) {
  return SCENES[sceneId] ? copy(SCENES[sceneId]) : null;
}

// 进入场景和完成场景时只登记任务触发，不等同于完成任务。
function recordTaskTriggers(gameState, scene, when) {
  scene.taskTriggers.filter((trigger) => trigger.when === when).forEach((trigger) => {
    if (gameState.triggeredTaskIds.indexOf(trigger.taskId) === -1) {
      gameState.triggeredTaskIds.push(trigger.taskId);
    }
  });
}

// 校验章节与场景关联，避免错误内容包污染用户进度。
function requireScene(chapter, sceneId) {
  const scene = SCENES[sceneId];
  if (!scene || scene.chapterId !== chapter.id || chapter.sceneIds.indexOf(sceneId) === -1 ||
      !Array.isArray(scene.dialogues) || scene.dialogues.length === 0 ||
      !scene.dialogues.every((line) => isValidContentId(line.speakerId) && typeof line.text === 'string') ||
      !Array.isArray(scene.taskTriggers) ||
      !scene.taskTriggers.every((trigger) => ['enter', 'complete'].indexOf(trigger.when) !== -1 && isValidContentId(trigger.taskId))) {
    throw new Error('剧情场景数据无效');
  }
  return scene;
}

// 启动章节时只设置游标与章节进度，不发放任何奖励。
function startChapter(chapterId) {
  const chapter = CHAPTERS[chapterId];
  if (!chapter) {
    throw new Error('未知剧情章节');
  }
  const scene = requireScene(chapter, chapter.firstSceneId);
  return updateGameState((draft) => {
    draft.currentStory = { chapterId, sceneId: scene.id, dialogueIndex: 0 };
    draft.chapterProgress[chapterId] = {
      status: 'in_progress',
      currentNodeId: scene.id,
      updatedAt: new Date().toISOString()
    };
    recordTaskTriggers(draft, scene, 'enter');
  });
}

// 返回当前对白与上下文副本，页面不接触可变的游戏状态对象。
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
    dialogue: copy(scene.dialogues[cursor.dialogueIndex]),
    dialogueIndex: cursor.dialogueIndex
  };
}

// 推进对白；场景结束时触发任务并进入下一场景或完成章节。
function advanceStory() {
  const cursor = getGameState().currentStory;
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
  const nextScene = scene.nextSceneId ? requireScene(chapter, scene.nextSceneId) : null;

  return updateGameState((draft) => {
    if (draft.currentStory.dialogueIndex + 1 < scene.dialogues.length) {
      draft.currentStory.dialogueIndex += 1;
      return;
    }

    recordTaskTriggers(draft, scene, 'complete');
    if (nextScene) {
      draft.currentStory = {
        chapterId: chapter.id,
        sceneId: nextScene.id,
        dialogueIndex: 0
      };
      draft.chapterProgress[chapter.id] = {
        status: 'in_progress',
        currentNodeId: nextScene.id,
        updatedAt: new Date().toISOString()
      };
      recordTaskTriggers(draft, nextScene, 'enter');
      return;
    }

    draft.currentStory = null;
    draft.chapterProgress[chapter.id] = {
      status: 'completed',
      currentNodeId: null,
      updatedAt: new Date().toISOString()
    };
  });
}

module.exports = { getChapter, getScene, startChapter, getCurrentStory, advanceStory };
