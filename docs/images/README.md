# README 用的图

| 文件 | 用途 | 规格 |
| --- | --- | --- |
| `demo.gif` | README 首页演示（**动图**） | 720×467，100 帧 / 10 秒，约 0.5 MB |
| `aquarium.png` | 静态截图（Release 正文里引用的是它的 raw 地址） | 2560×1319，Retina 2x，约 155 KB |

## 为什么首页用 GIF 而不是 mp4

GitHub 的 markdown 渲染器**会把 `<video>` 标签删掉**（我用官方 markdown API 验证过：`<video>` 变成空段落，`<img>` 保留）。所以在 README 里内嵌动图只能走 GIF。

## 换图注意

- **保持小体积**：README 图控制在 1 MB 以内。Retina 截图不需要缩到 1x，但也别把几 MB 的原图塞进来——`sips -Z 2560 aquarium.png` 可等比缩到宽 2560。
- **公开仓库**：截图和录屏都容易带上会话标题、工作区路径、侧边栏会话列表，发布前对着看一遍。
- GIF 是"抽帧 + Pillow 合成"出来的：先用 AVFoundation 按 10fps 抽 100 帧（JPEG），再用 `Image.quantize` + `save(save_all=True)` 合成，全程不需要 ffmpeg。
