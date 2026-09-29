// 视觉资源路径集中管理；替换正式插画时无需改动页面或游戏规则。
const TUANTUAN_VISUALS = Object.freeze({
  idle: Object.freeze({
    src: '/assets/characters/tuantuan/char_tuantuan_idle_front_v01.png',
    alt: '团团安静地陪你探索',
    fallbackText: '团团'
  }),
  happy: Object.freeze({
    src: '/assets/characters/tuantuan/char_tuantuan_happy_front_v01.png',
    alt: '团团开心地和你打招呼',
    fallbackText: '团团'
  }),
  thinking: Object.freeze({
    src: '/assets/characters/tuantuan/char_tuantuan_thinking_front_v01.png',
    alt: '团团正在思考线索',
    fallbackText: '团团'
  }),
  surprise: Object.freeze({
    src: '/assets/characters/tuantuan/char_tuantuan_surprise_front_v01.png',
    alt: '团团惊喜地发现线索',
    fallbackText: '团团'
  })
});

const MIMI_AVATAR = Object.freeze({
  src: '/assets/characters/mimi/char_mimi_avatar_front_v01.png',
  alt: '橘色小猫米米',
  fallbackText: '米米'
});

const TREEHOUSE_BACKGROUND = '/assets/scenes/treehouse/scene_treehouse_day_bg_v01.jpg';

// 未识别的状态回退到待机图，避免新增情绪导致空白角色位。
function getTuantuanVisual(state) {
  return TUANTUAN_VISUALS[state] || TUANTUAN_VISUALS.idle;
}

// 剧情的状态只决定显示哪张图，不写入或更改任何游戏进度。
function getStoryAvatar(speakerId, emotion) {
  if (speakerId === 'mimi') {
    return MIMI_AVATAR;
  }
  if (speakerId !== 'tuantuan') {
    return null;
  }
  const visualState = {
    curious: 'thinking',
    worried: 'thinking',
    happy: 'happy',
    excited: 'surprise'
  }[emotion] || 'idle';
  return getTuantuanVisual(visualState);
}

module.exports = {
  getTuantuanVisual,
  getStoryAvatar,
  TREEHOUSE_BACKGROUND
};

