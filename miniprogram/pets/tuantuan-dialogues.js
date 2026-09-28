// 团团对白按剧情情境集中管理，保持温暖、平等和共同发现的语气。
const TUANTUAN_DIALOGUES = Object.freeze({
  firstMeeting: { text: 'Hi！我是团团。米米，我们一起看看吧？', emotion: 'curious' },
  missingCookie: { text: '星星饼干不见了？别着急，我们一起找线索。', emotion: 'worried' },
  clueSearch: { text: '我念一个英语词，你找找对应的图片，好吗？', emotion: 'curious' },
  foundCookie: { text: '找到了！原来它躲在小篮子后面。', emotion: 'happy' },
  welcomeMimi: { text: '当然！米米，欢迎和我们一起冒险。', emotion: 'excited' }
});

// 返回副本，避免场景或页面修改对白池。
function getTuantuanDialogue(dialogueKey) {
  const line = Object.prototype.hasOwnProperty.call(TUANTUAN_DIALOGUES, dialogueKey)
    ? TUANTUAN_DIALOGUES[dialogueKey] : null;
  return line ? { text: line.text, emotion: line.emotion } : null;
}

module.exports = { getTuantuanDialogue };
