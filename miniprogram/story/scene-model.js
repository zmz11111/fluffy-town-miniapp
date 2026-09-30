const { isValidContentId } = require('../game/model');
const { TREEHOUSE_BACKGROUND, getTuantuanVisual, getStoryAvatar } = require('../assets/visuals');

// 场景资源由稳定标识引用，角色和课程数据不持有用户存档。
const BACKGROUNDS = Object.freeze({
  'treehouse-day': Object.freeze({ src: TREEHOUSE_BACKGROUND, alt: '毛茸茸树屋' })
});
const EXPRESSIONS = ['idle', 'happy', 'thinking', 'surprise'];
const POSITIONS = ['left', 'center', 'right'];

function expressionFromEmotion(emotion) {
  return { curious: 'thinking', worried: 'thinking', happy: 'happy', excited: 'surprise' }[emotion] || 'idle';
}

// 旧场景在读取时适配到 v1，无须改动 Unit 1 或已有教材内容。
function normalizeScene(scene) {
  const normalized = JSON.parse(JSON.stringify(scene));
  if (normalized.sceneVersion !== undefined && normalized.sceneVersion !== 1) {
    throw new Error('剧情场景版本不支持');
  }
  if (normalized.sceneVersion === undefined) {
    const ids = Array.from(new Set((normalized.dialogues || []).map((line) => line.speakerId)))
      .filter((id) => id === 'tuantuan' || id === 'mimi');
    normalized.sceneVersion = 1;
    normalized.presentation = {
      backgroundId: 'treehouse-day',
      characters: ids.map((id, index) => ({
        characterId: id,
        position: ids.length === 1 ? 'center' : index === 0 ? 'left' : 'right',
        expression: id === 'tuantuan' ? expressionFromEmotion(normalized.tuantuanEmotion) : 'idle'
      }))
    };
  }
  validateScenePresentation(normalized);
  return normalized;
}

// 拒绝未登记的资源及重复角色位置，避免内容包导致空白或重叠。
function validateScenePresentation(scene) {
  const presentation = scene.presentation;
  if (scene.sceneVersion !== 1 || !isValidContentId(scene.id) || !isValidContentId(scene.chapterId) ||
      !presentation || !Object.prototype.hasOwnProperty.call(BACKGROUNDS, presentation.backgroundId) ||
      !Array.isArray(presentation.characters) || presentation.characters.length > 2 ||
      !presentation.characters.every((actor) => actor && ['tuantuan', 'mimi'].indexOf(actor.characterId) !== -1 &&
        POSITIONS.indexOf(actor.position) !== -1 && EXPRESSIONS.indexOf(actor.expression) !== -1) ||
      new Set(presentation.characters.map((actor) => actor.characterId)).size !== presentation.characters.length ||
      new Set(presentation.characters.map((actor) => actor.position)).size !== presentation.characters.length ||
      !Array.isArray(scene.dialogues) || !scene.dialogues.every((line) => line &&
        (line.expression === undefined || EXPRESSIONS.indexOf(line.expression) !== -1) &&
        (line.speakerId === 'narrator' || presentation.characters.some((actor) => actor.characterId === line.speakerId)))) {
    throw new Error('剧情场景表现数据无效');
  }
}

// 对白表情只控制画面；持久情绪由任务、剧情等状态事件管理。
function getScenePresentation(scene, dialogue) {
  const normalized = normalizeScene(scene);
  return {
    background: BACKGROUNDS[normalized.presentation.backgroundId],
    characters: normalized.presentation.characters.map((actor) => {
      const expression = dialogue && dialogue.speakerId === actor.characterId && dialogue.expression
        ? dialogue.expression : actor.expression;
      const visual = actor.characterId === 'tuantuan'
        ? getTuantuanVisual(expression) : getStoryAvatar(actor.characterId);
      return Object.assign({}, actor, visual, {
        expression,
        speaking: Boolean(dialogue && dialogue.speakerId === actor.characterId)
      });
    })
  };
}

module.exports = { normalizeScene, getScenePresentation };
