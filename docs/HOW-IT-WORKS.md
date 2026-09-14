# 它是怎么接进 DSH 的

给想改代码或照着写自己插件的人。使用者只需要看 [README](../README.md)。

## 一个包，两个面

DSH 的插件可以同时提供**宿主半**和**浏览器半**，本项目两边都用到：

| 位置 | 作用 |
| --- | --- |
| `package.json` → `dsh.bundle.patch` | 声明这是 **Profile Bundle**。`dsh plugin --profile web add <包>` 装完后，DSH 会把这个包追加到 profile 的 `dsh.profile.bundles` 层叠里，并应用它带的 patch 文件 |
| `cordis.patch.yml` | 该 bundle 的 patch 层：插入一行 Loader row（`id: whale-aquarium`、`name: dsh-whale-aquarium`） |
| `lib/index.js` | **宿主半**：空的 `apply()`。存在的唯一理由是让 Loader 有个宿主侧 row 可挂；浏览器半走 `exports["./client"]` |
| `package.json` → `dsh.client` + `exports["./client"]` | 声明**浏览器半**。client modules 扫描到这一行的包后，读取 `dsh.client`（`platform: "web"`、`inject`），把 `lib/client.js` 放进 `window.__DSH_BOOT__` 的 boot graph |
| `lib/client.js` | 浏览器半本体：`window.__ModuleLoader__.load({ id, factory })` 注册，`factory(require)` 返回一个 Cordis 插件 `{ name, inject, apply(ctx) }` |

### 三条硬约束

1. **bundle id 必须等于包名。** client modules 用包 id 索引 factory，`factory` 里 `load({ id })` 的 `id` 与 `package.json` 的 `name` 不一致就会加载失败。
2. **浏览器半只能 `require()` 平台 seed 词**：`react`、`react/jsx-runtime`、`react-dom`、`react-dom/client`、`@deepseek-ai/cordis`、`@deepseek-ai/dsh-client-store`、`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-ui-primitives`，外加 boot graph 里其他 client 包（需要用 `dsh.client.external` 声明依赖顺序）。本项目只用了 `react`。
3. **`dsh.client.inject` 里的未知包名会被忽略**，不会让 boot 失败；它在运行时的作用是「让被注入的包先到达，再加载消费者」。

这三条都写进了 `test/smoke.mjs` 的断言，改名或结构写错会在 CI 上直接报错。

## 注册了哪三个插槽

全部是**增量**插槽（新 id，不占用出厂 id），所以永远不会顶掉出厂 UI：

| 插槽 | 用途 |
| --- | --- |
| `shell.overlay` | 整框浮层：在全部列之上、滚动容器之外、本身穿透点击。这里放 `<canvas>` + 一个 rAF 循环 |
| `sidebar.footer.action` | 侧边栏底部的一键开关（owner 会传 `wide` 表示侧边栏是展开还是 56px 轨道） |
| `settings.section` | 设置面板里的一页（`id` + `order` + `label`） |

所有副作用（canvas、`pointermove`/`pointerdown` 监听、注入的 `<style>`）都在 `apply` 内创建，由 `ctx.slots` / `ctx.on` 的 disposer 持有——卸载插件时全部自动消失，不需要手写清理逻辑去猜。

## 为什么是浮在最上层

DSH 目前**没有"面板背后"的插槽**。界面根节点（`root` 插槽）是整个渲染树的唯一入口，而它已经被出厂 shell 占着；要画在面板底下只能替换它，那等于顶掉整个界面。

所以唯一的合法位置就是 `shell.overlay`——它在界面**之上**。默认 45% 透明度、默认 10 条鱼就是为这个位置调的：读起来像"隔着玻璃看鱼"，而不是"有人在我文档上画鱼"。想更融入可以开 `混合模式`（深色用 `screen`、浅色用 `multiply`）。

## 鲸鱼图形从哪来

不是自己画的，是 DSH 官方标志：

- `FISH_LOGO_PATH` — 静止姿态，定义在 `@deepseek-ai/dsh-client-ui-primitives`（`FISH_LOGO_VIEWBOX` = `0 0 23.16 17.0435`）；
- `HERO_SWIM_UP_PATH` / `HERO_SWIM_DOWN_PATH` — 会话首屏那只 hover 时会"游"的鲸鱼用的两套姿态，定义在 `@deepseek-ai/dsh-client-ui-conversation`。

三套路径的 SVG 命令结构**完全一致**（80 段，同一串 `M`/`C`/`L`/`Z`），所以摆尾可以做成**逐控制点线性插值**：`k = sin(phase)`，`k > 0` 就往 `UP` 插、`k < 0` 往 `DOWN` 插。这不是 CSS 旋转出来的假动作，而是把官方那两帧动作连续化。

每条鱼另有深度（决定大小与透明度）、巡游相位、避让恐慌值；转角有最大角速度限制、恐慌时提速并放大摆尾幅度，所以逃起来有"发力"的感觉。

## 性能

每帧：N 条鱼 × 75 段贝塞尔 + 描边气泡。默认 10 条时约 750 段/帧，canvas2d 毫无压力；上限 40 条也在预算内。

- 画布按 `devicePixelRatio` 缩放，尺寸检查节流到 250ms 一次；
- 鱼按深度排序，让近处压住远处；
- 浏览器标签页隐藏时 rAF 自动停摆，不做额外处理。

## 已知限制

- 只对 `web` profile 有效（`dsh.client.platform = "web"`）。
- 设置存 `localStorage`，不写 DSH 配置、不跨浏览器同步。
- 没有把标志做成可替换主题（比如换成自绘鲸鱼）——想要就得改 `P` 三个常量。
