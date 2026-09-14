/**
 * Smoke test for the browser half.
 *
 * There is no build step, so this file is what ships — and this test is the
 * cheapest way to prove it before anyone installs it: it runs lib/client.js in a
 * vm with a stubbed `window`, captures the `__ModuleLoader__` registration,
 * materializes the plugin with a stub `require('react')` and a stub Cordis
 * context, and drives the real rAF loop against a recording 2D context.
 *
 * Run: node test/smoke.mjs
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

/* ── the loader side ──────────────────────────────────────────────────────── */

let registration
const sandbox = {
	window: { __ModuleLoader__: { load(r) { registration = r } } },
	// Deliberately absent: `document`. ensureStyle() has to tolerate a headless run.
	console,
}
vm.createContext(sandbox)
vm.runInContext(source, sandbox, { filename: 'lib/client.js' })

assert.ok(registration, 'bundle must call window.__ModuleLoader__.load')

/* ── the packaging contract ───────────────────────────────────────────────────
 * DSH derives all of this from package.json at boot, so a mismatch here is a
 * broken install rather than a broken render — check it in CI, not in the browser.
 * The most common footgun: renaming the package and forgetting the bundle id.
 */

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
assert.equal(registration.id, pkg.name, 'the bundle id MUST equal the package name (client-modules keys factories by it)')

const clientRel = pkg.exports?.['./client']?.default
assert.equal(clientRel, './lib/client.js', 'dsh.client requires an "./client" export')
assert.ok(existsSync(new URL(`../${clientRel.slice(2)}`, import.meta.url)), `${clientRel} must exist`)
assert.ok(existsSync(new URL('../lib/index.js', import.meta.url)), 'the node half must exist for Loader to mount the row')

assert.equal(pkg.dsh?.client?.platform, 'web', 'dsh.client.platform must be web')
assert.ok(Array.isArray(pkg.dsh?.client?.inject), 'dsh.client.inject must be an array (unknown names are ignored, not fatal)')

const patchRel = pkg.dsh?.bundle?.patch
assert.equal(patchRel, './cordis.patch.yml', 'a Profile Bundle must declare dsh.bundle.patch')
// Parsed by name rather than by dependency: this repo has no dependencies at all,
// and the shaped check below is what actually catches the rename footgun.
const patchText = readFileSync(new URL(`../${patchRel.slice(2)}`, import.meta.url), 'utf8')
assert.match(patchText, /^\s*-\s*insert:/m, 'the patch layer must insert rows')
const patchNames = [...patchText.matchAll(/^\s*name:\s*['"]?([^'"\s]+)['"]?\s*$/gm)].map((m) => m[1])
assert.ok(
	patchNames.includes(pkg.name),
	`the patch layer must insert a row named after the package: expected ${pkg.name}, found ${JSON.stringify(patchNames)}`,
)

/* ── React stub ───────────────────────────────────────────────────────────── */

const effects = []
function makeReact() {
	return {
		createElement(type, props, ...children) {
			return { type, props: props ?? {}, children }
		},
		useState(initial) {
			return [typeof initial === 'function' ? initial() : initial, () => {}]
		},
		useEffect(fn) {
			effects.push(fn)
		},
		useRef(initial) {
			return { current: initial ?? null }
		},
	}
}

const plugin = registration.factory((spec) => {
	if (spec === 'react') return makeReact()
	throw new Error(`unexpected require("${spec}") — only platform seed words are guaranteed`)
})

assert.equal(plugin.name, 'dsh-whale-aquarium')
assert.deepEqual(Array.from(plugin.inject), ['slots'], 'the plugin needs the slot registry')

/* ── Cordis context stub ──────────────────────────────────────────────────── */

const registered = []
const slots = {
	inject(key, callback) {
		callback()
		return () => {}
	},
	register(options, component) {
		registered.push({ options, component })
		return () => {}
	},
}
const ctx = {
	// `inject: ['slots']` is what puts this property on the real ctx; the stub
	// mirrors both faces so either access style works.
	slots,
	get(name) {
		if (name === 'slots') return slots
		if (name === 'theme') return { getTheme: () => ({ active: { colorScheme: 'light' } }) }
		return undefined
	},
	on() {
		return () => {}
	},
}

plugin.apply(ctx)

const byName = new Map(registered.map((r) => [r.options.name, r]))
assert.equal(registered.length, 3, 'expected three slot registrations')
assert.equal(byName.get('shell.overlay').options.id, 'whale-aquarium')
assert.equal(byName.get('sidebar.footer.action').options.id, 'whale-aquarium-toggle')
assert.equal(byName.get('settings.section').options.id, 'whale-aquarium')

/* ── drive the aquarium ───────────────────────────────────────────────────── */

const calls = { arc: 0, bezierCurveTo: 0, clearRect: 0, fill: 0, stroke: 0 }
/** Alpha in force at each stroke() — bubbles and ripples are the stroked primitives. */
const strokeAlphas = []
/** Every color actually painted, so palette regressions are catchable. */
const fillColors = new Set()
const strokeColors = new Set()
/** Circle radii per frame: bubbles (<= 7px) and ripples (up to ~230px). */
const arcRadii = []
const arcByFrame = []
const arcsPerFrame = []
let arcsThisFrame = 0
/** World position of the first drawn fish per frame — how the test measures speed. */
const posByFrame = []
let frameNo = 0
const g = {
	beginPath() {}, bezierCurveTo() { calls.bezierCurveTo++ },
	arc(x, y, r) { calls.arc++; arcsThisFrame++; arcRadii.push(r); (arcByFrame[frameNo] ||= []).push(r) },
	closePath() {}, lineTo() {}, moveTo() {},
	fill() { calls.fill++; fillColors.add(g.fillStyle) },
	stroke() { calls.stroke++; strokeAlphas.push(g.globalAlpha); strokeColors.add(g.strokeStyle) },
	// One clearRect per frame, so it is the frame boundary: bubbles are drawn
	// three times each (body, rim, shine), so this bounds the live count.
	clearRect() { calls.clearRect++; arcsPerFrame.push(arcsThisFrame); arcsThisFrame = 0 },
	restore() {}, rotate() {}, save() {}, scale() {}, setTransform() {},
	// Each fish translates to its world position first, then by the constant
	// centering offset (−WHALE_W/2, −WHALE_H/2); record only the former.
	translate(x, y) {
		if (frameNo === 0 || Math.abs(x + 11.58) > 0.05 || Math.abs(y + 8.52) > 0.05) {
			if (posByFrame[frameNo] === undefined) posByFrame[frameNo] = { x, y }
		}
	},
	fillStyle: '', globalAlpha: 1, lineWidth: 1, strokeStyle: '',
}

let frames = 0
// Enough frames that the bubble draws stop being a coin flip: ~12 spawns/s over
// 200 frames is ~40 bubbles, so "the size range reaches its cap" is deterministic
// instead of a 1-in-30 flake.
const MAX_FRAMES = 200
/** The synthetic click lands here, so burst-vs-baseline is measurable. */
const CLICK_AT = 40
const listeners = {}
const win = {
	devicePixelRatio: 2,
	innerWidth: 1200,
	innerHeight: 800,
	addEventListener(type, fn) { (listeners[type] ||= []).push(fn) },
	removeEventListener() {},
	requestAnimationFrame(cb) {
		// Synchronous, bounded: the loop must be re-entrant-safe and finite.
		frames++
		frameNo = frames
		if (frames === CLICK_AT) {
			for (const fn of listeners.pointerdown ?? []) fn({ clientX: 600, clientY: 400 })
		}
		if (frames <= MAX_FRAMES) cb()
		return frames
	},
	cancelAnimationFrame() {},
}
const doc = { addEventListener() {}, removeEventListener() {}, defaultView: win }
const canvas = { clientHeight: 800, clientWidth: 1200, height: 0, ownerDocument: doc, getContext: () => g, width: 0 }

const layer = byName.get('shell.overlay').component
const tree = layer({})
assert.equal(tree.type, 'div')
const canvasNode = tree.children[0]
assert.equal(canvasNode.type, 'canvas')
assert.equal(canvasNode.props.style.pointerEvents, 'none', 'the layer must stay click-through')
canvasNode.props.ref.current = canvas

const cleanup = effects.at(-1)()
assert.ok(calls.clearRect > 0, 'the frame loop must have painted')
assert.ok(calls.fill > 0, 'whales must have been filled')
assert.ok(calls.bezierCurveTo > 0, 'whales are drawn from the real bezier paths')

// Bubbles: visible at the DEFAULT opacity. v1 drew a 0.22-alpha hairline here and
// nobody could see it, so this is asserted rather than eyeballed.
assert.ok(strokeAlphas.length > 0, 'bubbles must spawn and be stroked')
const maxStrokeAlpha = Math.max(...strokeAlphas)
assert.ok(maxStrokeAlpha >= 0.5, `bubble strokes must be visible, got max alpha ${maxStrokeAlpha}`)

// Palette: this run is LIGHT-scheme (the stub theme says so). Bubbles must stay
// light there too — the first pass mirrored the theme into a navy rim and read as
// "the bubbles went dark" — and every bubble that can resolve one carries a filled
// white shine.
assert.ok(!strokeColors.has('#0c4a6e'), 'light-scheme bubbles must not use the dark navy rim')
assert.ok(fillColors.has('#ffffff'), 'bubbles must paint a filled white shine')
assert.ok(fillColors.has('#38bdf8'), 'light-scheme bubbles must use the soft sky body tint')

// Bubble size range and cap (DEFAULTS: bubbleSize 7 → radii span 1.2–7, and the
// shine dot bottoms out at 0.7). Measured on the frames BEFORE the synthetic
// click, so ripples (up to ~230px) cannot pollute the bubble bound. Bounds only,
// no distribution assumptions, so this cannot flake.
const preClickArcs = arcByFrame.slice(0, CLICK_AT).flat()
const minArc = Math.min(...preClickArcs)
const maxArc = Math.max(...preClickArcs)
assert.ok(minArc >= 0.6, `no circle may be smaller than the shine floor, got ${minArc}`)
assert.ok(maxArc <= 7.5, `no bubble may exceed bubbleSize (7), got ${maxArc}`)
assert.ok(maxArc >= 5, `the size range must actually reach up toward its cap, got ${maxArc}`)
// 70 bubbles x 3 circles is the ceiling; a per-frame count above it means the cap
// is not being applied.
const peakArcs = Math.max(...arcsPerFrame)
assert.ok(peakArcs <= 70 * 3 + 16, `per-frame circle count ${peakArcs} exceeds the 70-bubble cap`)

/* ── 点击水波：出现 → 扩散 → 约 1 秒后消失 ─────────────────────────────────── */

const biggestArcIn = (f) => Math.max(0, ...(arcByFrame[f] ?? [0]))
// +4 帧（约 0.07s）时水波半径已到 ~50px；+30 帧（0.5s）应更大；+70 帧（1.17s）已超出
// 1.05s 的寿命，必须消失。阈值 30px 足以把水波和气泡（≤7px）分开。
assert.ok(biggestArcIn(CLICK_AT + 4) > 30, `点击后应立刻出现水波，实得半径 ${biggestArcIn(CLICK_AT + 4)}`)
assert.ok(
	biggestArcIn(CLICK_AT + 30) > biggestArcIn(CLICK_AT + 4),
	`水波应持续扩散：${biggestArcIn(CLICK_AT + 4)} → ${biggestArcIn(CLICK_AT + 30)}`,
)
assert.ok(biggestArcIn(CLICK_AT + 70) <= 30, `水波应在约 1 秒后消失，实得 ${biggestArcIn(CLICK_AT + 70)}`)

/* ── 惊散：起步速度冲高，约 1 秒后回到巡航速度 ─────────────────────────────── */

/** Median per-frame displacement of one fish: robust against wrap-around jumps. */
function medianSpeed(from, to) {
	const steps = []
	for (let f = from; f < to; f++) {
		const a = posByFrame[f]
		const b = posByFrame[f + 1]
		if (a && b) steps.push(Math.hypot(b.x - a.x, b.y - a.y))
	}
	steps.sort((p, q) => p - q)
	return steps.length === 0 ? 0 : steps[Math.floor(steps.length / 2)]
}
/** Peak per-frame displacement in a window, ignoring wrap-around jumps (>100px). */
function peakSpeed(from, to) {
	const steps = []
	for (let f = from; f < to; f++) {
		const a = posByFrame[f]
		const b = posByFrame[f + 1]
		if (a && b) {
			const d = Math.hypot(b.x - a.x, b.y - a.y)
			if (d < 100) steps.push(d)
		}
	}
	return steps.length === 0 ? 0 : Math.max(...steps)
}
const baseline = medianSpeed(5, CLICK_AT - 1)
const peak = peakSpeed(CLICK_AT + 1, CLICK_AT + 10) // 点击后 0.02–0.17s：冲量峰值
const afterOneSecond = medianSpeed(CLICK_AT + 55, CLICK_AT + 70) // 0.92–1.17s
assert.ok(peak >= 2.2 * baseline, `点击后应明显加速：巡航 ${baseline.toFixed(2)} → 峰值 ${peak.toFixed(2)} px/帧`)
assert.ok(
	afterOneSecond <= 0.5 * peak,
	`约 1 秒后应基本回落：峰值 ${peak.toFixed(2)} → 1 秒后 ${afterOneSecond.toFixed(2)} px/帧`,
)
assert.ok(
	afterOneSecond <= 1.5 * baseline,
	`1 秒后不应仍明显超速：${afterOneSecond.toFixed(2)} vs 巡航 ${baseline.toFixed(2)} px/帧`,
)
cleanup()
assert.equal(frames, MAX_FRAMES + 1, 'cleanup must stop the loop (no further rAF requests)')

/* ── the sidebar toggle and the settings page render ──────────────────────── */

/** Resolve function components one level at a time (the stub does not render). */
function render(node) {
	let current = node
	while (typeof current.type === 'function') current = current.type(current.props ?? {})
	return current
}

for (const wide of [true, false]) {
	const node = byName.get('sidebar.footer.action').component({ wide })
	assert.equal(node.type, 'button')
	assert.equal(node.props['aria-pressed'], true)

	// The toggle must draw the official mark as an icon. An emoji glyph here is a
	// real regression: 🐋 renders dolphin-ish on Apple's emoji font.
	const glyph = render(node.children[0])
	assert.equal(glyph.type, 'svg', 'the toggle icon must be the whale mark SVG, not an emoji')
	assert.equal(glyph.props.viewBox, `0 0 23.16 17.0435`, 'the icon must use the mark viewBox')
	assert.equal(glyph.props.fill, 'currentColor', 'the icon must follow the theme color')
	assert.match(String(render(glyph).children[0].props.d), /^M22\.9168/, 'the icon must use the official mark path')
}

const page = render(byName.get('settings.section').component({ close() {} }))
assert.equal(page.type, 'div')
const titleRow = page.children[0]
assert.equal(titleRow.type, 'div')
assert.equal(render(titleRow.children[0]).type, 'svg', 'the settings title must show the mark too')

console.log(
	'smoke: ok — bundle registers, plugin applies, 3 slots mount, whale loop paints',
	JSON.stringify(calls),
	`| speed 巡航→峰值→1s后: ${baseline.toFixed(2)} → ${peak.toFixed(2)} → ${afterOneSecond.toFixed(2)} px/帧`,
	`| ripple radius @+4f: ${biggestArcIn(CLICK_AT + 4).toFixed(0)}px`,
)
