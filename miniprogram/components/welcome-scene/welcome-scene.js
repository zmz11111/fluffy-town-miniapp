Component({
  properties: {
    sceneKey: { type: String, value: 'welcome' },
    backgroundSrc: String,
    tuantuanVisual: Object,
    mimiVisual: Object,
    showMimi: { type: Boolean, value: true },
    speaker: { type: String, value: '团团' },
    dialogue: String,
    celebrating: { type: Boolean, value: false }
  },
  data: { frames: [{ id: 'welcome' }], backgroundFailed: false, tuantuanFailed: false, mimiFailed: false },
  observers: {
    // 只在课次或场景改变时重建画面播放转场，同一步重听不反复淡入。
    sceneKey(key) { this.setData({ frames: [{ id: key || 'welcome' }] }); },
    backgroundSrc(src) {
      if (this.lastBackgroundSrc !== src) this.setData({ backgroundFailed: false });
      this.lastBackgroundSrc = src;
    },
    'tuantuanVisual.src'(src) {
      if (this.lastTuantuanSrc !== src) this.setData({ tuantuanFailed: false });
      this.lastTuantuanSrc = src;
    },
    'mimiVisual.src'(src) {
      if (this.lastMimiSrc !== src) this.setData({ mimiFailed: false });
      this.lastMimiSrc = src;
    }
  },
  methods: {
    // 缺图仅降级画面；组件不读取、更新存档，也不触发任务完成。
    onBackgroundError() { this.setData({ backgroundFailed: true }); },
    onTuantuanError() { this.setData({ tuantuanFailed: true }); },
    onMimiError() { this.setData({ mimiFailed: true }); }
  }
});
