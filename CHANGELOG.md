# Changelog

本项目的所有值得注意的变更都记在这里。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.2] — 2026-09-14 · 首个公开版本

### Fixed
- **气泡现在真的看得见。** 旧版在默认 45% 透明度下把气泡画成 1px 细线、alpha 只有 0.18–0.22，等于没有。现在气泡有独立的透明度下限（不再跟随鱼的透明度曲线线性减半），并改为「半透明填充 + 更亮的描边 + 高光」；生成频率 7/秒 → 9/秒，上限 34 → 40，半径上限 4.6px → 5.3px。

## [0.1.1] — 仅本地（未公开发布）

### Fixed
- **侧边栏图标改用官方鲸鱼标志本身**（内联 SVG + `currentColor`），不再用 emoji。`🐋`（U+1F40B）在 Apple 字体里是偏海豚的细长造型，正好造成这个按钮最该避免的误解。设置页标题同样改用标志。

## [0.1.0] — 仅本地（未公开发布）

### Added
- 首次发布：`shell.overlay` 上的一缸鲸鱼（官方标志路径 + 官方两套游动姿态的逐控制点插值摆尾）、鼠标避让、点击四散、气泡、跟随明暗主题换色。
- `sidebar.footer.action` 的一键开关，`settings.section` 的设置页（数量 / 体型 / 游速 / 透明度 / 避险半径 / 气泡 / 混合模式 / 朝向翻转），设置持久化到 `localStorage`。
- Profile Bundle 打包：`dsh.bundle.patch` + `dsh.client` 双面声明，`dsh plugin --profile web add` 一条命令可装；无构建步骤。
- 无头冒烟测试（`node test/smoke.mjs`）+ CI。
