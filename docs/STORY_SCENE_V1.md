# 剧情场景数据结构 v1

Sprint 11-A 在现有 `story/scenes` 中增加场景表现定义。背景、角色、对白与表情由内容数据描述；`story-manager` 保持原有任务门槛和对白游标。Welcome 两幕接入现有图片；其他场景通过读取适配，不修改 Unit 1 数据。

## 1. 数据示例

```js
// 内容 ID 保持课程命名空间，资源标识只引用已登记素材。
{
  sceneVersion: 1,
  id: 'wj-g3-v1:welcome:scene-goodbye',
  chapterId: 'wj-g3-v1:welcome:chapter',
  title: '星星徽章回来了',
  presentation: {
    backgroundId: 'treehouse-day',
    characters: [
      { characterId: 'tuantuan', position: 'left', expression: 'happy' },
      { characterId: 'mimi', position: 'right', expression: 'happy' }
    ]
  },
  dialogues: [
    { speakerId: 'tuantuan', text: '我们一起找到星星啦！', expression: 'surprise' },
    { speakerId: 'mimi', text: '下次也带上我，好吗？' }
  ],
  tuantuanEmotion: 'happy',
  taskTriggers: [],
  requiredTaskId: null,
  nextSceneId: null
}
```

本例仅说明字段，不新增正式对白。现有 `dialogueKey` 对话池引用继续支持，与 `text` 二选一；旁白使用 `speakerId: 'narrator'`。

## 2. 字段与边界

| 字段 | 约束与含义 |
|---|---|
| `sceneVersion` | 当前为 1；与儿童存档版本独立 |
| `id`、`chapterId` | 原有稳定 ID 和章节归属 |
| `presentation.backgroundId` | 当前只登记 `treehouse-day`，由资源注册表解析路径与替代文字 |
| `presentation.characters` | 当前最多两个已存在伙伴；角色 ID 和位置分别不能重复 |
| `characterId` | 当前只支持 `tuantuan`、`mimi`；在场不代表已解锁 |
| `position` | `left`、`center`、`right` |
| `expression` | `idle`、`happy`、`thinking`、`surprise` |
| `dialogues` | 原有对白数组；可用每句 `expression` 覆盖说话角色的场景默认表情 |
| `tuantuanEmotion` | 原有持久情绪：`curious`、`worried`、`happy`、`excited` |
| `taskTriggers`、`requiredTaskId`、`nextSceneId` | 保持原有触发、任务门槛与转场规则 |

当前米米只使用已有头像资源，四种表情标识均回退到此头像。团团使用已有四态图片。角色的场景表情、持久情绪与伙伴是否加入是不同事实：Welcome 可以与米米见面，但不会因此跳过原有伙伴解锁奖励。

## 3. 读取与展示

`scene-model.normalizeScene()` 返回内容副本并校验资源标识、角色、位置和表情。无版本的旧场景按对白里的角色自动补齐树屋背景和站位；明确标注 v1 的场景必须填写合法表现数据，不接受未知版本。

`story-manager.getCurrentStory()` 返回当前场景、对白以及解析好的 `presentation`。剧情页显示背景、场景角色、说话提示与原对白卡片。替换资源只修改已有资源注册位置，不修改个人进度。图片加载失败时保留背景占位和角色姓名，仍可完成原学习任务。

## 4. 扩展约束

- 教材 PDF、年级、Unit 与知识点由课程内容 ID 关联，场景只引用经审核内容，不解析 PDF 或推测掌握程度。
- 增加角色、背景或复杂动画须先审核素材授权与表现范围；本版不创建地图、动画引擎或新伙伴。
- 奖励只由任务和剧情业务模块发放，背景或表情不会触发奖励。
- 未来家长端从学习与游戏状态读取事实，场景表现不成为完成证据。

## 5. 验证范围

自动化检查覆盖旧场景适配、非法表现数据拒绝、已引用图片存在以及剧情页读取场景表现。图片裁切、真机布局和儿童对场景的理解仍需要微信开发者工具与后续试玩验收。
