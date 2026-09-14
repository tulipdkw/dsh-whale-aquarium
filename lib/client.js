/**
 * dsh-whale-aquarium — browser half.
 *
 * Bundle protocol (this is the whole contract):
 *   - the file is loaded as a classic script and registers itself with
 *     `window.__ModuleLoader__.load({ id, factory })`, where `id` is this
 *     package's name — the client module system keys factories by package id and
 *     resolves `require()` against them;
 *   - `factory(require)` returns the Cordis plugin for the browser fiber, i.e.
 *     `{ name, inject, apply(ctx) }`;
 *   - every side effect (canvas, listeners, styles) is created inside `apply`
 *     and owned by a `ctx.slots` / `ctx.on` disposer, so unloading the package
 *     removes all of it.
 *
 * The only module specifiers a bundle may `require()` are the platform seed words
 * (`react`, `react/jsx-runtime`, `react-dom`, `react-dom/client`,
 * `@deepseek-ai/cordis`, `@deepseek-ai/dsh-client-store`,
 * `@deepseek-ai/dsh-client-ui-slots`, `@deepseek-ai/dsh-client-ui-primitives`)
 * plus other client package rows in the boot graph. This plugin needs React and
 * nothing else.
 *
 * There is no build step: this file is the shipped artifact.
 */
window.__ModuleLoader__.load({
	id: 'dsh-whale-aquarium',
	factory: (require) => {
		const React = require('react')

		/* ─────────────────────────── the whale mark ───────────────────────────
		 * The three official paths of the DeepSeek whale mark: at rest (`mid`) and
		 * the two swim poses DSH itself uses for the conversation hero fish. All
		 * three have identical command structure, so the swim pose is a per-control-
		 * point interpolation between them — real tail-beat, not a transform trick.
		 * Taken from @deepseek-ai/dsh-client-ui-primitives (FISH_LOGO_PATH,
		 * FISH_LOGO_VIEWBOX) and @deepseek-ai/dsh-client-ui-conversation
		 * (HERO_SWIM_UP_PATH, HERO_SWIM_DOWN_PATH).
		 */
		const WHALE_W = 23.16
		const WHALE_H = 17.0435

		const P_MID = "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z"
		const P_UP = "M22.403 0.567C22.145 0.477 22.068 0.718 21.939 0.85C21.895 0.893 21.86 0.947 21.824 0.997C21.515 1.421 21.13 1.721 20.591 1.77C19.829 1.867 19.221 2.244 18.712 2.958C18.535 2.227 18.116 1.839 17.516 1.626C17.203 1.506 16.887 1.379 16.663 1.064C16.508 0.839 16.462 0.581 16.383 0.329C16.332 0.176 16.283 0.02 16.121 -0.002C15.944 -0.029 15.875 0.133 15.805 0.269C15.52 0.822 15.408 1.43 15.42 2.046C15.449 3.432 16.031 4.532 17.202 5.274C17.337 5.356 17.374 5.445 17.335 5.582C17.261 5.862 17.169 6.134 17.086 6.413C17.032 6.59 16.952 6.63 16.764 6.558C16.118 6.301 15.562 5.909 15.074 5.433C14.248 4.633 13.5 3.751 12.568 3.06C12.349 2.898 12.13 2.748 11.903 2.605C10.952 1.682 12.028 0.923 12.277 0.833C12.537 0.739 12.367 0.416 11.526 0.42C10.684 0.424 9.914 0.706 8.933 1.081C8.789 1.138 8.638 1.179 8.484 1.213C7.593 1.044 6.668 1.006 5.702 1.115C3.883 1.318 2.43 2.178 1.362 3.646C0.079 5.41 -0.223 7.415 0.147 9.506C0.535 11.71 1.66 13.535 3.389 14.962C5.181 16.441 7.246 17.166 9.601 17.027C11.032 16.944 12.624 16.753 14.421 15.232C14.874 15.458 15.35 15.548 16.138 15.615C16.746 15.672 17.331 15.585 17.784 15.491C18.493 15.341 18.444 14.684 18.188 14.564C16.108 13.595 16.565 13.989 16.15 13.67C17.206 12.42 18.82 10.198 19.363 7.086C19.421 6.709 19.484 6.171 19.469 5.866C19.458 5.681 19.493 5.604 19.681 5.556C20.199 5.412 20.691 5.172 21.125 4.806C22.366 3.824 22.758 2.554 22.708 1.1C22.7 0.878 22.649 0.654 22.403 0.567ZM11.175 14.451C9.159 12.726 8.182 12.088 7.778 12.067C7.401 12.047 7.469 12.505 7.552 12.807C7.639 13.103 7.752 13.313 7.91 13.581C8.02 13.758 8.095 14.01 7.801 14.16C7.152 14.487 6.023 13.806 5.97 13.772C4.657 12.85 3.559 11.766 2.785 10.369C2.037 9.025 1.603 7.583 1.532 6.044C1.513 5.672 1.622 5.541 1.992 5.473C2.479 5.383 2.981 5.364 3.468 5.436C5.525 5.736 7.276 6.675 8.744 8.323C9.582 9.299 10.216 10.425 10.869 11.496C11.563 12.592 12.31 13.603 13.262 14.414C13.598 14.696 13.866 14.91 14.123 15.068C13.349 15.154 12.058 15.167 11.175 14.452L11.175 14.451ZM12.141 8.26C12.141 8.095 12.273 7.963 12.439 7.963C12.476 7.963 12.511 7.971 12.541 7.982C12.582 7.997 12.62 8.019 12.65 8.053C12.704 8.106 12.733 8.181 12.733 8.26C12.733 8.425 12.601 8.556 12.435 8.556C12.27 8.556 12.141 8.425 12.141 8.26ZM15.142 9.799C14.949 9.878 14.757 9.945 14.572 9.953C14.284 9.968 13.972 9.851 13.802 9.709C13.537 9.487 13.348 9.363 13.27 8.977C13.236 8.812 13.255 8.556 13.284 8.41C13.352 8.094 13.277 7.892 13.055 7.708C12.873 7.558 12.643 7.516 12.39 7.516C12.296 7.516 12.209 7.475 12.145 7.441C12.039 7.389 11.952 7.257 12.035 7.096C12.062 7.043 12.19 6.916 12.22 6.893C12.563 6.698 12.96 6.762 13.326 6.908C13.665 7.047 13.922 7.302 14.292 7.663C14.669 8.098 14.738 8.218 14.953 8.545C15.123 8.801 15.277 9.063 15.383 9.364C15.447 9.551 15.364 9.705 15.142 9.799Z"
		const P_DOWN = "M23.271 2.216C23.039 2.071 22.91 2.287 22.755 2.388C22.703 2.42 22.656 2.464 22.61 2.505C22.214 2.848 21.771 3.054 21.225 2.956C20.412 2.784 19.68 2.919 19.005 3.435C18.92 2.663 18.493 2.157 17.808 1.798C17.446 1.621 17.08 1.449 16.83 1.111C16.656 0.872 16.611 0.612 16.524 0.354C16.469 0.198 16.414 0.039 16.223 0.009C16.017 -0.024 15.936 0.137 15.856 0.271C15.539 0.822 15.418 1.43 15.429 2.046C15.454 3.432 16.041 4.538 17.196 5.36C17.325 5.456 17.356 5.547 17.312 5.674C17.229 5.936 17.134 6.191 17.051 6.454C16.999 6.623 16.921 6.659 16.738 6.58C16.107 6.306 15.56 5.909 15.074 5.433C14.248 4.633 13.5 3.751 12.568 3.06C12.349 2.898 12.13 2.748 11.903 2.605C10.952 1.682 12.028 0.923 12.277 0.833C12.537 0.739 12.367 0.416 11.526 0.42C10.684 0.424 9.914 0.706 8.933 1.081C8.789 1.138 8.638 1.179 8.484 1.213C7.593 1.044 6.668 1.006 5.702 1.115C3.883 1.318 2.43 2.178 1.362 3.646C0.079 5.41 -0.223 7.415 0.147 9.506C0.535 11.71 1.66 13.535 3.389 14.962C5.181 16.441 7.246 17.166 9.601 17.027C11.032 16.944 12.624 16.753 14.421 15.232C14.874 15.458 15.35 15.548 16.138 15.615C16.746 15.672 17.331 15.585 17.784 15.491C18.493 15.341 18.444 14.684 18.188 14.564C16.108 13.595 16.565 13.989 16.15 13.67C17.206 12.42 18.82 10.198 19.278 7.246C19.318 6.948 19.375 6.534 19.371 6.293C19.371 6.145 19.411 6.092 19.597 6.098C20.113 6.109 20.619 6.051 21.096 5.891C22.503 5.375 23.169 4.232 23.448 2.804C23.49 2.586 23.491 2.356 23.271 2.216ZM11.175 14.49C9.159 13.005 8.182 12.567 7.778 12.621C7.401 12.673 7.469 13.087 7.552 13.354C7.639 13.619 7.752 13.797 7.91 14.024C8.02 14.175 8.095 14.406 7.801 14.609C7.152 15.063 6.023 14.63 5.97 14.609C4.657 13.941 3.559 12.965 2.785 11.569C2.037 10.225 1.603 8.783 1.532 7.244C1.513 6.872 1.622 6.741 1.992 6.673C2.479 6.583 2.981 6.564 3.468 6.636C5.525 6.936 7.276 7.843 8.744 9.163C9.582 9.888 10.216 10.783 10.869 11.679C11.563 12.659 12.31 13.617 13.262 14.415C13.598 14.696 13.866 14.91 14.123 15.068C13.349 15.155 12.058 15.177 11.175 14.491L11.175 14.49ZM12.141 8.26C12.141 8.095 12.273 7.963 12.439 7.963C12.476 7.963 12.511 7.971 12.541 7.982C12.582 7.997 12.62 8.019 12.65 8.053C12.704 8.106 12.733 8.181 12.733 8.26C12.733 8.425 12.601 8.556 12.435 8.556C12.27 8.556 12.141 8.425 12.141 8.26ZM15.142 9.799C14.949 9.878 14.757 9.945 14.572 9.953C14.284 9.968 13.972 9.851 13.802 9.709C13.537 9.487 13.348 9.363 13.27 8.977C13.236 8.812 13.255 8.556 13.284 8.41C13.352 8.094 13.277 7.892 13.055 7.708C12.873 7.558 12.643 7.516 12.39 7.516C12.296 7.516 12.209 7.475 12.145 7.441C12.039 7.389 11.952 7.257 12.035 7.096C12.062 7.043 12.19 6.916 12.22 6.893C12.563 6.698 12.96 6.762 13.326 6.908C13.665 7.047 13.922 7.302 14.292 7.663C14.669 8.098 14.738 8.218 14.953 8.545C15.123 8.801 15.277 9.063 15.383 9.364C15.447 9.551 15.364 9.705 15.142 9.799Z"

		/** Parse an SVG path into `{ c, n }` command/number segments. */
		function parsePath(d) {
			const out = []
			const cmdRe = /([MCLZ])([^MCLZ]*)/g
			let m
			while ((m = cmdRe.exec(d)) !== null) {
				const nums = []
				const numRe = /-?\d*\.?\d+(?:e-?\d+)?/g
				let n
				while ((n = numRe.exec(m[2])) !== null) nums.push(parseFloat(n[0]))
				out.push({ c: m[1], n: nums })
			}
			return out
		}

		const SEG_MID = parsePath(P_MID)
		const SEG_UP = parsePath(P_UP)
		const SEG_DOWN = parsePath(P_DOWN)
		const SCRATCH = [0, 0, 0, 0, 0, 0, 0, 0]

		/** Trace one swim pose onto a 2D context. `k`: -1 down, 0 rest, +1 up. */
		function traceWhale(g, k) {
			const a = SEG_MID
			const b = k >= 0 ? SEG_UP : SEG_DOWN
			const t = k < 0 ? -k : k
			g.beginPath()
			for (let i = 0; i < a.length; i++) {
				const cmd = a[i].c
				if (cmd === 'Z') {
					g.closePath()
					continue
				}
				const na = a[i].n
				const nb = b[i].n
				for (let j = 0; j < na.length; j++) SCRATCH[j] = na[j] + (nb[j] - na[j]) * t
				if (cmd === 'M') g.moveTo(SCRATCH[0], SCRATCH[1])
				else if (cmd === 'C') g.bezierCurveTo(SCRATCH[0], SCRATCH[1], SCRATCH[2], SCRATCH[3], SCRATCH[4], SCRATCH[5])
				else if (cmd === 'L') g.lineTo(SCRATCH[0], SCRATCH[1])
			}
		}

		/** School palette. Index 4 is the one gold koi of the tank. */
		const DARK_COLORS = ['#7dd3fc', '#93c5fd', '#67e8f9', '#a5b4fc', '#bae6fd']
		const LIGHT_COLORS = ['#0284c7', '#4f46e5', '#0e7490', '#2563eb', '#0369a1']
		const DARK_ACCENT = '#fcd34d'
		const LIGHT_ACCENT = '#b45309'

		/* 点击水波：同屏最多几圈、一圈活多久、扩散到多大 */
		const RIPPLE_MAX = 8
		const RIPPLE_LIFE = 1.05
		const RIPPLE_RADIUS = 230
		/* 惊散：点击瞬间一个速度冲量，随后约 1 秒内衰减回巡航速度。
		   注意这是"速率"不是时间常数：exp(-2.9t) → τ = 1/2.9 ≈ 0.34s，
		   即 0.5 秒后剩 23%、1 秒后剩 5%（= 已经回到巡航速度）。
		   注意这里不再同时设 panic——panic 是"鼠标贴近"的持续激励，衰减更慢，
		   混在一起会让鱼在 1 秒后仍然超速。 */
		const RIPPLE_STARTLE_KICK = 3.0
		const RIPPLE_STARTLE_TARGET = 1.5
		const RIPPLE_STARTLE_DECAY = 2.9

		/* ─────────────────────────── settings store ─────────────────────────── */
		const STORAGE_KEY = 'dsh-whale-aquarium/v1'
		const DEFAULTS = {
			enabled: true,
			paused: false,
			count: 10,
			size: 46,
			speed: 1,
			opacity: 0.45,
			avoid: 150,
			bubbles: true,
			bubbleCount: 70,
			bubbleSize: 7,
			faceLeft: true,
			blend: false,
		}

		function readStored() {
			try {
				const raw = window.localStorage.getItem(STORAGE_KEY)
				if (raw === null) return {}
				const parsed = JSON.parse(raw)
				if (parsed === null || typeof parsed !== 'object') return {}
				const out = {}
				for (const key of Object.keys(DEFAULTS)) {
					if (typeof parsed[key] === typeof DEFAULTS[key]) out[key] = parsed[key]
				}
				return out
			} catch (err) {
				return {}
			}
		}

		function writeStored(state) {
			try {
				const out = {}
				for (const key of Object.keys(DEFAULTS)) out[key] = state[key]
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(out))
			} catch (err) {
				/* private mode or a full quota: the aquarium just runs unpersisted */
			}
		}

		function createStore() {
			let state = Object.assign({}, DEFAULTS, readStored(), { scheme: 'dark' })
			const subscribers = new Set()
			return {
				get() {
					return state
				},
				set(patch) {
					state = Object.assign({}, state, patch)
					writeStored(state)
					for (const fn of subscribers) fn()
				},
				/** Non-persisted slot (the active color scheme). */
				setInternal(patch) {
					state = Object.assign({}, state, patch)
					for (const fn of subscribers) fn()
				},
				subscribe(fn) {
					subscribers.add(fn)
					return () => subscribers.delete(fn)
				},
			}
		}

		function angDiff(a, b) {
			let d = (a - b + Math.PI) % (Math.PI * 2)
			if (d < 0) d += Math.PI * 2
			return d - Math.PI
		}

		function blendAngle(cur, want, w) {
			return cur + angDiff(want, cur) * (w > 1 ? 1 : w)
		}

		function clampNum(v, lo, hi) {
			return v < lo ? lo : v > hi ? hi : v
		}

		/* ─────────────────────────── plugin styles ─────────────────────────── */
		const CSS = [
			'.dwa-foot{align-items:center;background:0 0;border:0;border-radius:8px;color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;font-size:13px;gap:6px;height:28px;justify-content:center;min-width:28px;padding:0 6px}',
			'.dwa-foot:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
			'.dwa-foot[aria-pressed=true]{color:var(--dsw-alias-brand-primary)}',
			'.dwa-page{display:flex;flex-direction:column;gap:14px;max-width:560px}',
			'.dwa-title{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;margin:0}',
			'.dwa-desc{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin:0}',
			'.dwa-row{align-items:center;display:grid;gap:12px;grid-template-columns:86px 1fr 56px}',
			'.dwa-rowLabel{color:var(--dsw-alias-label-secondary);font-size:12px}',
			'.dwa-rowValue{color:var(--dsw-alias-label-primary);font-size:12px;font-variant-numeric:tabular-nums;text-align:right}',
			'.dwa-row input[type=range]{accent-color:var(--dsw-alias-brand-primary);cursor:pointer;min-width:0;width:100%}',
			'.dwa-toggles{display:flex;flex-wrap:wrap;gap:8px}',
			'.dwa-toggle{background:0 0;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;color:var(--dsw-alias-label-primary);cursor:pointer;font-size:12px;line-height:18px;padding:4px 10px}',
			'.dwa-toggle[aria-pressed=true]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}',
		].join('')

		function ensureStyle() {
			if (typeof document === 'undefined') return
			if (document.querySelector('style[data-plugin-css="dsh-whale-aquarium/style"]') !== null) return
			const tag = document.createElement('style')
			tag.dataset.plugin = 'dsh-whale-aquarium'
			tag.dataset.pluginCss = 'dsh-whale-aquarium/style'
			tag.textContent = CSS
			document.head.appendChild(tag)
		}

		return {
			name: 'dsh-whale-aquarium',
			inject: ['slots'],
			apply(ctx) {
				const store = createStore()
				ensureStyle()

				/* Whales read the theme; they never write it. */
				const theme = ctx.get('theme')
				if (theme !== undefined) {
					const snapshot = theme.getTheme()
					if (snapshot && snapshot.active && snapshot.active.colorScheme) store.setInternal({ scheme: snapshot.active.colorScheme })
				}
				ctx.on('theme/change', (snapshot) => {
					if (snapshot && snapshot.active && snapshot.active.colorScheme) store.setInternal({ scheme: snapshot.active.colorScheme })
				})

				/** Subscribe a component to the shared settings store. */
				function useSettings() {
					const [tick, bump] = React.useState(0)
					React.useEffect(() => store.subscribe(() => bump((v) => v + 1)), [])
					return store.get()
				}

				/* ── the aquarium layer ──────────────────────────────────────────
				 * Lives in `shell.overlay`: frame-wide, above every column, click-
				 * through. One canvas, one rAF loop, no DOM outside it.
				 */
				function WhaleLayer() {
					const cfg = useSettings()
					const canvasRef = React.useRef(null)

					React.useEffect(() => {
						const canvas = canvasRef.current
						if (!canvas) return undefined
						const win = canvas.ownerDocument.defaultView
						const g = canvas.getContext('2d')
						if (!g) return undefined

						let stopped = false
						let rafId = 0
						let W = 0
						let H = 0
						let dpr = 1
						let lastSizeCheck = 0
						let last = Date.now()
						const fish = []
						const bubbles = []
						const ripples = []
						const pointer = { x: -1e5, y: -1e5, active: false }

						const requestFrame = (cb) => {
							rafId = win.requestAnimationFrame(cb)
						}

						const onMove = (ev) => {
							pointer.x = ev.clientX
							pointer.y = ev.clientY
							pointer.active = true
						}
						const onDown = (ev) => {
							pointer.x = ev.clientX
							pointer.y = ev.clientY
							pointer.active = true
							/* 点击处荡开一圈水波 */
							if (ripples.length >= RIPPLE_MAX) ripples.shift()
							ripples.push({ x: ev.clientX, y: ev.clientY, t: 0 })
							/* 惊散：起步就是一个速度冲量，而不是慢慢加速上去 */
							const kick = 26 * store.get().speed * RIPPLE_STARTLE_KICK
							for (const f of fish) {
								f.burst = 1
								f.angle += (Math.random() - 0.5) * 1.6
								f.speed = Math.max(f.speed, kick)
							}
						}
						const onOut = () => {
							pointer.active = false
						}
						win.addEventListener('pointermove', onMove, { passive: true })
						win.addEventListener('pointerdown', onDown, { passive: true })
						win.addEventListener('blur', onOut)
						canvas.ownerDocument.addEventListener('pointerleave', onOut)

						function syncSize(force) {
							const now = Date.now()
							if (!force && now - lastSizeCheck < 250) return
							lastSizeCheck = now
							const cw = canvas.clientWidth || win.innerWidth || 0
							const ch = canvas.clientHeight || win.innerHeight || 0
							if (cw <= 0 || ch <= 0) return
							const ratio = win.devicePixelRatio || 1
							const bw = Math.round(cw * ratio)
							const bh = Math.round(ch * ratio)
							if (canvas.width !== bw || canvas.height !== bh || W !== cw || H !== ch) {
								canvas.width = bw
								canvas.height = bh
								W = cw
								H = ch
								dpr = ratio
							}
						}
						syncSize(true)

						function spawnFish() {
							const vw = W > 0 ? W : 900
							const vh = H > 0 ? H : 700
							return {
								x: Math.random() * vw,
								y: 40 + Math.random() * Math.max(1, vh - 80),
								angle: (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.7,
								speed: 18 + Math.random() * 26,
								depth: 0.25 + Math.random() * 0.75,
								scale: 0.62 + Math.random() * 0.7,
								seed: Math.random() * 500,
								wf: 0.12 + Math.random() * 0.3,
								phase: Math.random() * Math.PI * 2,
								panic: 0,
								burst: 0,
								ci: Math.floor(Math.random() * 5),
							}
						}

						function ensureFish(count) {
							while (fish.length < count) fish.push(spawnFish())
							if (fish.length > count) fish.length = count
						}

						function stepBubbles(c, dt) {
							if (!c.bubbles) {
								if (bubbles.length > 0) bubbles.length = 0
								return
							}
							// The cap, not the spawn rate, is what decides how many
							// bubbles you actually see: a bubble lives ~30s on a normal
							// viewport, so even 9/s would pile up far past the cap. Both
							// are settings now (气泡数量 / 气泡大小).
							const maxBubbles = clampNum(c.bubbleCount, 0, 400)
							const maxRadius = clampNum(c.bubbleSize, 1.5, 60)
							if (bubbles.length < maxBubbles && Math.random() < dt * 12) {
								bubbles.push({
									x: Math.random() * (W > 0 ? W : 900),
									y: (H > 0 ? H : 700) + 12,
									r: 1.2 + Math.random() * (maxRadius - 1.2),
									v: 14 + Math.random() * 30,
									ph: Math.random() * Math.PI * 2,
								})
							}
							for (let i = bubbles.length - 1; i >= 0; i--) {
								const b = bubbles[i]
								b.y -= b.v * dt
								b.x += Math.sin(b.y * 0.02 + b.ph) * 12 * dt
								if (b.y < -14) bubbles.splice(i, 1)
							}
						}

						function stepRipples(dt) {
							for (let i = ripples.length - 1; i >= 0; i--) {
								const r = ripples[i]
								r.t += dt
								if (r.t >= RIPPLE_LIFE) ripples.splice(i, 1)
							}
						}

						function step(c, dt, t) {
							ensureFish(c.count)
							stepBubbles(c, dt)
							stepRipples(dt)
							const cruise = 26 * c.speed
							const R = c.avoid
							const R2 = R * R
							for (let i = 0; i < fish.length; i++) {
								const f = fish[i]
								let want = f.angle + Math.sin(t * f.wf + f.seed) * 1.15 * dt
								let panic = 0

								/* flee the cursor */
								if (pointer.active) {
									const dx = f.x - pointer.x
									const dy = f.y - pointer.y
									const d2 = dx * dx + dy * dy
									if (d2 < R2) {
										const d = Math.sqrt(d2) || 0.001
										const w = 1 - d / R
										want = blendAngle(want, Math.atan2(dy, dx), w * 1.8)
										panic = w * w
									}
								}

								/* turn back before leaving the frame */
								const m = 120
								if (f.x < m) want = blendAngle(want, 0, (1 - f.x / m) * 0.85)
								else if (f.x > W - m) want = blendAngle(want, Math.PI, (1 - (W - f.x) / m) * 0.85)
								if (f.y < m) want = blendAngle(want, Math.PI / 2, (1 - f.y / m) * 0.85)
								else if (f.y > H - m) want = blendAngle(want, -Math.PI / 2, (1 - (H - f.y) / m) * 0.85)

								/* keep a little distance from each other */
								for (let j = 0; j < fish.length; j++) {
									if (j === i) continue
									const o = fish[j]
									const dx = f.x - o.x
									const dy = f.y - o.y
									const sep = 58 * (0.6 + f.depth * 0.6)
									const d2 = dx * dx + dy * dy
									if (d2 < sep * sep && d2 > 0.0001) {
										want = blendAngle(want, Math.atan2(dy, dx), (1 - Math.sqrt(d2) / sep) * 0.75)
									}
								}

								const maxTurn = (1.5 + 3.0 * f.panic) * dt
								f.angle += clampNum(angDiff(want, f.angle), -maxTurn, maxTurn)

								// 两股分开的激励：panic 由"鼠标贴近"持续驱动（衰减慢，τ≈0.77s）；
								// burst 只在点击那一下给冲量（衰减快，τ≈0.34s，1 秒后只剩 5%）。
								// 二者混在一起会让鱼在 1 秒后仍然超速，所以点击不再注入 panic。
								f.panic = Math.max(f.panic * Math.exp(-dt * 1.3), panic)
								f.burst *= Math.exp(-dt * RIPPLE_STARTLE_DECAY)
								const target = cruise * (1 + 1.8 * f.panic + RIPPLE_STARTLE_TARGET * f.burst)
								// 加速比减速快：起步立刻冲出去，收尾是缓缓滑回巡航速度
								f.speed += (target - f.speed) * Math.min(1, dt * (target > f.speed ? 6.5 : 3.5))

								f.x += Math.cos(f.angle) * f.speed * dt
								f.y += Math.sin(f.angle) * f.speed * dt
								f.phase += dt * (9 + f.speed * 0.14)

								/* swim out one side, come back on the other */
								if (f.x < -160) f.x = W + 150
								else if (f.x > W + 160) f.x = -150
								if (f.y < -140) f.y = H + 130
								else if (f.y > H + 140) f.y = -130
							}
						}

						function paint(c) {
							ensureFish(c.count)
							const light = c.scheme === 'light'
							const colors = light ? LIGHT_COLORS : DARK_COLORS
							const accent = light ? LIGHT_ACCENT : DARK_ACCENT

							/* 点击水波：先扩散后变淡，画在鱼下面（水面的扰动在鱼之下） */
							if (ripples.length > 0) {
								const waveAlpha = Math.min(1, 0.35 + 1.5 * c.opacity)
								g.strokeStyle = light ? '#38bdf8' : '#bae6fd'
								for (const r of ripples) {
									const p = clampNum(r.t / RIPPLE_LIFE, 0, 1)
									// ease-out：一开始扩散得快，之后越来越慢
									const radius = RIPPLE_RADIUS * (1 - Math.pow(1 - p, 3))
									const fade = 1 - p
									g.globalAlpha = waveAlpha * fade
									g.lineWidth = 0.6 + 2.6 * fade
									g.beginPath()
									g.arc(r.x, r.y, radius, 0, Math.PI * 2)
									g.stroke()
									/* 内侧的回波，让水波有层次 */
									g.globalAlpha = waveAlpha * fade * 0.55
									g.lineWidth = 0.5 + 1.4 * fade
									g.beginPath()
									g.arc(r.x, r.y, radius * 0.58, 0, Math.PI * 2)
									g.stroke()
								}
								g.globalAlpha = 1
							}

							if (bubbles.length > 0) {
								// Bubbles do NOT inherit the fish opacity curve: at 45% that
								// left a 0.22-alpha hairline nobody could see. Their own
								// floor keeps them readable while staying translucent.
								//
								// They also stay LIGHT in both themes: a bubble is a
								// highlight, not an outline. The first pass mirrored the
								// theme (a navy #0c4a6e rim in light mode) and read as
								// "suddenly dark bubbles". Light mode instead uses a soft
								// sky tint — pale enough to stay a bubble, strong enough
								// to survive a white background — plus a white shine.
								const bubbleAlpha = Math.min(1, 0.3 + 0.9 * c.opacity)
								const body = light ? '#38bdf8' : '#bae6fd'
								const rim = light ? '#7dd3fc' : '#e0f2fe'
								const shine = '#ffffff'
								const bodyAlpha = bubbleAlpha * (light ? 0.5 : 0.35)
								const rimAlpha = bubbleAlpha * 0.8
								const shineAlpha = Math.min(1, bubbleAlpha * 1.15)
								g.lineWidth = 1.2
								for (const b of bubbles) {
									/* translucent body */
									g.globalAlpha = bodyAlpha
									g.fillStyle = body
									g.beginPath()
									g.arc(b.x, b.y, b.r, 0, Math.PI * 2)
									g.fill()
									/* rim */
									g.globalAlpha = rimAlpha
									g.strokeStyle = rim
									g.beginPath()
									g.arc(b.x, b.y, b.r, 0, Math.PI * 2)
									g.stroke()
									/* shine: a filled dot, on every bubble that can
									   resolve one — the stroked ring the first pass drew
									   was too faint to read as a highlight */
									if (b.r > 1.6) {
										g.globalAlpha = shineAlpha
										g.fillStyle = shine
										g.beginPath()
										g.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, Math.max(0.7, b.r * 0.32), 0, Math.PI * 2)
										g.fill()
									}
								}
							}

							const order = fish.slice().sort((a, b) => a.depth - b.depth)
							for (const f of order) {
								const w = c.size * f.scale * (0.55 + f.depth * 0.65)
								const k = Math.sin(f.phase) * (0.5 + 0.5 * Math.min(1, f.speed / 55))
								const ca = Math.cos(f.angle)
								const mirror = (c.faceLeft ? -1 : 1) * (ca < 0 ? -1 : 1)

								g.save()
								g.translate(f.x, f.y)
								g.rotate(ca < 0 ? f.angle + Math.PI : f.angle)
								g.scale(mirror, 1)
								const s = w / WHALE_W
								g.scale(s, s)
								g.translate(-WHALE_W / 2, -WHALE_H / 2)
								g.globalAlpha = clampNum(c.opacity * (0.3 + 0.7 * f.depth), 0, 1)
								g.fillStyle = f.ci === 4 ? accent : colors[f.ci]
								traceWhale(g, k)
								g.fill()
								g.restore()
							}
							g.globalAlpha = 1
						}

						function frame() {
							if (stopped) return
							const now = Date.now()
							let dt = (now - last) / 1000
							last = now
							if (!(dt > 0)) dt = 1 / 60
							if (dt > 0.05) dt = 0.05
							const c = store.get()
							syncSize(false)
							if (W > 0 && H > 0) {
								g.setTransform(dpr, 0, 0, dpr, 0, 0)
								g.clearRect(0, 0, W, H)
								if (!c.paused) step(c, dt, now / 1000)
								paint(c)
							}
							requestFrame(frame)
						}
						requestFrame(frame)

						return () => {
							stopped = true
							win.cancelAnimationFrame(rafId)
							win.removeEventListener('pointermove', onMove)
							win.removeEventListener('pointerdown', onDown)
							win.removeEventListener('blur', onOut)
							canvas.ownerDocument.removeEventListener('pointerleave', onOut)
							fish.length = 0
							bubbles.length = 0
							ripples.length = 0
						}
					}, [cfg.enabled])

					if (!cfg.enabled) return null

					return React.createElement(
						'div',
						{
							'aria-hidden': 'true',
							style: {
								height: '100vh',
								left: 0,
								overflow: 'hidden',
								pointerEvents: 'none',
								position: 'fixed',
								top: 0,
								width: '100vw',
								zIndex: 0,
							},
						},
						React.createElement('canvas', {
							ref: canvasRef,
							style: {
								display: 'block',
								height: '100%',
								mixBlendMode: cfg.blend ? (cfg.scheme === 'light' ? 'multiply' : 'screen') : 'normal',
								pointerEvents: 'none',
								width: '100%',
							},
						}),
					)
				}

				/* ── the mark, as an icon ──────────────────────────────────────── *
				 * The official whale mark again, so the sidebar toggle reads as the
				 * DSH whale rather than whatever glyph an emoji font decides a whale
				 * looks like (🐋 renders dolphin-ish on Apple's font). `currentColor`
				 * makes it follow the button's theme color for free.
				 */
				function WhaleGlyph(props) {
					const size = props.size === undefined ? 18 : props.size
					return React.createElement(
						'svg',
						{
							width: size,
							height: size,
							viewBox: '0 0 ' + WHALE_W + ' ' + WHALE_H,
							fill: 'currentColor',
							focusable: 'false',
							'aria-hidden': 'true',
							style: { display: 'block', flex: 'none' },
						},
						React.createElement('path', { d: P_MID }),
					)
				}

				/* ── sidebar foot toggle ───────────────────────────────────────── */
				function FootAction(props) {
					const cfg = useSettings()
					const on = cfg.enabled
					return React.createElement(
						'button',
						{
							type: 'button',
							className: 'dwa-foot',
							'aria-pressed': on,
							onClick: () => store.set({ enabled: !on }),
							title: on ? 'Whale Aquarium: on (click to hide)' : 'Whale Aquarium: off (click to show)',
						},
						React.createElement(WhaleGlyph, { size: 18 }),
						props.wide ? React.createElement('span', null, 'Aquarium') : null,
					)
				}

				/* ── settings page ─────────────────────────────────────────────── */
				function Slider(props) {
					return React.createElement(
						'label',
						{ className: 'dwa-row' },
						React.createElement('span', { className: 'dwa-rowLabel' }, props.label),
						React.createElement('input', {
							type: 'range',
							min: props.min,
							max: props.max,
							step: props.step,
							value: props.value,
							onChange: (ev) => props.onChange(parseFloat(ev.target.value)),
						}),
						React.createElement('span', { className: 'dwa-rowValue' }, props.display),
					)
				}

				function Pill(props) {
					return React.createElement(
						'button',
						{
							type: 'button',
							className: 'dwa-toggle',
							'aria-pressed': props.active,
							title: props.title,
							onClick: props.onClick,
						},
						props.label,
					)
				}

				function SettingsSection() {
					const c = useSettings()
					return React.createElement(
						'div',
						{ className: 'dwa-page' },
						React.createElement(
							'div',
							{ style: { alignItems: 'center', display: 'flex', gap: 8 } },
							React.createElement(WhaleGlyph, { size: 22 }),
							React.createElement('h2', { className: 'dwa-title' }, 'Whale Aquarium'),
						),
						React.createElement(
							'p',
							{ className: 'dwa-desc' },
							'A school of the official DeepSeek whale mark swimming over the whole frame. They flee your cursor; clicking anywhere scatters the school. The layer is click-through, so the app underneath is never blocked.',
						),
						React.createElement(
							'div',
							{ className: 'dwa-toggles' },
							React.createElement(Pill, {
								label: c.enabled ? 'Enabled' : 'Disabled',
								active: c.enabled,
								onClick: () => store.set({ enabled: !c.enabled }),
							}),
							React.createElement(Pill, {
								label: c.paused ? 'Paused' : 'Swimming',
								active: c.paused,
								onClick: () => store.set({ paused: !c.paused }),
							}),
							React.createElement(Pill, {
								label: c.bubbles ? 'Bubbles: on' : 'Bubbles: off',
								active: c.bubbles,
								onClick: () => store.set({ bubbles: !c.bubbles }),
							}),
							React.createElement(Pill, {
								label: c.blend ? 'Blend: on' : 'Blend: off',
								active: c.blend,
								title: 'Blend the whales with the UI colors (screen in dark, multiply in light). Prettier, slightly more expensive.',
								onClick: () => store.set({ blend: !c.blend }),
							}),
							React.createElement(Pill, {
								label: 'Flip facing',
								active: false,
								title: 'Use this if the whales look like they are swimming backwards.',
								onClick: () => store.set({ faceLeft: !c.faceLeft }),
							}),
						),
						React.createElement(Slider, {
							label: 'Whales',
							min: 1,
							max: 40,
							step: 1,
							value: c.count,
							display: String(c.count),
							onChange: (v) => store.set({ count: v }),
						}),
						React.createElement(Slider, {
							label: 'Size',
							min: 20,
							max: 90,
							step: 1,
							value: c.size,
							display: c.size + 'px',
							onChange: (v) => store.set({ size: v }),
						}),
						React.createElement(Slider, {
							label: 'Speed',
							min: 0.2,
							max: 2.5,
							step: 0.1,
							value: c.speed,
							display: c.speed.toFixed(1) + 'x',
							onChange: (v) => store.set({ speed: v }),
						}),
						React.createElement(Slider, {
							label: 'Opacity',
							min: 0.1,
							max: 1,
							step: 0.05,
							value: c.opacity,
							display: Math.round(c.opacity * 100) + '%',
							onChange: (v) => store.set({ opacity: v }),
						}),
						React.createElement(Slider, {
							label: 'Shyness',
							min: 40,
							max: 360,
							step: 10,
							value: c.avoid,
							display: c.avoid + 'px',
							onChange: (v) => store.set({ avoid: v }),
						}),
						React.createElement(Slider, {
							label: 'Bubbles',
							min: 0,
							max: 160,
							step: 5,
							value: c.bubbleCount,
							display: String(c.bubbleCount),
							onChange: (v) => store.set({ bubbleCount: v }),
						}),
						React.createElement(Slider, {
							label: 'Bubble size',
							min: 2,
							max: 12,
							step: 0.5,
							value: c.bubbleSize,
							display: c.bubbleSize.toFixed(1) + 'px',
							onChange: (v) => store.set({ bubbleSize: v }),
						}),
						React.createElement(
							'p',
							{ className: 'dwa-desc' },
							'Settings are stored in this browser (localStorage), not in DSH. Uninstall with `dsh plugin --profile web remove dsh-whale-aquarium`.',
						),
					)
				}

				ctx.slots.inject('shell.overlay', () =>
					ctx.slots.register({ name: 'shell.overlay', id: 'whale-aquarium', order: 20 }, WhaleLayer),
				)
				ctx.slots.inject('sidebar.footer.action', () =>
					ctx.slots.register(
						{ name: 'sidebar.footer.action', id: 'whale-aquarium-toggle', order: 30, label: 'Whale Aquarium' },
						FootAction,
					),
				)
				ctx.slots.inject('settings.section', () =>
					ctx.slots.register(
						{ name: 'settings.section', id: 'whale-aquarium', order: 30, label: 'Whale Aquarium' },
						SettingsSection,
					),
				)
			},
		}
	},
})
