const { getTuantuanVisual } = require('./visuals');

// 米米新表情只接入 Welcome；其他章节仍使用原有角色头像。
const MIMI_VISUALS = Object.freeze({
  idle: { src: '/assets/characters/mimi/char_mimi_avatar_front_v01.png', alt: '米米好奇地看着线索', fallbackText: '米米' },
  happy: { src: '/assets/characters/mimi/char_mimi_happy_front_v01.png', alt: '米米开心地分享发现', fallbackText: '米米' },
  thinking: { src: '/assets/characters/mimi/char_mimi_thinking_front_v01.png', alt: '米米正在观察线索', fallbackText: '米米' },
  surprise: { src: '/assets/characters/mimi/char_mimi_surprise_front_v01.png', alt: '米米惊喜地发现星星', fallbackText: '米米' }
});

function getMimiVisual(expression) {
  return Object.assign({}, MIMI_VISUALS[expression] || MIMI_VISUALS.idle);
}

// 仅计算表情资源，不访问存档，也不改变课程步骤、奖励或伙伴解锁。
function getWelcomeCharacterVisuals(kind, emotion, completed) {
  const expression = { curious: 'thinking', worried: 'thinking', excited: 'surprise' }[emotion] || emotion || 'thinking';
  const mimiExpression = completed ? 'surprise' : expression === 'happy' ? 'happy'
    : kind === 'listen-and-identify' && expression !== 'thinking' ? 'idle' : 'thinking';
  return { tuantuan: getTuantuanVisual(completed ? 'happy' : expression), mimi: getMimiVisual(mimiExpression) };
}

module.exports = { getMimiVisual, getWelcomeCharacterVisuals };
