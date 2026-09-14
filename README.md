# 🐋 dsh-whale-aquarium

给 **DeepSeek Harness** Web UI 的鲸鱼水族箱：一群 DSH 官方鲸鱼标志在你整个界面之上游动，鼠标靠近就躲开，点一下整群四散。

A whale aquarium for the DeepSeek Harness web UI: a school of the official DSH whale mark swimming over the whole frame, fleeing your cursor.

- 用的是**官方鲸鱼路径**（`FISH_LOGO_PATH`），并且用的是 DSH 自己在会话首屏用的那两套官方游动姿态（`HERO_SWIM_UP_PATH` / `HERO_SWIM_DOWN_PATH`）——摆尾是逐控制点插值，不是 CSS 变形糊出来的。
- 图层**完全穿透**：不挡点击、不挡输入、不影响任何快捷键。
- 跟随明暗主题自动换色，深色是浅蓝鲸群 + 一条金色锦鲤，浅色是深海蓝。
- 想在界面上留个开关：侧边栏底部有一个 🐋 按钮；细调在 设置 → Whale Aquarium。

## 安装

需要 DSH 0.1.2 以上的 `dsh` CLI。**装完要重启该 profile**（关掉再启动 `dsh web`），浏览器半才会进 boot graph。

### 从 npm

```sh
dsh plugin --profile web add dsh-whale-aquarium
```

### 直接从 GitHub（不需要先发 npm）

```sh
dsh plugin --profile web add github:<你的用户名>/<仓库名>
# 例如
dsh plugin --profile web add github:kevin/KeepWhales
```

两种方式都会把包装进 `$DSH_HOME/profiles/web`，并自动把该 bundle 追加到 profile 的 `dsh.profile.bundles` 层叠里（`dsh plugin` 是 pnpm 的转发器，安装后会按「已安装状态」重新对齐 bundles 列表）。

确认装上了：

```sh
dsh plugin --profile web why dsh-whale-aquarium
dsh --profile web --dump-config | grep -n whale-aquarium
```

### 卸载

```sh
dsh plugin --profile web remove dsh-whale-aquarium
```

## 使用

- **侧边栏底部 🐋**：一键开关。
- **设置 → Whale Aquarium**：数量 / 体型 / 游速 / 透明度 / 避险半径 / 气泡 / 混合模式 / 朝向翻转。
- **鼠标靠近**鲸鱼会加速躲开，**点一下画面**整群会四散。
- 设置存在浏览器 `localStorage`（`dsh-whale-aquarium/v1`），不写进 DSH 配置，也不会同步到别的浏览器。

## 它是怎么接进 DSH 的

一个包，两个面：

| 位置 | 作用 |
| --- | --- |
| `package.json` → `dsh.bundle.patch` | 声明这是 **Profile Bundle**：装完后 DSH 会把 `cordis.patch.yml` 当作一层 patch 叠到 profile 上 |
| `cordis.patch.yml` | 插入一行 Loader row：`id: whale-aquarium, name: dsh-whale-aquarium` |
| `lib/index.js` | **node 半**：空的 `apply()`，只为了让 Loader 有一个宿主侧 row 可挂 |
| `package.json` → `dsh.client` + `exports["./client"]` | 声明**浏览器半**：client modules 扫描到这个 row 的包后，把 `lib/client.js` 放进 `window.__DSH_BOOT__` 的 boot graph |
| `lib/client.js` | 浏览器半：以 `window.__ModuleLoader__.load({ id, factory })` 注册，`factory(require)` 返回一个 Cordis 插件 `{ name, inject, apply(ctx) }` |

它只往三个**增量插槽**里注册，不替换任何出厂 UI：

- `shell.overlay` — 整框浮层（在全部列之上、滚动容器之外、本身穿透点击），一个 `<canvas>` + 一个 rAF 循环；
- `sidebar.footer.action` — 侧边栏底部的 🐋 开关；
- `settings.section` — 设置面板里的一页。

所有副作用（canvas、监听器、样式）都在 `apply` 内创建、由 `ctx.slots` / `ctx.on` 的 disposer 持有，卸载即全部消失。

**没有构建步骤**：`lib/*.js` 就是产物，所以从 Git 安装不需要任何编译。

### 已知限制

- **浮在最上层，不是真正的"背景"**。DSH 目前没有"面板背后"的插槽；要画在面板下面只能替换 `root` 整个渲染树，那会顶掉出厂界面。所以鲸鱼是浮在界面之上的——默认 45% 透明度就是为此调的。
- 全屏 canvas + 每帧重画一群矢量鲸鱼，属于稳定但非零的开销。嫌吵就调低数量/透明度，或者用 `混合：开` 让它更融进背景。
- 只对 `web` profile 有意义（`dsh.client.platform = "web"`）。

## 开发

```sh
node test/smoke.mjs
```

这个测试把 `lib/client.js` 放进 `node:vm` 里跑：捕获 `__ModuleLoader__` 注册、用桩 `require('react')` 和桩 Cordis ctx 实例化插件、断言三个插槽都注册了，然后拿一个记录型 2D context 真的把 rAF 循环跑 24 帧（校验图形来自真实贝塞尔路径、清理后循环停止）。改完代码先跑它。

调默认值改 `lib/client.js` 里的 `DEFAULTS`。

### 发布（维护者）

```sh
git init && git add -A && git commit -m "dsh-whale-aquarium 0.1.0"
git remote add origin git@github.com:<你>/KeepWhales.git && git push -u origin main
npm publish --access public          # 可选；不发 npm 也能用 github: 安装
```

改了 `lib/` 之后记得升 `version` 再发。

## 版权与声明

- 鲸鱼标志路径取自 DeepSeek Harness 自带的客户端包（`@deepseek-ai/dsh-client-ui-primitives`、`@deepseek-ai/dsh-client-ui-conversation`，MIT）。标志本身是 DeepSeek 的品牌资产。
- 这是一个**非官方**的趣味插件，与 DeepSeek 无关联、未获其背书。
- 本项目代码以 MIT 发布，见 [LICENSE](LICENSE)。

---

## English

A DSH **Profile Bundle** that adds a whale aquarium to the web UI. Install, then restart the profile:

```sh
dsh plugin --profile web add dsh-whale-aquarium   # or: github:<you>/<repo>
```

It uses the official whale mark paths (including the two official swim poses DSH itself uses), registers only additive slots (`shell.overlay`, `sidebar.footer.action`, `settings.section`), stays fully click-through, follows the active color scheme, and needs no build step. Toggle it from the 🐋 button at the sidebar foot; tune it under Settings → Whale Aquarium. Settings live in `localStorage`. Uninstall with `dsh plugin --profile web remove dsh-whale-aquarium`.

Unofficial fan plugin, not affiliated with or endorsed by DeepSeek.
