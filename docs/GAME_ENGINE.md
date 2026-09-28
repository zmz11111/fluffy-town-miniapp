# 游戏基础引擎

Sprint 1.8 只建立剧情、奖励和状态之间的数据边界。`chapter_001`、`scene_001` 与奖励目录均为原创测试数据；没有正式剧情、小游戏、素材或奖励资格规则。

## 1. 模块关系

```text
story/chapters + story/scenes ──→ story/story-manager.js
                                         │ 当前场景、对白游标、任务触发
reward/catalog.js ────────────→ reward/reward-manager.js
                                         │ 星星、物品、家具、服装、成就
                                         ↓
                                game/state.js
                                         ↓
                                storage/local.js
```

页面只调用领域模块，不直接保存游戏数据。内容目录保存可发布的章节、场景和奖励定义；`gameState` 保存单个孩子在当前设备上的状态。两者不能混用。

## 2. 剧情数据系统

- `story/chapters/chapter_001.js` 定义测试章节的年级、课程、内容版本、场景顺序和来源。
- `story/scenes/scene_001.js` 定义测试场景、按顺序排列的角色对白、下一场景 ID 和任务触发条件。
- `story/story-manager.js` 提供查询章节/场景、开始章节、读取当前对白和推进对白的接口。查询返回副本，避免外部修改静态内容。
- 任务触发使用 `when: 'enter' | 'complete'` 和稳定 `taskId`。触发后仅把 ID 记入 `triggeredTaskIds`；它不代表任务已经完成，也不自动发放奖励。
- 当前测试章节只有一个场景。推进到末尾后章节状态变为 `completed`，`currentStory` 归空。未来新增章节可通过内容登记扩展，无需把对白写入页面。

正式内容须带稳定的课程/年级标识和版本。教材 PDF 只能作为经授权、抽取和人工审校的候选来源；对白还要遵守 [团团角色设计规范](GAME_DESIGN.md)。

## 3. 奖励系统

`reward/catalog.js` 目前各有一条 `star`、`item`、`furniture`、`clothing`、`achievement` 测试定义，没有对应美术资源。`reward/reward-manager.js` 只接受目录中已登记的奖励 ID，检查数据结构后通过游戏状态模块一次写入：

| 类型 | 写入位置 |
|---|---|
| `star` | `gameState.stars` |
| `item` | `gameState.inventory.itemIds` |
| `furniture` | `gameState.inventory.furnitureIds` |
| `clothing` | `gameState.inventory.clothingIds` |
| `achievement` | `gameState.rewards.achievementIds` |

每次应用均记录 `claimedRewardIds`；重复传入同一奖励 ID 不重复增加星星或物品。奖励管理器不判断孩子是否满足领取条件，正式使用时须由可信规则层决定，云端同步也应校验资格和数据归属。不得把页面按钮或客户端任意数值作为生产环境的奖励依据。

## 4. 状态系统与迁移

`game/model.js` 定义并校验 `playerLevel`、`stars`、`unlockedMapIds`、`chapterProgress`、`triggeredTaskIds`、`completedTaskIds`、`currentStory`、`inventory`、`rewards`。`game/state.js` 是游戏状态读写入口，剧情和奖励管理器通过它提交更新；`storage/local.js` 负责整份档案的校验与持久化。

本地档案版本为 `schemaVersion: 3`，键为 `fluffy-town:local:v3`。首次读取 v2 时保留等级、星星、地图、章节、任务以及学习/角色记录，补入剧情游标、背包和奖励记录；读取 v1 时保留原学习/角色记录并创建初始游戏状态。v1、v2 旧键暂不删除。读取接口返回副本，更新接口一次保存整份档案。

## 5. 后续扩展边界

- **多年级**：章节、场景、任务和奖励目标使用课程命名空间，避免跨年级 ID 冲突。
- **家长端**：只展示经授权的学习与游戏进度摘要，不直接改写奖励或对白游标。
- **教材内容**：词条和剧情引用已发布内容 ID；PDF 导入流程不修改儿童个人状态。
- **素材**：测试定义不引用外部资源；正式图片、音频和服装图稿须确认授权。
- **小游戏**：将来可使用同一状态和奖励接口，但本阶段没有小游戏实现。
