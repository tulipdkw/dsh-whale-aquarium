# 维护与发布

## 本地开发循环

改 `lib/client.js` 之后，最快的验证路径是把它装进自己的 profile：

```sh
npm pack                                    # 打成 tarball（发布时会发出去的那批文件）
dsh plugin --profile web add file:$PWD/dsh-whale-aquarium-0.1.2.tgz
dsh web                                     # 必须重启 profile
# 不满意就撤
dsh plugin --profile web remove dsh-whale-aquarium
```

**必须重启，刷新页面不够。** 浏览器半的 URL 带一个 `rev` 查询参数，而 `rev` 是 bundle 源码的**内容哈希**，由宿主进程在启动时算好并把响应缓存起来。磁盘上的新文件要等宿主重启才会被读进去、算出新 rev、发给页面。

改默认值改 `lib/client.js` 里的 `DEFAULTS`。

## 测试

```sh
node test/smoke.mjs      # 或 npm test
```

无头测试，不需要浏览器、不需要安装依赖。它把 `lib/client.js` 放进 `node:vm`，捕获 `__ModuleLoader__` 注册，用桩 `require('react')` 和桩 Cordis ctx 实例化插件，然后拿记录型 2D context 真跑 24 帧。断言覆盖：

- 打包契约：bundle id == 包名、`exports["./client"]` 存在、`dsh.client.platform`、patch 层里插入了同名 row；
- 三个插槽都注册了；
- 侧边栏图标是官方标志的 SVG（不是 emoji）、viewBox 与 path 都对；
- 帧循环画了东西（fill 次数 == 鱼数 × 帧数、`bezierCurveTo` > 0）；
- 默认透明度下气泡描边 alpha ≥ 0.5（可见性回归）；
- 卸载后循环停止（`cleanup()` 之后不再请求新帧）。

写完断言记得**反向验证**：把被断言的实现改回旧写法，确认测试真的会失败。这个项目里两次修复（图标、气泡可见度）都是这么确认过的。

## 发版

1. 改 `package.json` 的 `version`（语义化版本）；
2. 在 `CHANGELOG.md` 顶部加一节；
3. `npm test`；
4. 提交并打 tag：

```sh
git add -A && git commit -m "release: v0.1.2"
git tag v0.1.2
git push origin main --tags
gh release create v0.1.2 --title "v0.1.2" --notes-file <(sed -n '/^## \[0.1.2\]/,/^## \[/p' CHANGELOG.md | head -n -1)
```

（没有 `gh` 就到 GitHub 网页版 Releases → Draft a new release，选 tag，正文从 `CHANGELOG.md` 复制。）

## GitHub 仓库设置

新建仓库时**不要**勾 "Add a README / .gitignore / license"（会和本地 commit 冲突）。推送后在仓库设置里填：

**Description**

```
🐳 给 DSH Web 界面养一缸鲸鱼：官方鲸鱼标志在界面之上游动，鼠标靠近会躲开。非官方插件。
```

**Topics**

```
dsh  deepseek-harness  cordis-plugin  whale  aquarium  wallpaper  web-ui  easter-egg
```

**About / Website**：留空或指向 README。

**仓库头像 / social preview**：建议**不要**单独用官方鲸鱼标志充当（见 README 的品牌指南说明），用 🐳 或自绘图形更稳。

**截图**：`docs/images/aquarium.png` 已被 README 引用（2560×1319、约 155 KB）。换图时保持同名即可，细节见 `docs/images/README.md`。截图里出现鲸鱼没问题——那是产品截图。

**注意（以后要发 npm 时）**：README 用的是相对路径 `docs/images/aquarium.png`，而 `docs/` 不在 `package.json` 的 `files` 白名单里，**npm 页面上这张图会裂**。要么把图片加进 `files`，要么把 README 里的路径换成 `https://raw.githubusercontent.com/tulipdkw/dsh-whale-aquarium/main/docs/images/aquarium.png`（GitHub 和 npm 两边都能显示）。

可选徽章（CI 通过后可以直接粘到 README 顶部）：

```markdown
[![test](https://github.com/tulipdkw/dsh-whale-aquarium/actions/workflows/test.yml/badge.svg)](https://github.com/tulipdkw/dsh-whale-aquarium/actions/workflows/test.yml)
```

## 分发方式

分发**只需要 GitHub**：`dsh plugin` 是 pnpm 的转发器，`github:` 与 `file:` 规格都能装，并按真实包名自动对齐 `dsh.profile.bundles`，所以不必发 npm。

### 以后想上 npm（可选）

```sh
npm login
npm publish --dry-run     # 先空跑，确认 tarball 内容
npm publish
```

注意：

- npm 的发布**近似不可逆**——`npm unpublish` 只在 72 小时内允许，且同一版本号可能再也发不回去。所以务必先 `--dry-run` + 上面那次 tarball 真装验证。
- 想用自己的 scope（`@你/dsh-whale-aquarium`）：首次发布要 `--access public`，或在 `package.json` 加 `"publishConfig": { "access": "public" }`；同时记得把 `lib/client.js` 里 `load({ id })` 的 id 一起改（必须等于包名，测试会拦住漏改）。
- 想在 npm 页面显示"由该仓库构建"，可以在 GitHub Actions 里用 `npm publish --provenance`（需要 `id-token: write` 权限）。

## CI

`.github/workflows/test.yml` 在 push 到 main 与 PR 时跑 `node test/smoke.mjs`。因为产物就是提交进仓库的 `lib/*.js`、没有构建步骤，CI 不需要任何 install 步骤。
