const test = require('node:test');
const assert = require('node:assert/strict');

const memoryStorage = Object.create(null);
global.wx = {
  getStorageSync(key) { return memoryStorage[key]; },
  setStorageSync(key, value) { memoryStorage[key] = JSON.parse(JSON.stringify(value)); }
};

const { createInitialState, STORAGE_KEY, updateState, loadState } = require('../miniprogram/storage/local');
const { WELCOME_PREVIEW, FIRST_SESSION_CHALLENGE_TASK } = require('../miniprogram/curriculum/welcome/preview-content');
const { isChallengeTask } = require('../miniprogram/english/challenge-task-model');
const { getGameState } = require('../miniprogram/game/state');
const { getNextCourseEntry, isWelcomeCompleted } = require('../miniprogram/english/learning-state');
const {
  startTask,
  getTaskView,
  chooseStep,
  markGreetingVocabularyAudioPlayed,
  completeGreetingInputStep,
  markCurrentAudioPlayed,
  selectSentenceBuildTile,
  completeInteractionStep
} = require('../miniprogram/english/welcome-learning');
const { interactWithTuantuan } = require('../miniprogram/pets/interaction');

function resetStorage() {
  Object.keys(memoryStorage).forEach((key) => { delete memoryStorage[key]; });
  memoryStorage[STORAGE_KEY] = createInitialState();
  updateState((draft) => { draft.gameState.triggeredTaskIds.push(WELCOME_PREVIEW.taskId); });
}

test('Welcome 第1节按问候听读、听音辨认、句子拼组和团团互动发放星星', () => {
  resetStorage();
  assert.equal(isChallengeTask(FIRST_SESSION_CHALLENGE_TASK), true);
  assert.equal(FIRST_SESSION_CHALLENGE_TASK.story.goal, WELCOME_PREVIEW.sessions[0].adventure.goal);
  assert.deepEqual(FIRST_SESSION_CHALLENGE_TASK.englishInput.map((item) => item.kind), ['vocabulary', 'listening', 'sentence']);
  assert.equal(FIRST_SESSION_CHALLENGE_TASK.reward.type, 'star');

  let view = startTask();
  assert.equal(view.sessionIndex, 1);
  assert.equal(view.step.kind, 'greeting-input');
  assert.deepEqual(view.step.vocabulary.map((word) => word.english), ['hello', 'hi']);
  assert.equal(view.step.inputReady, false);
  assert.throws(() => chooseStep('skip'), /对应的互动方式/);
  assert.equal(completeGreetingInputStep().correct, false, '未听两张卡不能跳过输入步骤');

  const helloId = 'wj-g3-v1:welcome:hello';
  const hiId = 'wj-g3-v1:welcome:hi';
  assert.equal(markGreetingVocabularyAudioPlayed(helloId), true);
  assert.equal(completeGreetingInputStep().correct, false, '只听过 Hello 仍不能进入听辨');
  assert.equal(markGreetingVocabularyAudioPlayed(hiId), true);
  assert.equal(getTaskView().step.inputReady, true);
  assert.equal(completeGreetingInputStep().correct, true);

  view = getTaskView();
  assert.equal(view.step.kind, 'listen-and-identify');
  assert.equal(chooseStep(hiId).correct, false, '未播放题目音频时不能选择');
  assert.equal(markCurrentAudioPlayed(), true);
  assert.equal(chooseStep(helloId).correct, false, '错误选项保留在当前听力挑战');
  assert.equal(getTaskView().step.kind, 'listen-and-identify');
  assert.equal(chooseStep(hiId).correct, true);

  view = getTaskView();
  assert.equal(view.step.kind, 'sentence-build');
  assert.equal(selectSentenceBuildTile('session-01-hello').correct, false, '错误词块不推进进度');
  assert.equal(getTaskView().step.kind, 'sentence-build');
  assert.equal(getTaskView().step.prompt, '米米想向团团介绍自己。按顺序拼出这句话，看看星星徽章藏在哪里。');
  assert.equal(selectSentenceBuildTile('session-01-hi').correct, true);
  assert.equal(getTaskView().step.selectedTiles.length, 1, '拼句进度保存在本地档案');
  assert.equal(selectSentenceBuildTile('session-01-im').correct, true);
  const sentenceResult = selectSentenceBuildTile('session-01-mimi');
  assert.equal(sentenceResult.correct, true);
  assert.match(sentenceResult.companionMessage, /星星徽章/);
  assert.equal(getTaskView().step.kind, 'companion-interaction');
  assert.equal(getGameState().stars, 0, '完成英语挑战前不发星星');

  assert.equal(completeInteractionStep(null).completed, false, '没有实际伙伴互动时不完成冒险');
  const interaction = interactWithTuantuan();
  const completion = completeInteractionStep(interaction);
  assert.equal(completion.completed, true);
  assert.equal(completion.rewardAmount, 1);
  assert.equal(getGameState().stars, 1);
  assert.equal(loadState().learningState.taskProgressById[WELCOME_PREVIEW.taskId].status, 'completed');
  assert.equal(isWelcomeCompleted(), false, '完成第1节不会跳过后续 Welcome 或解锁 Unit1');
  assert.equal(getNextCourseEntry().chapterId, WELCOME_PREVIEW.chapterId);
});
