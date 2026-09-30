# 游戏基础引擎

Sprint 2 将第一章五个原创场景接入页面，并加入听音找图小游戏。剧情与测试英语词独立于教材；图片为原创占位图，录音许可见[素材来源](素材来源.md)。

## 1. 模块关系

```text
story/chapters + story/scenes ──→ story/story-manager.js
                                         │ 当前场景、对白游标、任务触发
reward/catalog.js ────────────→ reward/reward-manager.js
                                         │ 星星、米米解锁及预留奖励类型
games/find-cookie ──────────────────────┤ 任务完成、小游戏星星
                                         ↓
                                game/state.js
                                         ↓
                                storage/local.js
```

页面只调用领域模块，不直接保存游戏数据。内容目录保存可发布的章节、场景和奖励定义；`gameState` 保存单个孩子在当前设备上的状态。两者不能混用。

## 2. 剧情数据系统

- `story/chapters/chapter_001.js` 定义测试章节的年级、课程、内容版本、场景顺序和来源。
- `story/scenes/scene_001.js` 至 `scene_005.js` 定义初次见面、饼干消失、寻找线索、找到饼干、米米加入五幕。
- `story/story-manager.js` 提供查询章节/场景、开始章节、读取当前对白和推进对白的接口。查询返回副本，避免外部修改静态内容。
- 任务触发使用 `when: 'enter' | 'complete'` 和稳定 `taskId`。触发后仅把 ID 记入 `triggeredTaskIds`；它不代表任务已经完成，也不自动发放奖励。
- 第三幕进入时触发 `find-cookie` 任务；完成三轮听音找图后才能进入第四幕。第五幕完成后章节状态变为 `completed`，`currentStory` 归空，并发放章节奖励。对白由管理器读取，页面不保存剧情数据。

正式内容须带稳定的课程/年级标识和版本。教材 PDF 只能作为经授权、抽取和人工审校的候选来源；对白还要遵守 [团团角色设计规范](GAME_DESIGN.md)。

## 3. 奖励系统

`reward/catalog.js` 定义小游戏 2 星、章节 5 星和米米解锁；另保留 `item`、`furniture`、`clothing`、`achievement` 测试条目。`reward/reward-manager.js` 只接受目录中已登记的奖励 ID：

| 类型 | 写入位置 |
|---|---|
| `star` | `gameState.stars` |
| `item` | `gameState.inventory.itemIds` |
| `furniture` | `gameState.inventory.furnitureIds` |
| `clothing` | `gameState.inventory.clothingIds` |
| `achievement` | `gameState.rewards.achievementIds` |
| `companion` | `gameState.companions.mimi` |

每次应用均记录 `claimedRewardIds`；重复传入同一奖励 ID 不重复增加星星或物品。奖励管理器不判断孩子是否满足领取条件，正式使用时须由可信规则层决定，云端同步也应校验资格和数据归属。不得把页面按钮或客户端任意数值作为生产环境的奖励依据。

## 4. 状态系统与迁移

`game/model.js` 定义并校验 `playerLevel`、`stars`、`unlockedMapIds`、`chapterProgress`、`triggeredTaskIds`、`completedTaskIds`、`currentStory`、`inventory`、`rewards`。`game/state.js` 是游戏状态读写入口，剧情和奖励管理器通过它提交更新；`storage/local.js` 负责整份档案的校验与持久化。

当前本地档案版本为 `schemaVersion: 5`，键为 `fluffy-town:local:v5`。同一档案包含 `gameState`、`learningState`、`petState` 与学习记录；读取 v1/v2/v3/v4 时迁移并保留学习与互动记录。v3 的旧单幕 `chapter_001` 进度不继承为新五幕内容。旧键暂不删除。读取接口返回副本，更新接口一次保存整份档案。

## 5. 后续扩展边界

- **多年级**：章节、场景、任务和奖励目标使用课程命名空间，避免跨年级 ID 冲突。
- **家长端**：只展示经授权的学习与游戏进度摘要，不直接改写奖励或对白游标。
- **教材内容**：词条和剧情引用已发布内容 ID；PDF 导入流程不修改儿童个人状态。
- **素材**：当前录音为 CC0，来源单独记录；正式图片、音频和服装图稿须确认授权。
- **小游戏**：`games/find-cookie` 只做第一章的三轮任务；新玩法继续通过规则模块提交状态和奖励。

## 6. Sprint 11-A 状态一致性修复

审计发现：Welcome 完成后没有保存团团情绪；首页固定展示待机图；听音找图和章节完成后，奖励在另一轮写入中发放，存储失败时可能只保存完成状态。本阶段修复这些写入与展示问题，未修改 Unit 1 内容、解锁门槛或任务规则。

| 状态事实 | 唯一来源 | 写入责任 | 读取方式 |
|---|---|---|---|
| 剧情完成 | `gameState.chapterProgress` | `story-manager` | 页面调用 `getGameState()` |
| 学习课程完成 | `learningState.unitProgressById`、`objectiveProgressById` | 学习状态模块 | 原有课程查询接口 |
| 伙伴是否加入 | `gameState.companions.mimi.unlocked` | 伙伴奖励 | 伙伴页从 `getCharacterOverview()` 派生 |
| 团团持久情绪 | `gameState.companions.tuantuan.emotion` | 剧情进入、有效互动、任务完成 | 首页和伙伴页读取此字段 |
| 星星总量 | `gameState.stars` | 已登记奖励 | 首页、剧情、学习、小游戏、伙伴页读取此状态 |
| 是否领过奖励 | `gameState.rewards.claimedRewardIds` | 奖励模块 | 奖励按 ID 去重 |

`petState.mood` 仅保留旧互动记录兼容，不是页面持久情绪的另一来源。剧情中的临时表情由场景定义，错误反馈中的思考表情不扣友谊、不改变已完成事实。

- `updateGameState()` 仍通过 `storage/local.updateState()` 保存整份档案；领域模块的第二个回调参数用于同步更新学习记录，页面不直接使用写入回调。
- `recordTaskCompletedInState()` 同步完成事实、当天学习日期和团团开心状态；重复完成不会再次改动情绪。
- Welcome 分课完成、目标好感变化及星星在一个保存操作中提交；存储失败时保留原任务步骤。
- 听音找图末轮的任务完成与奖励同时提交。
- 剧情末句的完成状态、学习章节记录、星星与米米解锁同时提交。失败后仍停留在末句，可以重试；已完成旧章节重进时，可按奖励 ID 补齐遗漏奖励。
- 页面每次 `onShow` 刷新本地状态，退出小程序后仍从同一档案恢复，不在页面另存星星或解锁标记。

Welcome 的两幕引导剧情结束，不代表七课教材单元结束。前者记在 `gameState.chapterProgress`；后者必须满足正式教学目标才记在 `learningState`。二者用途不同，不应互相替代。

## 7. 伙伴与星星的体验定位

团团是孩子的平等陪伴伙伴：帮助理解当前冒险目标、一起尝试英语、鼓励重试、分享完成后的发现。米米是侦探伙伴：提供故事观察视角和线索反馈。两者的问候应连接已有任务入口，不能通过打招呼绕过学习行为、奖励资格或每日限额。当前只说明定位并修复状态反馈，未增加伙伴技能或新任务。

星星代表共同完成冒险的成果。已落地：任务完成页展示奖励，首页与伙伴页读取同一星星总量。后续建议经审核后，将已领取奖励 ID 映射到现有树屋中的徽章亮起、伙伴庆祝表情或一条环境文案；这些表现从状态推导，不另存星星余额，不自动解锁课程，不因重入页面再次发奖。本阶段尚未实现树屋成长、星星消费或新的世界系统。

剧情场景 v1 的结构、资源降级和旧场景适配见 [STORY_SCENE_V1.md](STORY_SCENE_V1.md)。多年级与教材 PDF 导入继续引用稳定知识 ID，场景定义不写入儿童学习档案；未来家长端读取完成事实摘要，不以剧情是否结束推断孩子已掌握教材。
