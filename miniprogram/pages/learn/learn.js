const { WORDS } = require('../../english/words');
const { getLearnedWordIds, markWordLearned } = require('../../english/learning');
const { getUnitKnowledgePackage } = require('../../curriculum/curriculum-manager');
const { WELCOME_UNIT_ID, UNIT1_UNIT_ID } = require('../../english/learning-state-model');
const { getLearningState, isWelcomeCompleted } = require('../../english/learning-state');
const { getWelcomeProgress, selectWelcomeLetter } = require('../../english/welcome-learning');
const { playVocabularyAudio } = require('../../english/pronunciation');
const { interactWithTuantuan, getDailyInteractionStatus } = require('../../pets/interaction');
const { getTuantuanFeedback } = require('../../pets/companion-feedback');
const {
  startLearningTask,
  chooseIntroduction
} = require('../../english/unit1-learning');
const {
  startTask: startWelcomeTask,
  chooseStep: chooseWelcomeStep,
  completeInteractionStep: completeWelcomeInteractionStep
} = require('../../english/welcome-learning');

Page({
  data: {
    courseLibraryMode: false,
    knowledgeUnitId: '',
    knowledgeTitle: '',
    knowledgeTopic: '',
    knowledgeReviewStatus: '',
    knowledgeVocabulary: [],
    knowledgeSentences: [],
    knowledgeReleaseHint: '',
    knowledgeVocabularyCount: 0,
    knowledgeSentenceCount: 0,
    pronunciationMessage: '',
    welcomeMode: false,
    welcomeStatus: 'ready',
    welcomeTitle: '',
    welcomeStep: null,
    welcomeStepNumber: 0,
    welcomeTotalSteps: 0,
    welcomeSessionNumber: 0,
    welcomeTotalSessions: 0,
    welcomeCompletedSessions: 0,
    interactionsRemaining: 5,
    maxDailyInteractions: 5,
    interactionRecoveryHint: '互动次数每天零点恢复。',
    welcomeMessage: '',
    choiceBusy: false,
    unit1Mode: false,
    unit1Status: 'ready',
    unit1Title: '',
    unit1Keyword: null,
    unit1Prompt: '',
    unit1Support: '',
    unit1Options: [],
    unit1Message: '',
    words: [],
    completed: 0,
    total: WORDS.length
  },

  onLoad(options) {
    this.courseLibraryMode = Boolean(options && options.mode === 'course-library');
    this.welcomeMode = Boolean(options && options.mode === 'welcome');
    // 课程入口携带当前课次；若入口过期，学习模块仍以存档中的下一节为准。
    this.requestedWelcomeTaskId = options && options.taskId ? options.taskId : null;
    this.unit1Mode = Boolean(options && options.mode === 'unit1-core');
    if (this.courseLibraryMode) {
      wx.setNavigationBarTitle({ title: '课程知识' });
    }
    if (this.welcomeMode) wx.setNavigationBarTitle({ title: 'Welcome · 初次见面' });
    this.audio = wx.createInnerAudioContext();
    this.audio.onError(() => {
      const message = '声音暂时不能播放，可以看着词卡继续。';
      this.setData(this.courseLibraryMode ? { pronunciationMessage: message } : { welcomeMessage: message });
    });
    if (this.unit1Mode) {
      wx.setNavigationBarTitle({ title: '团团的介绍卡' });
    }
  },

  // Unit 1 任务与原有测试词卡共用学习页面，但进度分别由各自模块管理。
  onShow() {
    this.clearChoiceTimer();
    this.choiceBusy = false;
    if (this.courseLibraryMode) {
      this.refreshCourseLibrary();
      return;
    }
    if (this.welcomeMode) {
      this.refreshWelcomeTask();
      return;
    }
    if (this.unit1Mode) {
      this.refreshUnit1Task();
      return;
    }
    this.refreshWords();
  },

  // 课程知识展示只读 Welcome 或 Unit 1 知识包，不生成或完成每日任务。
  refreshCourseLibrary(unitId) {
    const currentLearning = getLearningState();
    const welcomeCompleted = isWelcomeCompleted();
    const requestedUnitId = unitId || this.selectedKnowledgeUnitId || currentLearning.currentUnitId || WELCOME_UNIT_ID;
    const selectedUnitId = requestedUnitId === UNIT1_UNIT_ID && !welcomeCompleted ? WELCOME_UNIT_ID : requestedUnitId;
    const content = getUnitKnowledgePackage(selectedUnitId);
    if (!content) {
      this.setData({
        courseLibraryMode: true,
        knowledgeUnitId: WELCOME_UNIT_ID,
        knowledgeReviewStatus: 'unavailable',
        knowledgeVocabulary: [],
        knowledgeSentences: [],
      });
      return;
    }
    const welcomeProgress = getWelcomeProgress();
    const isWelcomeKnowledge = selectedUnitId === WELCOME_UNIT_ID;
    const vocabulary = isWelcomeKnowledge
      ? content.vocabulary.filter((entry) => welcomeProgress.releasedVocabularyIds.indexOf(entry.id) !== -1)
      : content.vocabulary;
    const sentences = isWelcomeKnowledge
      ? content.sentences.filter((entry) => welcomeProgress.releasedSentenceIds.indexOf(entry.id) !== -1)
      : content.sentences;
    this.selectedKnowledgeUnitId = selectedUnitId;
    this.setData({
      courseLibraryMode: true,
      knowledgeUnitId: selectedUnitId,
      knowledgeTitle: content.title,
      knowledgeTopic: content.topic,
      knowledgeReviewStatus: content.reviewStatus,
      unit1KnowledgeUnlocked: welcomeCompleted,
      knowledgeVocabulary: vocabulary,
      knowledgeSentences: sentences,
      knowledgeVocabularyCount: vocabulary.length,
      knowledgeSentenceCount: sentences.length,
      knowledgeReleaseHint: isWelcomeKnowledge
        ? `Welcome 全部课程内容会随学习逐步开放；当前可查看第 ${welcomeProgress.currentSessionIndex} / ${welcomeProgress.totalSessions} 节。`
        : '本单元内容已开放，今天的学习任务会单独安排。',
      isWelcomeKnowledge,
      isUnit1Knowledge: selectedUnitId === UNIT1_UNIT_ID,
      pronunciationMessage: ''
    });
  },

  selectKnowledgeUnit(event) {
    const unitId = event.currentTarget.dataset.unitId;
    if (unitId === WELCOME_UNIT_ID || unitId === UNIT1_UNIT_ID) {
      this.refreshCourseLibrary(unitId);
    }
  },

  // Welcome 使用与现有故事任务相同的学习状态入口，离开后恢复到已保存步骤。
  refreshWelcomeTask(message) {
    try {
      const view = startWelcomeTask(this.requestedWelcomeTaskId);
      const interactionStatus = getDailyInteractionStatus();
      this.setData({
        welcomeMode: true,
        welcomeStatus: view.status,
        welcomeTitle: view.title || '',
        welcomeStep: view.step || null,
        welcomeStepNumber: view.status === 'completed' ? view.totalSteps : view.stepIndex + 1,
        welcomeTotalSteps: view.totalSteps || 0,
        welcomeSessionNumber: view.sessionIndex || view.welcomeProgress && view.welcomeProgress.currentSessionIndex || 0,
        welcomeTotalSessions: view.totalSessions || 7,
        welcomeCompletedSessions: view.completedSessions || 0,
        welcomeMessage: message || (view.status === 'completed' ? 'Welcome 已完成，我们回故事告诉团团吧。' : '每一步都可以慢慢来。'),
        interactionsRemaining: interactionStatus.remainingDailyInteractions,
        maxDailyInteractions: interactionStatus.maxDailyInteractions,
        interactionRecoveryHint: interactionStatus.recoveryHint,
        choiceBusy: this.choiceBusy
      });
    } catch (error) {
      this.setData({ welcomeMode: true, welcomeStatus: 'locked', welcomeMessage: '先回故事里和团团开始 Welcome 吧。' });
    }
  },

  refreshUnit1Task() {
    try {
      const view = startLearningTask();
      this.setData({
        unit1Mode: true,
        choiceBusy: this.choiceBusy,
        unit1Status: view.status,
        unit1Title: view.title || '',
        unit1Keyword: view.keyword || null,
        unit1Prompt: view.prompt || '',
        unit1Support: view.support || '',
        unit1Options: view.options || [],
        unit1Message: view.status === 'completed' ? '这张介绍卡已经放好啦。' : '团团陪你一起看看。'
      });
    } catch (error) {
      this.setData({ unit1Mode: true, unit1Status: 'locked', unit1Message: '先回故事里看看团团的介绍卡吧。' });
    }
  },

  chooseIntroduction(event) {
    if (this.choiceBusy) {
      return;
    }
    this.choiceBusy = true;
    this.setData({ choiceBusy: true });
    try {
      const result = chooseIntroduction(event.currentTarget.dataset.optionId);
      if (result.completed) {
        this.setData({ unit1Status: 'completed', unit1Message: result.message });
        this.returnTimer = setTimeout(() => this.backToStory(), 700);
        return;
      }
      this.setData({ unit1Message: result.message });
      this.releaseChoiceAfterDelay();
    } catch (error) {
      this.setData({ unit1Message: '介绍卡暂时没有选上，再试一次吧。' });
      this.releaseChoiceAfterDelay();
    }
  },

  // 问候和人物介绍只提交稳定选项 ID，连点保护由页面状态与任务管理器共同处理。
  chooseWelcomeOption(event) {
    if (this.choiceBusy) {
      return;
    }
    this.choiceBusy = true;
    this.setData({ choiceBusy: true });
    try {
      const result = chooseWelcomeStep(event.currentTarget.dataset.optionId);
      if (result.audioSrc && this.audio) {
        this.audio.stop();
        this.audio.src = result.audioSrc;
        this.audio.play();
      }
      if (!result.correct) {
        this.setData({ welcomeMessage: result.message });
        this.releaseChoiceAfterDelay();
        return;
      }
      if (result.completed) {
        this.setData({ welcomeStatus: 'completed', welcomeStep: null, welcomeMessage: result.message });
        this.returnTimer = setTimeout(() => this.backToStory(), 700);
        return;
      }
      this.refreshWelcomeTask(result.message);
      this.releaseChoiceAfterDelay();
    } catch (error) {
      this.setData({ welcomeMessage: '这一步暂时没有保存好，再试一次吧。' });
      this.releaseChoiceAfterDelay();
    }
  },

  // Welcome 的听力题由孩子主动重播，避免页面自动播放造成打扰。
  playWelcomeAudio() {
    const step = this.data.welcomeStep;
    if (!step || !step.audioSrc || !this.audio) {
      return;
    }
    this.audio.stop();
    this.audio.src = step.audioSrc;
    this.audio.play();
  },

  // Welcome 伙伴互动调用统一每日限额，再由学习模块记录当前任务步骤。
  interactForWelcome() {
    if (this.choiceBusy) {
      return;
    }
    this.choiceBusy = true;
    this.setData({ choiceBusy: true });
    try {
      const interaction = interactWithTuantuan();
      const feedback = getTuantuanFeedback(interaction);
      if (!interaction.interactionAccepted && !interaction.dailyLimitReached) {
        this.setData({
          welcomeMessage: feedback.message,
          interactionsRemaining: feedback.remaining,
          maxDailyInteractions: feedback.maximum,
          interactionRecoveryHint: feedback.recoveryHint
        });
        this.releaseChoiceAfterDelay();
        return;
      }
      const result = completeWelcomeInteractionStep(interaction);
      this.setData({
        interactionsRemaining: feedback.remaining,
        maxDailyInteractions: feedback.maximum,
        interactionRecoveryHint: feedback.recoveryHint
      });
      if (result.completed) {
        this.setData({ welcomeStatus: 'completed', welcomeStep: null, welcomeMessage: result.message });
        this.returnTimer = setTimeout(() => this.backToStory(), 700);
        return;
      }
      this.setData({ welcomeMessage: result.message });
      this.releaseChoiceAfterDelay();
    } catch (error) {
      this.setData({ welcomeMessage: '团团暂时没有回应，我们稍后再试一次。' });
      this.releaseChoiceAfterDelay();
    }
  },

  // 根据本地记录计算按钮状态，避免页面内另存一份进度。
  refreshWords() {
    const learnedIds = getLearnedWordIds();
    this.setData({
      words: WORDS.map((word) => ({
        id: word.id,
        english: word.english,
        chinese: word.chinese,
        phonetic: word.phonetic,
        phoneticAccent: word.phoneticAccent,
        audioSrc: word.audioSrc,
        learned: learnedIds.indexOf(word.id) !== -1
      })),
      completed: WORDS.filter((word) => learnedIds.indexOf(word.id) !== -1).length
    });
  },

  // 单词卡共用本地音频接口；所有课程只需提供同一词条字段即可播放。
  playVocabularyAudio(event) {
    const wordId = event.currentTarget.dataset.wordId;
    const vocabulary = (this.data.knowledgeVocabulary || []).concat(this.data.words || [],
      this.data.welcomeStep && this.data.welcomeStep.vocabulary || []
    );
    const word = vocabulary.find((entry) => entry.id === wordId);
    const result = playVocabularyAudio(this.audio, word);
    const update = { pronunciationMessage: result.message };
    if (!this.courseLibraryMode) {
      update.welcomeMessage = result.message || '团团陪你一起听一听。';
    }
    this.setData(update);
  },

  // 字母识别由 Welcome 进度模块持久化，离开页面后仍保留已找到的字母。
  tapWelcomeLetter(event) {
    try {
      const result = selectWelcomeLetter(event.currentTarget.dataset.letter);
      if (result.sessionCompleted) {
        this.setData({ welcomeStatus: 'completed', welcomeStep: null, welcomeMessage: result.message });
        this.returnTimer = setTimeout(() => this.backToStory(), 700);
        return;
      }
      this.refreshWelcomeTask(result.message);
    } catch (error) {
      this.setData({ welcomeMessage: '这张字母卡暂时没有记下，再点一次试试。' });
    }
  },

  // 点击“我认识了”写入一条去重的学习记录。
  markLearned(event) {
    try {
      markWordLearned(event.currentTarget.dataset.wordId);
      this.refreshWords();
      wx.showToast({ title: '已经记下啦', icon: 'none' });
    } catch (error) {
      wx.showToast({ title: '学习记录暂时无法保存', icon: 'none' });
    }
  },

  onUnload() {
    this.clearChoiceTimer();
    if (this.returnTimer) {
      clearTimeout(this.returnTimer);
      this.returnTimer = null;
    }
    if (this.audio) {
      this.audio.destroy();
      this.audio = null;
    }
  },

  backToStory() {
    wx.navigateBack({ delta: 1 });
  },

  // 选择后短暂保留按钮锁，防止重复提交同时允许孩子轻松重试。
  releaseChoiceAfterDelay() {
    this.clearChoiceTimer();
    this.choiceTimer = setTimeout(() => {
      this.choiceBusy = false;
      this.setData({ choiceBusy: false });
      this.choiceTimer = null;
    }, 300);
  },

  clearChoiceTimer() {
    if (this.choiceTimer) {
      clearTimeout(this.choiceTimer);
      this.choiceTimer = null;
    }
  },

  // 返回首页后首页的 onShow 会更新任务进度。
  backHome() {
    wx.navigateBack({ delta: 1 });
  }
});
