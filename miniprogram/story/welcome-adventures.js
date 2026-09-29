// 每节 Welcome 都是一段陪团团完成的小冒险，剧情目标与奖励在课程数据外独立维护。
const WELCOME_ADVENTURES = Object.freeze({
  'welcome-session-01': Object.freeze({
    goal: '帮团团向米米打招呼，找回丢失的星星徽章。',
    openingDialogue: '糟了，我的星星徽章滚到书架后面了！米米也许看见了。我们先学会问候和介绍名字，再一起找它，好吗？',
    retryDialogue: '没关系，我们再听听、看看线索。我会陪你一起想。',
    successDialogue: '你发现线索啦！米米听见我们的英语问候，星星徽章正在发光。',
    companionPrompt: '现在我们一起向米米说 Hello！轻轻点一下团团，送出这句问候。',
    companionButtonLabel: '和团团一起说 Hello！',
    completionDialogue: '米米把星星徽章递回来啦！是我们一起用问候和名字找到的。',
    rewardId: 'wj-g3-v1:welcome:reward-session-01-star',
    rewardMessage: '你和团团找回了星星徽章，获得 1 颗星星！'
  }),
  'welcome-session-02': Object.freeze({
    goal: '陪团团说出自己的名字，听懂米米的提问。',
    openingDialogue: '米米问我叫什么名字，我有一点紧张。我们一起找到介绍自己的说法吧。',
    retryDialogue: '再看看句子里的名字线索，我在这里陪着你。',
    successDialogue: '对啦！你帮团团想起了怎样介绍自己。',
    companionPrompt: '把你找到的介绍方法告诉团团，再轻轻点一下给它勇气。',
    companionButtonLabel: '给团团一个勇气击掌',
    completionDialogue: '团团勇敢地介绍了自己！米米也告诉我们一条新的星星线索。',
    rewardId: 'wj-g3-v1:welcome:reward-session-02-star',
    rewardMessage: '团团和你收下一颗星星奖励！'
  }),
  'welcome-session-03': Object.freeze({
    goal: '陪团团向早晨遇见的新朋友问好。',
    openingDialogue: '早晨的树屋外有新朋友经过。团团想友好地打招呼，你来帮它挑一挑吧。',
    retryDialogue: '差一点点，再看一看早晨和问候的线索。',
    successDialogue: '早安问候送到了！新朋友笑着指了指星星亮起的方向。',
    companionPrompt: '和团团一起把早晨的问候送给新朋友吧。',
    companionButtonLabel: '陪团团打招呼',
    completionDialogue: '新朋友听懂啦！团团因为你的陪伴更有信心了。',
    rewardId: 'wj-g3-v1:welcome:reward-session-03-star',
    rewardMessage: '你和团团点亮了一颗星星，获得 1 颗星星！'
  }),
  'welcome-session-04': Object.freeze({
    goal: '帮团团选一句友好的告别，让朋友带着笑容回家。',
    openingDialogue: '朋友要回家了，团团想好好说再见。我们找找哪句话最合适。',
    retryDialogue: '我们再读一次中文提示，帮团团选出告别的话。',
    successDialogue: '朋友收到祝福啦！团团也记起了一点星星徽章的线索。',
    companionPrompt: '陪团团送上告别和祝福吧。',
    companionButtonLabel: '和团团挥手告别',
    completionDialogue: '朋友开心地挥手离开，团团又找到一条星星线索。',
    rewardId: 'wj-g3-v1:welcome:reward-session-04-star',
    rewardMessage: '友好的告别换来一颗星星奖励！'
  }),
  'welcome-session-05': Object.freeze({
    goal: '听懂团团的课堂指令，帮它找到下一条线索。',
    openingDialogue: '团团发现一张被风吹来的纸条，上面写着课堂指令。我们一起读懂它。',
    retryDialogue: '先看看中文意思，再找找对应的英文词句。',
    successDialogue: '指令听明白啦！纸条背后藏着新的星星线索。',
    companionPrompt: '团团想把指令再做一遍，你来陪它试试。',
    companionButtonLabel: '陪团团做一次指令',
    completionDialogue: '团团完成了指令！你们又收集到一条线索。',
    rewardId: 'wj-g3-v1:welcome:reward-session-05-star',
    rewardMessage: '完成课堂小挑战，获得 1 颗星星！'
  }),
  'welcome-session-06': Object.freeze({
    goal: '听懂站起、坐下和打开书本的指令，继续寻找星星。',
    openingDialogue: '团团找到一本合上的小书。我们听懂指令，看看里面有没有徽章的线索。',
    retryDialogue: '别着急，团团陪你再看一眼动作和词句。',
    successDialogue: '你听懂了！书页里闪出一颗小星星。',
    companionPrompt: '和团团一起做一个你记住的课堂动作吧。',
    companionButtonLabel: '和团团一起试试',
    completionDialogue: '书里出现了新的线索！团团谢谢你认真帮忙。',
    rewardId: 'wj-g3-v1:welcome:reward-session-06-star',
    rewardMessage: '你和团团找到书页线索，获得 1 颗星星！'
  }),
  'welcome-session-07': Object.freeze({
    goal: '帮团团认出大小写字母，拼好星星徽章上的字母边框。',
    openingDialogue: '星星徽章的边框由字母组成。团团想找出大小写字母朋友，你愿意帮忙吗？',
    retryDialogue: '大小写长得不一样，再仔细看看哪两个是字母朋友。',
    successDialogue: '字母朋友配对成功！徽章边框越来越亮啦。',
    companionPrompt: '最后和团团一起检查一下闪亮的字母边框吧。',
    companionButtonLabel: '和团团一起完成徽章',
    completionDialogue: '星星徽章完整地亮起来啦！Welcome 的小冒险我们一起完成了。',
    rewardId: 'wj-g3-v1:welcome:reward-session-07-star',
    rewardMessage: '你和团团拼好星星徽章，获得 1 颗星星！'
  })
});

module.exports = { WELCOME_ADVENTURES };
