const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// 模拟原生页面与组件，确认纯展示处理不会额外写入课程状态。
const memory = Object.create(null);
global.wx = {
  getStorageSync(key) { return memory[key]; },
  setStorageSync(key, value) { memory[key] = JSON.parse(JSON.stringify(value)); },
  setNavigationBarTitle() {},
  createInnerAudioContext() { return { onError() {}, stop() {}, play() {}, destroy() {} }; }
};
const { STORAGE_KEY, createInitialState, loadState } = require('../miniprogram/storage/local');
const { getMimiVisual, getWelcomeCharacterVisuals } = require('../miniprogram/assets/welcome-visuals');
const { getStoryAvatar } = require('../miniprogram/assets/visuals');
const story = require('../miniprogram/story/story-manager');
const { CHAPTER_WELCOME } = require('../miniprogram/story/chapters/chapter_welcome');
const { WELCOME_SESSIONS } = require('../miniprogram/curriculum/welcome/preview-content');
const { isWelcomeCompleted } = require('../miniprogram/english/learning-state');

function capture(kind, filename) {
  let definition;
  const previous = global[kind];
  global[kind] = (value) => { definition = value; };
  const resolved = path.resolve(__dirname, filename);
  delete require.cache[resolved];
  try { require(resolved); } finally { global[kind] = previous; }
  return definition;
}

function createPage(name) {
  const definition = capture('Page', `../miniprogram/pages/${name}/${name}.js`);
  return Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update) { Object.assign(this.data, update); }
  });
}

function release(page) {
  page.clearChoiceTimer();
  page.choiceBusy = false;
  page.setData({ choiceBusy: false });
}

test('四态米米资源存在且可替换，未知表情回退原头像', () => {
  ['idle', 'happy', 'thinking', 'surprise'].forEach((expression) => {
    const filename = path.resolve(__dirname, '../miniprogram', '.' + getMimiVisual(expression).src);
    assert.equal(fs.existsSync(filename), true);
    const png = fs.readFileSync(filename);
    assert.equal(png.readUInt32BE(16), 512);
    assert.equal(png.readUInt32BE(20), 512);
  });
  assert.equal(getMimiVisual('unknown').src, getStoryAvatar('mimi').src);
  assert.equal(getWelcomeCharacterVisuals('sentence-build', 'curious', false).tuantuan.src,
    getWelcomeCharacterVisuals('sentence-build', 'thinking', false).tuantuan.src);
});

test('组件转场、表情变化和缺图只更新展示数据，不修改存档', () => {
  memory[STORAGE_KEY] = createInitialState();
  const definition = capture('Component', '../miniprogram/components/welcome-scene/welcome-scene.js');
  const component = Object.assign({}, definition.methods, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update) { Object.assign(this.data, update); }
  });
  const before = loadState();
  definition.observers.sceneKey.call(component, 'scene-1');
  assert.equal(component.data.frames[0].id, 'scene-1');
  definition.observers['mimiVisual.src'].call(component, getMimiVisual('thinking').src);
  component.onMimiError();
  definition.observers['mimiVisual.src'].call(component, getMimiVisual('thinking').src);
  assert.equal(component.data.mimiFailed, true, '相同失败资源保持回退，避免不断重试');
  definition.observers['mimiVisual.src'].call(component, getMimiVisual('happy').src);
  assert.equal(component.data.mimiFailed, false);
  component.onTuantuanError();
  component.onBackgroundError();
  definition.observers.sceneKey.call(component, 'scene-2');
  assert.equal(component.data.frames[0].id, 'scene-2');
  assert.deepEqual(loadState(), before);
});

test('Welcome 首课页面保留真实学习门槛，错误思考、成功开心、奖励惊喜', () => {
  memory[STORAGE_KEY] = createInitialState();
  story.startChapter(CHAPTER_WELCOME.id);
  const page = createPage('learn');
  page.onLoad({ mode: 'welcome' });
  try {
    page.onShow();
    const initialKey = page.data.welcomeSceneKey;
    assert.equal(page.data.welcomeStep.kind, 'greeting-input');
    page.completeWelcomeGreetingInputStep();
    assert.equal(page.data.welcomeSceneKey, initialKey, '没有听读行为仍不能推进');
    release(page);
    page.data.welcomeStep.requiredAudioVocabularyIds.forEach((wordId) => {
      page.playWelcomeGreetingAudio({ currentTarget: { dataset: { wordId } } });
    });
    assert.equal(page.data.welcomeSceneKey, initialKey, '同一步重听不重新创建场景');
    page.completeWelcomeGreetingInputStep();
    release(page);
    assert.notEqual(page.data.welcomeSceneKey, initialKey);
    page.playWelcomeAudio();
    const listening = WELCOME_SESSIONS[0].steps.find((step) => step.kind === 'listen-and-identify');
    const wrong = listening.options.find((option) => option.id !== listening.correctOptionId);
    page.chooseWelcomeOption({ currentTarget: { dataset: { optionId: wrong.id } } });
    assert.equal(page.data.mimiVisual.src, getMimiVisual('thinking').src);
    assert.equal(page.data.welcomeStep.kind, 'listen-and-identify');
    release(page);
    page.chooseWelcomeOption({ currentTarget: { dataset: { optionId: listening.correctOptionId } } });
    assert.equal(page.data.mimiVisual.src, getMimiVisual('happy').src);
    release(page);
    const sentence = WELCOME_SESSIONS[0].steps.find((step) => step.kind === 'sentence-build');
    sentence.correctTileIds.forEach((tileId) => {
      page.chooseSentenceBuildTile({ currentTarget: { dataset: { tileId } } });
      release(page);
    });
    page.interactForWelcome();
    assert.equal(page.data.welcomeStatus, 'completed');
    assert.equal(page.data.mimiVisual.src, getMimiVisual('surprise').src);
    assert.ok(page.data.welcomeRewardMessage);
    assert.equal(loadState().gameState.stars, 1);
    assert.equal(isWelcomeCompleted(), false);
    page.interactForWelcome();
    assert.equal(loadState().gameState.stars, 1, '完成反馈和动画不重复发奖');
  } finally { page.onUnload(); }
});

test('Welcome 剧情使用场景表情和米米新图，原素材接口保持不变', () => {
  memory[STORAGE_KEY] = createInitialState();
  story.startChapter(CHAPTER_WELCOME.id);
  const page = createPage('story');
  page.chapterId = CHAPTER_WELCOME.id;
  page.refreshStory();
  assert.equal(page.data.isWelcome, true);
  assert.equal(page.data.welcomeShowMimi, false);
  assert.equal(page.data.welcomeSceneKey, CHAPTER_WELCOME.firstSceneId);
  const oldMimiAvatar = getStoryAvatar('mimi');
  assert.notEqual(getMimiVisual('happy').src, oldMimiAvatar.src);
  assert.equal(getStoryAvatar('mimi').src, oldMimiAvatar.src);
  ['learn', 'story'].forEach((name) => {
    const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../miniprogram/pages/${name}/${name}.json`), 'utf8'));
    assert.equal(config.usingComponents['welcome-scene'], '/components/welcome-scene/welcome-scene');
  });
});
