const { loadState } = require('../storage/local');
const { getCharacterOverview } = require('./character-manager');
const { CHAPTER_001 } = require('../story/chapters/chapter_001');
const { TASK_ID } = require('../games/find-cookie/data');
const { WELCOME_PREVIEW, WELCOME_SESSIONS } = require('../curriculum/welcome/preview-content');
const { isWelcomeCompleted } = require('../english/learning-state');

// 同一档案快照派生伙伴、剧情、任务与按钮，展示层不保存另一份进度。
function getCompanionPageState() {
  const archive = loadState();
  const game = archive.gameState;
  const learning = archive.learningState;
  const characters = getCharacterOverview(game);
  const chapter = game.chapterProgress[CHAPTER_001.id];
  const storyCompleted = Boolean(chapter && chapter.status === 'completed');
  const taskCompleted = game.completedTaskIds.indexOf(TASK_ID) !== -1;
  const taskStarted = game.triggeredTaskIds.indexOf(TASK_ID) !== -1;
  const welcomeCompleted = isWelcomeCompleted(archive);
  const completedSessions = WELCOME_SESSIONS.filter((session) =>
    learning.taskProgressById[session.taskId] && learning.taskProgressById[session.taskId].status === 'completed'
  );
  const nextSession = WELCOME_SESSIONS.find((session) => completedSessions.indexOf(session) === -1);
  let action;
  if (game.currentStory) {
    action = { label: '继续正在进行的冒险', url: `/pages/story/story?chapterId=${game.currentStory.chapterId}`, kind: 'navigate' };
  } else if (storyCompleted && characters.mimi.unlocked) {
    action = { label: '回树屋看看新发现', url: '/pages/home/home', kind: 'home' };
  } else if (!welcomeCompleted) {
    const firstDone = completedSessions.some((session) => session.taskId === WELCOME_PREVIEW.taskId);
    action = firstDone && nextSession
      ? { label: `继续 Welcome · 第 ${nextSession.index + 1} 节`, url: `/pages/learn/learn?mode=welcome&taskId=${encodeURIComponent(nextSession.taskId)}`, kind: 'navigate' }
      : { label: '和团团开始 Welcome', url: `/pages/story/story?chapterId=${WELCOME_PREVIEW.chapterId}`, kind: 'navigate' };
  } else {
    action = {
      label: storyCompleted ? '查看米米加入奖励' : chapter && chapter.status === 'in_progress' ? '继续寻找米米的线索' : '和团团一起认识米米',
      url: `/pages/story/story?chapterId=${CHAPTER_001.id}`,
      kind: 'navigate'
    };
  }
  return {
    characters,
    stars: game.stars,
    welcomeCompleted,
    storyCompleted,
    taskCompleted,
    completedMilestones: [taskCompleted, storyCompleted, characters.mimi.unlocked].filter(Boolean).length,
    totalMilestones: 3,
    storyStatus: storyCompleted ? '故事已完成' : chapter && chapter.status === 'in_progress' ? '故事进行中' : '故事还没开始',
    taskStatus: taskCompleted ? '线索任务已完成' : taskStarted ? '线索任务已开启' : '线索任务还没开始',
    action
  };
}

module.exports = { getCompanionPageState };
