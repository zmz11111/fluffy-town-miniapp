const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_FILE_MAP = Object.freeze([
  ['miniprogram/curriculum/welcome/unit-info.json', 'miniprogram/curriculum/welcome/unit-info.runtime.js'],
  ['miniprogram/curriculum/welcome/vocabulary.json', 'miniprogram/curriculum/welcome/vocabulary.runtime.js'],
  ['miniprogram/curriculum/welcome/sentences.json', 'miniprogram/curriculum/welcome/sentences.runtime.js'],
  ['miniprogram/curriculum/welcome/learning-objectives.json', 'miniprogram/curriculum/welcome/learning-objectives.runtime.js'],
  ['miniprogram/curriculum/welcome/daily-plan.json', 'miniprogram/curriculum/welcome/daily-plan.runtime.js'],
  ['miniprogram/curriculum/unit1/unit-info.json', 'miniprogram/curriculum/unit1/unit-info.runtime.js'],
  ['miniprogram/curriculum/unit1/vocabulary.json', 'miniprogram/curriculum/unit1/vocabulary.runtime.js'],
  ['miniprogram/curriculum/unit1/sentences.json', 'miniprogram/curriculum/unit1/sentences.runtime.js'],
  ['miniprogram/curriculum/unit1/learning-objectives.json', 'miniprogram/curriculum/unit1/learning-objectives.runtime.js']
]);

// 将原始 JSON 结构原样输出为小程序可加载的 JavaScript 模块。
function generateRuntimeModules() {
  DATA_FILE_MAP.forEach(([jsonPath, runtimePath]) => {
    const sourcePath = path.join(PROJECT_ROOT, jsonPath);
    const targetPath = path.join(PROJECT_ROOT, runtimePath);
    const value = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const output = `// 由 ${path.basename(jsonPath)} 同步生成，字段和值保持一致。\nmodule.exports = ${JSON.stringify(value, null, 2)};\n`;
    fs.writeFileSync(targetPath, output, 'utf8');
  });
}

if (require.main === module) {
  generateRuntimeModules();
}

module.exports = { DATA_FILE_MAP, generateRuntimeModules };
