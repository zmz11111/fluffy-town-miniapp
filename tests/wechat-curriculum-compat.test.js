const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MINIPROGRAM_ROOT = path.join(PROJECT_ROOT, 'miniprogram');
const { DATA_FILE_MAP } = require('../scripts/sync-curriculum-runtime');

function collectJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectJavaScriptFiles(entryPath) : entry.name.endsWith('.js') ? [entryPath] : [];
  });
}

// 模拟小程序仅能解析 JavaScript 文件的 CommonJS 模块加载行为。
function loadWithWechatResolver(entryPath) {
  const cache = Object.create(null);

  function loadModule(modulePath) {
    if (cache[modulePath]) {
      return cache[modulePath].exports;
    }
    const module = { exports: {} };
    cache[modulePath] = module;
    const source = fs.readFileSync(modulePath, 'utf8');
    const localRequire = (request) => {
      if (!request.startsWith('.')) {
        throw new Error(`小程序兼容测试不支持外部模块：${request}`);
      }
      const requestedPath = path.resolve(path.dirname(modulePath), request);
      if (request.endsWith('.json')) {
        throw new Error(`小程序模块只能加载 .js 文件：${request}`);
      }
      const resolvedPath = request.endsWith('.js') ? requestedPath : `${requestedPath}.js`;
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`module '${request}.js' is not defined`);
      }
      return loadModule(resolvedPath);
    };
    vm.runInNewContext(source, {
      module,
      exports: module.exports,
      require: localRequire,
      __dirname: path.dirname(modulePath),
      __filename: modulePath
    }, { filename: modulePath });
    return module.exports;
  }

  return loadModule(entryPath);
}

test('小程序运行代码不直接 require JSON 文件', () => {
  const jsonRequirePattern = /require\s*\(\s*['"][^'"]+\.json['"]\s*\)/i;
  const offenders = collectJavaScriptFiles(MINIPROGRAM_ROOT)
    .filter((filePath) => jsonRequirePattern.test(fs.readFileSync(filePath, 'utf8')))
    .map((filePath) => path.relative(PROJECT_ROOT, filePath));
  assert.deepEqual(offenders, []);
});

test('运行时 JavaScript 数据与原始课程 JSON 完全一致', () => {
  DATA_FILE_MAP.forEach(([jsonPath, runtimePath]) => {
    const source = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, jsonPath), 'utf8'));
    const runtime = require(path.join(PROJECT_ROOT, runtimePath));
    assert.deepEqual(runtime, source, `${runtimePath} 应与 ${jsonPath} 保持一致`);
  });
});

test('Welcome 与 Unit 1 课程模块可由小程序 .js-only 加载器解析', () => {
  const curriculum = loadWithWechatResolver(path.join(MINIPROGRAM_ROOT, 'curriculum/curriculum-manager.js'));
  const welcomePreview = loadWithWechatResolver(path.join(MINIPROGRAM_ROOT, 'curriculum/welcome/preview-content.js'));
  const welcome = curriculum.getUnitKnowledgePackage('wj-g3-v1:welcome');
  const unit1 = curriculum.getUnitKnowledgePackage('wj-g3-v1:unit-1');

  assert.ok(welcome.vocabulary.length > 0);
  assert.ok(welcome.sentences.length > 0);
  assert.ok(unit1.vocabulary.length > 0);
  assert.ok(unit1.sentences.length > 0);
  assert.equal(welcomePreview.WELCOME_PREVIEW.chapterId, 'wj-g3-v1:welcome:chapter');
});
