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
const g = {
	beginPath() {}, bezierCurveTo() { calls.bezierCurveTo++ }, arc() { calls.arc++ },
	closePath() {}, lineTo() {}, moveTo() {}, fill() { calls.fill++ }, stroke() { calls.stroke++ },
	clearRect() { calls.clearRect++ }, restore() {}, rotate() {}, save() {}, scale() {},
	setTransform() {}, translate() {},
	fillStyle: '', globalAlpha: 1, lineWidth: 1, strokeStyle: '',
}

let frames = 0
const win = {
	devicePixelRatio: 2,
	innerWidth: 1200,
	innerHeight: 800,
	addEventListener() {},
	removeEventListener() {},
	requestAnimationFrame(cb) {
		// Synchronous, bounded: the loop must be re-entrant-safe and finite.
		if (frames++ < 24) cb()
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
cleanup()
assert.equal(frames, 25, 'cleanup must stop the loop (no further rAF requests)')

/* ── the sidebar toggle and the settings page render ──────────────────────── */

for (const wide of [true, false]) {
	const node = byName.get('sidebar.footer.action').component({ wide })
	assert.equal(node.type, 'button')
	assert.equal(node.props['aria-pressed'], true)
}
const page = byName.get('settings.section').component({ close() {} })
assert.equal(page.type, 'div')

console.log('smoke: ok — bundle registers, plugin applies, 3 slots mount, whale loop paints', JSON.stringify(calls))
