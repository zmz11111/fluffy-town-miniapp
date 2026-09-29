const { WORDS } = require('../../english/words');
const { getLearnedWordIds, markWordLearned } = require('../../english/learning');
const { getUnitKnowledgePackage } = require('../../curriculum/curriculum-manager');
const { WELCOME_UNIT_ID, UNIT1_UNIT_ID } = require('../../english/learning-state-model');
const { getLearningState } = require('../../english/learning-state');
const { interactWithTuantuan } = require('../../pets/interaction');
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
    knowledgeObjectives: [],
    welcomeMode: false,
    welcomeStatus: 'ready',
    welcomeTitle: '',
    welcomeStep: null,
    welcomeStepNumber: 0,
    welcomeTotalSteps: 0,
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
    this.unit1Mode = Boolean(options && options.mode === 'unit1-core');
    if (this.courseLibraryMode) {
      wx.setNavigationBarTitle({ title: '课程知识' });
    }
    if (this.welcomeMode) {
      wx.setNavigationBarTitle({ title: 'Welcome · 初次见面' });
      this.audio = wx.createInnerAudioContext();
      this.audio.onError(() => this.setData({ welcomeMessage: '声音暂时不能播放，可以看着问候卡继续。' }));
    }
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
    const welcomeCompleted = currentLearning.completedUnitIds.indexOf(WELCOME_UNIT_ID) !== -1;
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
        knowledgeObjectives: []
      });
      return;
    }
    this.selectedKnowledgeUnitId = selectedUnitId;
    this.setData({
      courseLibraryMode: true,
      knowledgeUnitId: selectedUnitId,
      knowledgeTitle: content.title,
      knowledgeTopic: content.topic,
      knowledgeReviewStatus: content.reviewStatus,
      unit1KnowledgeUnlocked: welcomeCompleted,
      knowledgeVocabulary: content.vocabulary,
      knowledgeSentences: content.sentences,
      knowledgeObjectives: content.objectives,
      isWelcomeKnowledge: selectedUnitId === WELCOME_UNIT_ID,
      isUnit1Knowledge: selectedUnitId === UNIT1_UNIT_ID
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
      const view = startWelcomeTask();
      this.setData({
        welcomeMode: true,
        welcomeStatus: view.status,
        welcomeTitle: view.title || '',
        welcomeStep: view.step || null,
        welcomeStepNumber: view.status === 'completed' ? view.totalSteps : view.stepIndex + 1,
        welcomeTotalSteps: view.totalSteps || 4,
        welcomeMessage: message || (view.status === 'completed' ? 'Welcome 已完成，我们回故事告诉团团吧。' : '每一步都可以慢慢来。'),
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
      if (!interaction.interactionAccepted && !interaction.dailyLimitReached) {
        this.setData({ welcomeMessage: '团团还在休息一小会儿，等一下再轻轻点它吧。' });
        this.releaseChoiceAfterDelay();
        return;
      }
      const result = completeWelcomeInteractionStep(interaction);
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
        learned: learnedIds.indexOf(word.id) !== -1
      })),
      completed: WORDS.filter((word) => learnedIds.indexOf(word.id) !== -1).length
    });
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
