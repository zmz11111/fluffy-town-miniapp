// 所有课程词卡共用本地授权音频播放器；缺少音频时明确提示，不调用外部服务。
function playVocabularyAudio(player, word) {
  if (!player || !word || !word.audioSrc) {
    return { played: false, message: '这张词卡的声音还在准备中，我们可以先看着读。' };
  }
  player.stop();
  player.src = word.audioSrc;
  player.play();
  return { played: true, message: '' };
}

module.exports = { playVocabularyAudio };
