# Alpha Demo 视觉资源占位规范（Sprint 4-B）

本目录中的新增图片是项目自绘的**几何占位图**，用于接通页面与可替换资源路径，不是角色正式原画。现有 `audio/` 与 `pictures/` 保持原样；资源来源详见 [素材来源](../../docs/素材来源.md)。

| 资源 | 当前文件 | 用途与状态 |
|---|---|---|
| 团团待机 | `characters/tuantuan/char_tuantuan_idle_front_v01.png` | 首页默认形象、未知状态回退 |
| 团团开心 | `characters/tuantuan/char_tuantuan_happy_front_v01.png` | 首页点击反馈、快乐剧情表情 |
| 团团思考 | `characters/tuantuan/char_tuantuan_thinking_front_v01.png` | 剧情中的好奇或轻微担心 |
| 团团惊喜 | `characters/tuantuan/char_tuantuan_surprise_front_v01.png` | 剧情中发现新线索的兴奋 |
| 米米头像 | `characters/mimi/char_mimi_avatar_front_v01.png` | 米米说话时的剧情头像 |
| 树屋背景 | `scenes/treehouse/scene_treehouse_day_bg_v01.jpg` | 首页与第一章背景展示 |
| UI 目录 | `ui/` | 预留按钮图标、奖励图标；本阶段不替换现有 UI |

路径统一由 `visuals.js` 提供，页面不自行拼接文件名。图片加载失败时首页保留原有几何角色与树屋，剧情页显示角色文字和场景文字；缺图不能阻断互动或剧情。角色状态接口接受 `idle`、`happy`、`thinking`、`surprise`，未知状态回退 `idle`。第一章的团团情绪只做展示映射，不改故事状态。

## 替换正式素材

1. 先确认作品为项目原创或已获得明确的小程序使用权，登记创作者、授权、修改记录和审核人。教材 PDF 的插图不得自动作为游戏素材。
2. 团团四张图使用统一的 512 × 512 透明 PNG 画布、地面基线、头身比例与角色位置；米米头像也是 512 × 512 透明 PNG。树屋背景建议 1500 × 900 JPEG，主要物件放在中央安全区。可依照 [视觉设计系统](../../docs/VISUAL_DESIGN.md) 准备更高分辨率母稿，但不要把母稿放进小程序包。
3. 保留现有文件名覆盖对应占位图，页面无需改动。若采用新版本名，只更新 `visuals.js` 的路径，再逐页检查加载与裁切。不要从页面文件逐个改路径。
4. 在小屏与真机检查首页点击后的表情、剧情头像、图片加载失败回退、文字对比度和包体积。角色图片不得把英文词或题目答案烘焙进图里，避免未来多教材、多年级内容更换时重画。

后续家长端可复用角色或背景资源，但应使用独立页面布局和明确的数据权限；本阶段没有家长端页面或新增玩法。

