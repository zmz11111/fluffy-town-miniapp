# 教材知识库基础（Sprint 3）

本阶段新增 `miniprogram/curriculum/`，建立可查询、可校验的教材内容目录和连接接口。示例是**项目原创模拟教材**“小学三年级英语（模拟）·上册·Unit 1”，不对应任何出版社、课程标准版本或真实教材 PDF。本阶段不解析 PDF，不自动生成剧情，也不修改现有第一章、游戏状态、奖励或伙伴代码。

## 1. 目录与职责

| 目录或文件 | 内容 |
|---|---|
| `schema/models.js` | 教材、单元、词条、句型的数据契约与难度范围。 |
| `schema/validate.js` | 检查字段、唯一 ID、教材与单元的引用关系。 |
| `textbooks/` | 教材版本、年级、册别、内容版本与来源状态。 |
| `units/` | 单元序号、主题、难度及词条/句型清单。 |
| `vocabulary/` | 单词、释义、难度和已授权的音画资源引用。 |
| `sentences/` | 句型、中文含义、难度及关联词条。 |
| `curriculum-manager.js` | 统一只读查询与面向剧情、小游戏、学习、奖励的内容草案接口。 |

内容 ID 使用教材命名空间，例如 `demo-g3-v1:unit-1:hello`；它与 Sprint 2 的 `word-hello` 是两个独立内容项。`contentVersion` 标识发布内容版本，`grade` 和 `volume` 标识适用年级与册别。难度为 1～5 的内容编写等级，**不是孩子的能力分数**。

## 2. 示例 Unit 1

| 字段 | 示例值 |
|---|---|
| 教材 | `demo-g3-v1`，小学三年级英语（模拟），项目原创示例版 |
| 年级/册别 | 三年级 / 上册 |
| 单元/主题 | Unit 1 / 认识新朋友 |
| 单词 | `hello`、`hi`、`cat`、`dog`、`name` |
| 句型 | `Hello!`、`My name is ...` |
| 内容来源 | `original-demo`，仅供演示，未作为正式教材发布 |

`hello`、`hi`、`cat`、`dog` 复用项目已有的测试录音；猫和狗复用项目原创占位图。[音频许可和素材来源](素材来源.md)已记录。`name` 目前没有音频或图片，字段为 `null`，不能生成听音题。新增真实教材或素材前必须核实授权、页码与人工审校状态。

## 3. 数据流程

```text
模拟教材/单元/单词/句型定义
        ↓ 结构及引用校验
curriculum-manager（只读查询、返回副本）
        ├─→ 学习词条视图
        ├─→ 剧情任务草案（含 taskTriggers）
        ├─→ 小游戏题包草案
        └─→ 奖励任务草案
                   ↓ 后续人工审核、登记、玩法适配
             现有剧情 / 学习 / 小游戏 / 奖励模块
```

目录只保存静态内容，**不读取或写入** `storage/local.js`、`game/state.js` 或儿童学习记录。所有公开查询返回副本，页面或后续调用方不能通过对象引用改写教材。管理器加载内容时检查 ID 唯一性、单元归属和句型词条引用；这只是基础结构检查，正式发布还需检查资源文件、内容正确性与授权。

## 4. 连接接口

| 接口 | 返回内容 | 后续接入位置 |
|---|---|---|
| `listTextbooks()`、`getTextbook(id)`、`listUnits(textbookId)`、`getUnit(id)` | 教材和单元资料 | 教材选择、章节规划；未来家长端可读取必要摘要。 |
| `listVocabulary(unitId)`、`listSentences(unitId)`、`getVocabulary(id)`、`getSentence(id)` | 单元知识点 | 内容审校与学习展示。 |
| `getLearningWords(unitId)` | 具有现有 `EnglishWord` 常用字段的词条视图，另含难度 | 后续学习模块按教材单元读取；本阶段不替换 `english/words.js`。 |
| `buildStoryTask(unitId, wordId)` | 含稳定任务 ID、建议提示和 `taskTriggers` 的草案 | 后续经人工编写场景对白后，剧情内容可引用该任务 ID。 |
| `buildMiniGameQuestion(unitId, wordId)` | 含音频、文本选项、正确词 ID 的听音选词题包草案 | 后续小游戏规则层读取并隐藏正确答案；不能直接交给页面，也不适用于当前“听音找图片”界面。 |
| `buildRewardTask(unitId, wordId)` | “首次学习该词”条件及一颗星奖励定义草案 | 后续审核并登记到奖励目录，再由规则层判断资格和发放。 |

例如对 `demo-g3-v1:unit-1:hello` 调用三个 `build...` 接口，会分别得到探索 `hello` 的剧情任务、以现有 `hello.wav` 为音频的三选一文本题，以及首次学习 `hello` 的奖励任务草案。所有草案均标记 `status: 'draft'`：**当前故事不会自动出现该任务，小游戏不会自动加载该题，奖励也不会自动发放。**现有奖励管理器只接受目录中登记过的奖励 ID，不能把草案 ID 直接传入领取函数。

这层接口是连接边界，不是完整集成。下一阶段如需启用，应在各系统增加明确的内容适配与发布审核，并保留 Sprint 2 的原有测试内容与存档。`name` 缺少已授权音频时，听音题接口会明确拒绝生成。

## 5. 后续扩展与发布要求

1. **多教材与多年级**：每本教材有独立 `textbookId`、版本、年级和册别；教材切换不根据英文拼写自动合并孩子的学习记录。
2. **多单元与多章节**：教材清单引用单元，单元引用知识点；剧情章节另行引用已审核的单元与任务 ID，避免把教材结构写进页面。
3. **PDF 导入**：未来按“确认使用权 → 抽取候选内容和页码 → 人工校对 → 核实音画许可 → 校验引用 → 发布内容版本”执行。PDF 原件和未审校文字不进入运行时内容目录。
4. **家长端**：未来可展示教材来源、适用范围和学习摘要；教材选择与数据处理需要清晰的家长授权流程。
5. **小游戏扩展**：题包与玩法分离；同一教材词条可供不同玩法使用，但各玩法须先检查所需音频、图片和交互资源是否齐全。

## 6. 审核时可检查的调用示例

```js
const curriculum = require('../curriculum/curriculum-manager');

// 查询模拟 Unit 1，再为 hello 生成三个只读草案。
const unitId = 'demo-g3-v1:unit-1';
const wordId = 'demo-g3-v1:unit-1:hello';
const words = curriculum.getLearningWords(unitId);
const storyTask = curriculum.buildStoryTask(unitId, wordId);
const question = curriculum.buildMiniGameQuestion(unitId, wordId);
const rewardTask = curriculum.buildRewardTask(unitId, wordId);
```

上例仅展示接口形状；不需要改动现有页面或存档即可读取教材内容。启用任务、题目与奖励仍需后续 Sprint 的人工审核和系统适配。
