const { loadState } = require('../storage/local');
const { updateGameState } = require('../game/state');

// 问候同时携带轻量行动方向，页面沿用现有课程与剧情入口执行。
const GREETING_POOLS = Object.freeze({
  tuantuan: Object.freeze({
    firstMeeting: Object.freeze([
      { id: 'tuantuan-first-01', text: '嗨，我叫团团！你也喜欢找亮晶晶的东西吗？我们从今天的小任务开始吧。', actionType: 'study', actionLabel: '去看看今天的任务' },
      { id: 'tuantuan-first-02', text: '你来啦！我把一张任务卡夹进书里了，要不要陪我翻翻看？', actionType: 'study', actionLabel: '和团团翻开任务卡' },
      { id: 'tuantuan-first-03', text: '你好呀，我有点好奇树屋外面有什么线索。我们一起去看看吧！', actionType: 'story', actionLabel: '陪团团探索树屋' },
      { id: 'tuantuan-first-04', text: '第一次见面我有一点紧张，不过有你在就好多啦。陪我完成第一张小挑战吧。', actionType: 'study', actionLabel: '陪团团做个小挑战' },
      { id: 'tuantuan-first-05', text: '欢迎来树屋！我准备了一个小挑战，说不定做完就会发现星星线索。', actionType: 'stars', actionLabel: '去找星星线索' }
    ]),
    ordinary: Object.freeze([
      { id: 'tuantuan-ordinary-01', text: '嘿，你来啦！我刚发现树屋窗边有个小记号，要一起看看吗？', actionType: 'story', actionLabel: '去看看新线索' },
      { id: 'tuantuan-ordinary-02', text: '我把今天的任务卡摆好了。你想先听一听，还是先找找看？', actionType: 'study', actionLabel: '打开今天的任务' },
      { id: 'tuantuan-ordinary-03', text: '你回来啦！我的探险笔记还空着一格，我们去填上新的发现吧。', actionType: 'story', actionLabel: '继续冒险笔记' },
      { id: 'tuantuan-ordinary-04', text: '我猜今天也会有有趣的事。要不要和我一起找找星星藏在哪？', actionType: 'stars', actionLabel: '寻找星星' },
      { id: 'tuantuan-ordinary-05', text: '刚好有一张卡片想请你帮忙。我们一起读读上面的英语吧！', actionType: 'study', actionLabel: '帮团团读卡片' }
    ]),
    continuousLearning: Object.freeze([
      { id: 'tuantuan-streak-01', text: '哇，我们连续两天一起学习啦！昨天的线索还记得吗？接着找找看吧。', actionType: 'study', actionLabel: '继续今天的学习' },
      { id: 'tuantuan-streak-02', text: '你又回来啦，我把昨天的发现收进小本子了。今天再添一颗星星吧！', actionType: 'stars', actionLabel: '去收集星星' },
      { id: 'tuantuan-streak-03', text: '我们的学习搭档连续上线！我准备好了，你想从哪张任务卡开始？', actionType: 'study', actionLabel: '选择一张任务卡' },
      { id: 'tuantuan-streak-04', text: '和你一起坚持真有意思。我的徽章亮了一点点，咱们去找下一条线索吧。', actionType: 'story', actionLabel: '寻找下一条线索' },
      { id: 'tuantuan-streak-05', text: '两天都一起动脑筋，我现在更有把握啦！今天也来完成一个小挑战吧。', actionType: 'study', actionLabel: '开始小挑战' }
    ]),
    taskCompleted: Object.freeze([
      { id: 'tuantuan-complete-01', text: '我看到任务卡亮起来啦！我们去看看这次发现了什么星星线索。', actionType: 'stars', actionLabel: '看看星星线索' },
      { id: 'tuantuan-complete-02', text: '刚才那个挑战完成啦！我想把新线索记进冒险本，一起去看看吧。', actionType: 'story', actionLabel: '查看冒险新线索' },
      { id: 'tuantuan-complete-03', text: '你帮我解开一个难题啦，我的脑袋都转快了！再去找一张任务卡吧。', actionType: 'study', actionLabel: '继续下一项任务' },
      { id: 'tuantuan-complete-04', text: '完成任务的感觉真棒！我们去收下这次的星星，再决定下一步。', actionType: 'stars', actionLabel: '去收下星星' },
      { id: 'tuantuan-complete-05', text: '这条线索是我们一起找到的！我想知道故事接下来会发生什么。', actionType: 'story', actionLabel: '继续探索故事' }
    ]),
    longAbsence: Object.freeze([
      { id: 'tuantuan-return-01', text: '好久不见！我一直把树屋的小灯留着。今天想从哪条线索重新开始？', actionType: 'story', actionLabel: '回到树屋冒险' },
      { id: 'tuantuan-return-02', text: '你回来啦，我的探险本都快积灰了。我们先做个轻松的小任务吧。', actionType: 'study', actionLabel: '做个轻松任务' },
      { id: 'tuantuan-return-03', text: '我有点想你了……才不是一直在等你呢。走吧，星星线索还没找完。', actionType: 'stars', actionLabel: '继续找星星' },
      { id: 'tuantuan-return-04', text: '树屋外又有新动静啦！不着急，我们一起慢慢看看发生了什么。', actionType: 'story', actionLabel: '看看树屋外的新发现' },
      { id: 'tuantuan-return-05', text: '欢迎回来！我们可以从一张小卡片开始，找回熟悉的冒险感觉。', actionType: 'study', actionLabel: '从小任务重新开始' }
    ])
  }),
  mimi: Object.freeze({
    firstMeeting: Object.freeze([
      { id: 'mimi-first-01', text: '你来啦？我是米米，负责看线索……才不是特意等你。要一起去看看吗？', actionType: 'story', actionLabel: '和米米查看线索' },
      { id: 'mimi-first-02', text: '嗯，我记得你。先帮我读读这张卡片，看看上面有没有线索。', actionType: 'study', actionLabel: '和米米读线索卡' },
      { id: 'mimi-first-03', text: '第一次正式打招呼？那我就带你看看我的侦探笔记吧。', actionType: 'story', actionLabel: '打开侦探笔记' },
      { id: 'mimi-first-04', text: '我找到一颗小星星，不过还缺一点证据。你来帮我想想办法。', actionType: 'stars', actionLabel: '帮米米找星星' },
      { id: 'mimi-first-05', text: '我才没有紧张呢。来吧，和我一起完成这张侦探任务卡。', actionType: 'study', actionLabel: '开始侦探小任务' }
    ]),
    ordinary: Object.freeze([
      { id: 'mimi-ordinary-01', text: '我刚发现一个新脚印。你来得正好，陪我去确认一下吧。', actionType: 'story', actionLabel: '确认新脚印' },
      { id: 'mimi-ordinary-02', text: '别以为我是在等你，我只是刚好有张卡片需要你读一下。', actionType: 'study', actionLabel: '帮米米读卡片' },
      { id: 'mimi-ordinary-03', text: '今天的线索藏得挺巧。要不要和我比比谁先发现星星？', actionType: 'stars', actionLabel: '寻找星星线索' },
      { id: 'mimi-ordinary-04', text: '侦探搭档，准备好了吗？下一段故事可能比上次更有意思。', actionType: 'story', actionLabel: '继续侦探故事' },
      { id: 'mimi-ordinary-05', text: '我整理了一张新任务卡。你负责读，我负责找出里面的线索。', actionType: 'study', actionLabel: '一起破解任务卡' }
    ]),
    continuousLearning: Object.freeze([
      { id: 'mimi-streak-01', text: '连续两天都来学习？看来你还挺有毅力的嘛。今天也一起找证据吧。', actionType: 'study', actionLabel: '继续今天的学习' },
      { id: 'mimi-streak-02', text: '昨天那条线索我还记得。你也记得的话，我们就能更快找到星星。', actionType: 'stars', actionLabel: '沿线索找星星' },
      { id: 'mimi-streak-03', text: '哼，连续学习的搭档还不错嘛。走吧，我有一张新卡片要检查。', actionType: 'study', actionLabel: '检查新任务卡' },
      { id: 'mimi-streak-04', text: '我们连续探索两天，笔记已经多了好几行。今天接着查下一幕吧。', actionType: 'story', actionLabel: '探索下一段故事' },
      { id: 'mimi-streak-05', text: '你这么认真，我也不能输。再完成一个小任务，看看会不会有新发现。', actionType: 'study', actionLabel: '挑战下一项任务' }
    ]),
    taskCompleted: Object.freeze([
      { id: 'mimi-complete-01', text: '任务完成的记录我看到了。做得不错嘛……我们去检查星星线索吧。', actionType: 'stars', actionLabel: '检查星星线索' },
      { id: 'mimi-complete-02', text: '证据又多了一条！我就知道你能帮上忙。继续去故事里找答案吧。', actionType: 'story', actionLabel: '去故事里找答案' },
      { id: 'mimi-complete-03', text: '这次任务你做得挺仔细。下一张卡片也交给我们侦探搭档吧。', actionType: 'study', actionLabel: '继续侦探任务' },
      { id: 'mimi-complete-04', text: '星星好像又亮了一颗？我先记下来，咱们去确认奖励。', actionType: 'stars', actionLabel: '确认星星收集' },
      { id: 'mimi-complete-05', text: '你完成了新挑战，我也找到故事里的下一条线索了。要一起看看吗？', actionType: 'story', actionLabel: '查看下一条故事线索' }
    ]),
    longAbsence: Object.freeze([
      { id: 'mimi-return-01', text: '这么久才来？我只是……有一点点担心线索没人看。回来就好。', actionType: 'story', actionLabel: '和米米继续调查' },
      { id: 'mimi-return-02', text: '我把侦探笔记收得好好的。先读一张卡，找回我们的调查节奏吧。', actionType: 'study', actionLabel: '从任务卡开始' },
      { id: 'mimi-return-03', text: '你终于回来啦！我发现新的星星方向了，这次可要跟紧我。', actionType: 'stars', actionLabel: '追踪星星方向' },
      { id: 'mimi-return-04', text: '案子还没结呢。别担心，我把上次的故事线索都留着。', actionType: 'story', actionLabel: '接着上次的调查' },
      { id: 'mimi-return-05', text: '欢迎回来，搭档。我给你准备了一道简单线索题，先热热身吧。', actionType: 'study', actionLabel: '做一道线索题' }
    ])
  })
});

const CONTEXTS = Object.freeze(['firstMeeting', 'ordinary', 'continuousLearning', 'taskCompleted', 'longAbsence']);
const LONG_ABSENCE_DAYS = 7;

// 日期格式兼容较旧的微信小程序运行环境。
function formatDatePart(value) {
  return value < 10 ? `0${value}` : String(value);
}

function getLocalDateKey(timestamp) {
  const date = new Date(timestamp);
  const month = formatDatePart(date.getMonth() + 1);
  const day = formatDatePart(date.getDate());
  return `${date.getFullYear()}-${month}-${day}`;
}

function getCalendarDayNumber(timestamp) {
  const date = new Date(timestamp);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

function getStudyStreak(studyDayKeys, timestamp) {
  const dayKeys = new Set(Array.isArray(studyDayKeys) ? studyDayKeys : []);
  const cursor = new Date(timestamp);
  const today = getLocalDateKey(cursor);
  if (!dayKeys.has(today)) {
    return 0;
  }
  let streak = 0;
  while (dayKeys.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getGreetingContext(characterId, state, timestamp) {
  const companion = state.gameState.companions[characterId];
  const previousGreeting = companion.lastGreetingAt || (characterId === 'mimi' ? companion.lastGreetedAt : state.petState.lastInteractedAt);
  if (!previousGreeting) {
    return { context: 'firstMeeting', pendingTaskIds: [] };
  }

  const daysSinceGreeting = getCalendarDayNumber(timestamp) - getCalendarDayNumber(previousGreeting);
  if (daysSinceGreeting >= LONG_ABSENCE_DAYS) {
    return { context: 'longAbsence', pendingTaskIds: [] };
  }

  const seenTaskIds = Array.isArray(companion.seenCompletedTaskIds) ? companion.seenCompletedTaskIds : [];
  const pendingTaskIds = state.gameState.completedTaskIds.filter((id) => seenTaskIds.indexOf(id) === -1);
  if (pendingTaskIds.length) {
    return { context: 'taskCompleted', pendingTaskIds };
  }

  if (getStudyStreak(state.gameState.studyDayKeys, timestamp) >= 2) {
    return { context: 'continuousLearning', pendingTaskIds: [] };
  }
  return { context: 'ordinary', pendingTaskIds: [] };
}

// 预览问候不消耗互动次数；只有实际互动被接受后才记录使用过的对白。
function getCompanionGreeting(characterId, timestamp) {
  if (!Object.prototype.hasOwnProperty.call(GREETING_POOLS, characterId)) {
    throw new Error('未知伙伴');
  }
  const now = Number.isFinite(timestamp) ? timestamp : Date.now();
  const state = loadState();
  const selection = getGreetingContext(characterId, state, now);
  const companion = state.gameState.companions[characterId];
  const history = companion.greetingHistoryByState || {};
  const usedIds = Array.isArray(history[selection.context]) ? history[selection.context] : [];
  const pool = GREETING_POOLS[characterId][selection.context];
  const available = pool.filter((line) => usedIds.indexOf(line.id) === -1);
  const choices = available.length ? available : pool;
  const line = choices[Math.floor(Math.random() * choices.length)];
  return Object.assign({}, line, selection, { characterId, context: selection.context });
}

// 保存对白轮换游标并标记已被伙伴庆祝的任务，防止每次访问都重复同一句。
function recordCompanionGreeting(greeting, timestamp) {
  if (!greeting || !Object.prototype.hasOwnProperty.call(GREETING_POOLS, greeting.characterId) ||
      CONTEXTS.indexOf(greeting.context) === -1) {
    throw new Error('伙伴问候记录无效');
  }
  const lineExists = GREETING_POOLS[greeting.characterId][greeting.context]
    .some((line) => line.id === greeting.id);
  if (!lineExists) {
    throw new Error('伙伴问候内容不存在');
  }
  const now = Number.isFinite(timestamp) ? timestamp : Date.now();
  const nowIso = new Date(now).toISOString();
  return updateGameState((draft) => {
    const companion = draft.companions[greeting.characterId];
    const history = companion.greetingHistoryByState || {};
    const usedIds = Array.isArray(history[greeting.context]) ? history[greeting.context].slice() : [];
    if (usedIds.indexOf(greeting.id) === -1) {
      usedIds.push(greeting.id);
    }
    companion.greetingHistoryByState = Object.assign({}, history, { [greeting.context]: usedIds });
    companion.lastGreetingAt = nowIso;
    const seenTaskIds = Array.isArray(companion.seenCompletedTaskIds) ? companion.seenCompletedTaskIds.slice() : [];
    draft.completedTaskIds.forEach((taskId) => {
      if (seenTaskIds.indexOf(taskId) === -1) {
        seenTaskIds.push(taskId);
      }
    });
    companion.seenCompletedTaskIds = seenTaskIds;
  });
}

module.exports = {
  GREETING_POOLS,
  getCompanionGreeting,
  recordCompanionGreeting,
  getStudyStreak
};
