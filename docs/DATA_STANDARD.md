# 统一数据管理规范

本规范适用于 Sprint 2 及后续的角色、英语、剧情、游戏状态和家长端数据。当前第一章与听音找图已接入页面，仍只使用本地测试内容。

## 1. 数据归属与访问边界

| 数据 | 当前或规划的归属 | 页面使用方式 |
|---|---|---|
| 团团资料与互动 | `miniprogram/pets/`，现为 Sprint 1 历史目录 | 调用角色模块的读取/互动函数。 |
| 英语词条与学习记录 | `miniprogram/english/` | 调用英语模块的查询/记录函数。 |
| 剧情章节与场景 | `miniprogram/story/`，当前只有第一章 | 由剧情管理器读取内容，不在页面内写死对白。 |
| 奖励定义与领取 | `miniprogram/reward/` | 由奖励管理器登记领取，页面不直接更改星星或伙伴解锁。 |
| 游戏状态 | `miniprogram/game/` | 由游戏状态模块读取和更新，不在页面内改字段。 |
| 本地持久化 | `miniprogram/storage/local.js` | 只由业务模块调用；页面不直接使用 `wx.setStorageSync`。 |

页面负责展示、收集点击和调用模块，不直接修改词条、角色资料或存储对象。`loadState()` 返回副本，业务写入通过 `updateState()` 一次完成并校验整个档案。内容静态数据与儿童个人进度分开；家长端未来读取必要的进度摘要，不直接改写儿童答题事件。

## 2. 通用字段与版本规则

- 内容实体使用稳定字符串 `id`。地图、章节和任务 ID 应包含课程或内容包命名空间，跨年级不复用同一 ID 表示不同内容。
- 教材内容需标明 `grade`、`courseId`、`unitId`（适用时）、`contentVersion` 和 `source`；来源包含 PDF 标识、页码、版权/授权与人工审校状态。示例词的 `source.kind` 为 `original-sample`，不冒充真实教材。
- 时间字段使用 ISO 8601 UTC 字符串；本地设备时间不作为未来云端奖励的权威依据。
- 本地档案使用 `schemaVersion`。字段增删必须提供迁移路径，旧键保留到迁移结果被确认；不能因升级清空孩子已有记录。
- 对用户进度使用稳定事件或项目 ID 去重；绝不依赖页面顺序、数组下标或展示文案作为标识。

## 3. 宠物与陪伴伙伴数据

当前 `pets/pet.js` 中的团团资料字段为 `id`、`name`、`role`、`kind`、`introduction`，其中 `role: 'companion'` 明确团团是陪伴伙伴，不参与宠物喂养。互动上限与学习里程碑通过 `pets/affinity.js` 的好感变化接口记录；数值只留在程序状态中，儿童界面显示关系阶段与陪伴反馈，不展示分数。

米米静态资料在 `pets/mimi.js`，包含 `id`、`name`、`type`、`personality`、`role` 和初始 `friendship`、`storyProgress`；真实友谊和加入进度在 `gameState.companions.mimi`。团团的情绪与最近剧情场景也在 `companions`，对白池在 `pets/tuantuan-dialogues.js`。未来真正的可养成宠物应另建 `Pet` 与 `PetState`，避免把团团或米米误作宠物。图片和音频只能引用已授权资源。

## 4. 英语数据

当前 `EnglishWord` 字段：`id`、`grade`、`courseId`、`unitId`、`english`、`chinese`、`phonetic`、`phoneticAccent`、`pronunciationReviewStatus`、`audioSrc`、`imageSrc`、`source`。所有课程词卡统一展示音标，并通过 `english/pronunciation.js` 点按播放本地音频；缺少已授权录音时显示温和提示，不调用未经授权的第三方朗读服务。音标候选须标记人工审校状态，发布前核对教材规定的口音与标注。

六个示例词 `hello`、`hi`、`cat`、`dog`、`cookie`、`star` 独立存于 `english/words.js`，不绑定教材。正式教材词条还需内容版本、难度、审校状态和版权来源。未来 Unit 复用同一 `CurriculumWord` 字段与播放器，无需增加页面专用音频分支。

教学目标定义保存在课程内容和学习状态中，`objectiveProgressById` 仅供解锁与进度判断。不得将目标名称、目标描述或目标数量放进儿童单词卡、任务选项和鼓励对白；儿童端只显示正在进行的课程、分课进度和下一步提示。家长端可另行展示经设计的学习摘要。

当前 `LearningRecord` 字段：`id`、`wordId`、`courseId`、`grade`、`status`、`learnedAt`。记录通过稳定单词 ID 去重；课程进度保留在 `progress` 中。未来题目作答、复习次数或正确率须使用独立记录或明确的版本化扩展，不能把“我认识了”当作已经掌握的测验结论。默认不存储儿童原始语音。

PDF 导入流程只产生候选词条：抽取 → 标记来源页码 → 人工审校和授权确认 → 内容版本发布。导入脚本不得直接写入儿童学习记录。

## 5. 剧情数据（第一章试玩）

- `StoryChapter`：`id`、`grade`、`courseId`、`contentVersion`、`title`、`firstSceneId`、`sceneIds`、`source`。
- `StoryScene`：`id`、`chapterId`、`dialogues`、`nextSceneId`、`requiredTaskId`、`tuantuanEmotion`、`taskTriggers`。团团对白用 `dialogueKey` 引用对话池；其他对白包含 `speakerId` 和 `text`。
- 管理器只登记 `triggeredTaskIds`，小游戏完成后另写 `completedTaskIds`；第三幕的门槛只引用稳定任务 ID，不在页面模板中写资格规则。
- 剧情文本遵循 [团团角色设计规范](GAME_DESIGN.md)；教材 PDF 导入的文字在授权与人工审校后才能进入剧情内容。

## 6. 游戏状态

`gameState` 与学习记录并列存放在本地档案中，不作为内容库的一部分。结构定义在 `game/model.js`，读写入口在 `game/state.js`：

| 字段 | 类型 | 含义与默认值 |
|---|---|---|
| `playerLevel` | 正整数 | 玩家等级；默认 `1`。 |
| `stars` | 非负整数 | 星星数量；小游戏完成加 2，章节完成加 5，奖励 ID 去重。 |
| `unlockedMapIds` | 字符串数组 | 已解锁地图的稳定 ID；默认空数组。 |
| `chapterProgress` | 以章节 ID 为键的对象 | 每章保存 `status`、`currentNodeId`、`updatedAt`；默认空对象。 |
| `triggeredTaskIds` | 字符串数组 | 剧情已触发任务的稳定 ID；默认空数组，与完成任务分开。 |
| `completedTaskIds` | 字符串数组 | 已完成任务的稳定 ID；默认空数组。 |
| `currentStory` | 对象或 `null` | 当前章节、场景和对白位置；默认 `null`。 |
| `inventory` | 对象 | `itemIds`、`furnitureIds`、`clothingIds`；默认均为空数组。 |
| `rewards` | 对象 | `claimedRewardIds`、`achievementIds`；默认均为空数组。 |
| `currentGame` | 对象或 `null` | 小游戏 ID、回合、正确次数和尝试次数；支持关闭后继续。 |
| `companions` | 对象 | 团团情绪/最近场景与米米解锁/友谊/剧情进度。 |

状态模块提供统一读写入口；剧情和奖励管理器在其上完成结构化更新。它不判断关卡成绩或奖励资格；将来由独立规则层决定何时调用，云同步时按用户档案隔离并校验数据归属。五类奖励定义及写入位置详见 [游戏基础引擎](GAME_ENGINE.md)。

## 7. 本地档案与迁移

当前本地键为 `fluffy-town:local:v5`，根结构为 `schemaVersion: 5`、`progress`、`petState`、`learningRecords`、`gameState`、`learningState`。宠物状态可选保存每日互动日期与次数、好感变化值和最近变化原因；新增字段采用默认值补齐，不清除旧档案。首次读取 v1 至 v4 时迁移，保留既有学习、互动、星星等记录；旧键暂不删除。若写入失败，仍展示可读取的旧进度，并在后续写入时重试。迁移前后的学习记录数量与 ID 应保持一致。

未来家长端与云开发应通过业务接口获得经过授权的摘要，不能让页面或云函数直接假设本地键名、内部字段或未发布的剧情结构长期不变。
