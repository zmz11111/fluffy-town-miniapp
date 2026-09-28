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

本地档案版本为 `schemaVersion: 4`，键为 `fluffy-town:local:v4`。新增 `currentGame` 和 `companions`；读取 v1/v2/v3 时迁移并保留学习与互动记录。v3 的旧单幕 `chapter_001` 进度不继承为新五幕内容。旧键暂不删除。读取接口返回副本，更新接口一次保存整份档案。

## 5. 后续扩展边界

- **多年级**：章节、场景、任务和奖励目标使用课程命名空间，避免跨年级 ID 冲突。
- **家长端**：只展示经授权的学习与游戏进度摘要，不直接改写奖励或对白游标。
- **教材内容**：词条和剧情引用已发布内容 ID；PDF 导入流程不修改儿童个人状态。
- **素材**：当前录音为 CC0，来源单独记录；正式图片、音频和服装图稿须确认授权。
- **小游戏**：`games/find-cookie` 只做第一章的三轮任务；新玩法继续通过规则模块提交状态和奖励。
