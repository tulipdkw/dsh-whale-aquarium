# README 用的图

| 文件 | 用途 | 规格 |
| --- | --- | --- |
| `demo.webp` | README 首页演示（**动画**） | 720×467，100 帧 / 10 秒，约 0.57 MB |
| `aquarium.png` | 静态截图（Release 正文引用的是它的 raw 地址） | 2560×1319，Retina 2x，约 155 KB |

## 为什么是动画 WebP，不是 GIF 也不是 mp4

- **`<video>` 在 README 里没用**。GitHub 的 markdown 渲染器会把 `<video>` 标签 sanitize 掉——用官方 markdown API 验证过：`<video src=...>` 回来的是空 `<p>`，而 `<img>` 完整保留。
- **同一段 100 帧 / 10 秒的内容，两种格式差 7 倍**：动画 WebP（720×467，q≈82）**0.57 MB**，而 GIF（逐帧自适应 256 色）**4.58 MB**。因为 WebP 有帧间压缩，GIF 只能做调色板 + 有限增量编码。
- GitHub 对仓库内相对路径的图片生成的是普通 `<img src="docs/images/demo.webp">`，浏览器原生支持动画 WebP，所以会动。
- 若哪天 WebP 不生效（老浏览器 / 代理改写），把 `deliver/readme-fallback.gif`（4.58 MB 的 GIF 版）拷回本目录并改 README 一行即可。

## 这套素材是怎么做出来的（不需要 ffmpeg）

1. **抽帧**：AVFoundation 的 `AVAssetImageGenerator`，`setRequestedTimeToleranceBefore/After(kCMTimeZero)` **必须设**——不设容差它只返回最近的关键帧，100 次请求会拿到一堆重复帧（我第一次就踩了这个坑：100 帧里 89 帧与前帧完全相同）。
2. **合成**：Pillow。WebP 直接 `save(save_all=True, quality=82, method=6)`；GIF 要先 `quantize(colors=256)`。
3. **裁剪/转码**：`avconvert`（macOS 自带）或自写的 AVFoundation `AVAssetExportSession` 脚本。

## 换图注意

- **保持小体积**：首页图控制在 1 MB 以内。Retina 截图不必缩到 1x，但别把几 MB 的原图塞进来——`sips -Z 2560 aquarium.png` 可等比缩到宽 2560。
- **公开仓库**：截图和录屏都容易带上会话标题、工作区路径、侧边栏会话列表，发布前对着看一遍。
