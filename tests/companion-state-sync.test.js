const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// 页面与任务共享内存存档，模拟返回已有伙伴页而非重新创建页面。
const memory = Object.create(null);
const navigation = [];
global.wx = {
  getStorageSync(key) { return memory[key]; },
  setStorageSync(key, value) { memory[key] = JSON.parse(JSON.stringify(value)); },
  navigateTo(options) { navigation.push({ kind: 'navigate', url: options.url }); },
  reLaunch(options) { navigation.push({ kind: 'home', url: options.url }); }
};
const { STORAGE_KEY, createInitialState, loadState } = require('../miniprogram/storage/local');
const { completeWelcomeSession } = require('../miniprogram/english/learning-state');
const { WELCOME_SESSIONS } = require('../miniprogram/curriculum/welcome/preview-content');
const { CHAPTER_001 } = require('../miniprogram/story/chapters/chapter_001');
const story = require('../miniprogram/story/story-manager');
const cookie = require('../miniprogram/games/find-cookie/game-manager');
const { ROUND_DEFINITIONS } = require('../miniprogram/games/find-cookie/data');

function page(name) {
  let definition;
  const previous = global.Page;
  global.Page = (value) => { definition = value; };
  const filename = path.resolve(__dirname, `../miniprogram/pages/${name}/${name}.js`);
  delete require.cache[filename];
  try { require(filename); } finally { global.Page = previous; }
  return Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(value) { Object.assign(this.data, value); }
  });
}

test('完成米米加入 → 返回首页 → 进入伙伴页，进度和底部按钮读取新状态', () => {
  memory[STORAGE_KEY] = createInitialState();
  navigation.length = 0;
  WELCOME_SESSIONS.forEach((session) => completeWelcomeSession(session.taskId, session.objectiveIdsToComplete || []));
  const pets = page('pets');
  pets.onShow();
  const initialLabel = pets.data.mimiActionLabel;
  assert.equal(pets.data.mimi.unlocked, false);
  assert.equal(pets.data.completedMilestones, 0);
  story.startChapter(CHAPTER_001.id);
  for (let index = 0; index < 40; index += 1) {
    const result = story.advanceStory();
    if (result.status === 'task_required') {
      cookie.startGame();
      ROUND_DEFINITIONS.forEach((round) => cookie.chooseImage(round.correctWordId));
      pets.onShow();
      assert.equal(pets.data.taskCompleted, true);
      assert.equal(pets.data.storyCompleted, false);
      assert.equal(pets.data.completedMilestones, 1);
    }
    if (result.status === 'chapter_completed') break;
  }
  assert.equal(loadState().gameState.companions.mimi.unlocked, true);
  // 页面尚未 onShow 时点击，也必须使用最新完成状态而不是旧的行动目标。
  pets.openStory();
  assert.deepEqual(navigation.at(-1), { kind: 'home', url: '/pages/home/home' });
  const home = page('home');
  home.onShow();
  home.openFriends();
  home.onHide();
  assert.equal(navigation.at(-1).url, '/pages/pets/pets');
  const beforeRefresh = loadState();
  pets.onShow();
  assert.deepEqual(loadState(), beforeRefresh, '伙伴页刷新只读，不另外维护进度存档');
  assert.equal(pets.data.mimi.unlocked, true);
  assert.equal(pets.data.storyCompleted, true);
  assert.equal(pets.data.taskCompleted, true);
  assert.equal(pets.data.completedMilestones, pets.data.totalMilestones);
  assert.equal(pets.data.stars, home.data.stars);
  assert.match(pets.data.storyStatus, /已完成/);
  assert.match(pets.data.taskStatus, /已完成/);
  assert.notEqual(pets.data.mimiActionLabel, initialLabel);
  assert.equal(pets.data.mimiActionLabel, '回树屋看看新发现');
  pets.openStory();
  assert.deepEqual(navigation.at(-1), { kind: 'home', url: '/pages/home/home' });
});
