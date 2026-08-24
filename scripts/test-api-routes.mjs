#!/usr/bin/env node
/* Exercises the three /api routes the way Cloudflare will call them.
 *
 *     node scripts/test-api-routes.mjs          fail-soft paths only, no network
 *     NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem \
 *       node scripts/test-api-routes.mjs --live   also hit the real APIs with .env keys
 *
 * It lives in scripts/ and NOT in sales/functions/ on purpose. sales/ is the Pages project
 * root, and Cloudflare routes files under functions/ as endpoints — a test file sitting there
 * is a public URL waiting to happen. Only _lib/ is safe inside functions/, because
 * underscore-prefixed directories are excluded from routing by convention.
 *
 * The CA bundle is needed for --live ON THIS MACHINE ONLY. TLS is intercepted here and Node's
 * fetch fails with UNABLE_TO_GET_ISSUER_CERT_LOCALLY, which surfaces as a bare "fetch failed"
 * and looks exactly like a dead upstream. Cloudflare's edge has no such problem, so the
 * routes themselves need nothing. Same reason allo-agent/push.sh and the snapshot generators
 * use curl instead.
 *
 * These routes are the only server-side code in the Sales OS, and their most important
 * behaviour is the one hardest to see: what they do when a dependency is missing or slow.
 * A route that throws takes the Launchpad's live row with it; a route that returns a 500
 * turns a stale dashboard into a broken one. Every failure path must come back 200 with
 * ok:false so the page quietly keeps the dated snapshot it already has.
 *
 * Pages Functions are plain ESM with Web-standard Request/Response, so they import and run
 * under Node unchanged. No wrangler needed for this.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const LIVE = process.argv.includes('--live')

const { onRequestGet: allo } = await import('../sales/functions/api/allo.js')
const { onRequestGet: instantly } = await import('../sales/functions/api/instantly.js')
const { onRequestGet: apollo } = await import('../sales/functions/api/apollo.js')

let pass = 0, fail = 0
const ok = (n, c, d = '') => c ? (pass++, console.log(`  ok    ${n}`)) : (fail++, console.error(`  FAIL  ${n}${d ? `\n          ${d}` : ''}`))

const call = async (fn, env, url = 'https://sales.example/api/x') => {
  const res = await fn({ env, request: new Request(url) })
  return { status: res.status, body: await res.json() }
}

console.log('\nUnconfigured: every route must answer 200 ok:false, never throw, never 500')
for (const [name, fn] of [['allo', allo], ['instantly', instantly], ['apollo', apollo]]) {
  try {
    const r = await call(fn, {})
    ok(`${name} returns 200`, r.status === 200, `got ${r.status}`)
    ok(`${name} says not-configured`, r.body.ok === false && r.body.reason === 'not-configured', JSON.stringify(r.body).slice(0, 120))
  } catch (e) {
    ok(`${name} does not throw`, false, String(e).slice(0, 160))
  }
}

console.log('\nBlank and whitespace secrets count as unset, not as a key')
for (const [name, fn, key] of [['allo', allo, 'ALLO_EXPORT_TOKEN'], ['instantly', instantly, 'INSTANTLY_API_KEY'], ['apollo', apollo, 'APOLLO_API_KEY']]) {
  const r = await call(fn, { [key]: '   ' })
  ok(`${name} treats whitespace as unset`, r.body.ok === false && r.body.reason === 'not-configured', JSON.stringify(r.body).slice(0, 120))
}

console.log('\nUnreachable upstream fails soft rather than propagating')
{
  const r = await call(allo, { ALLO_EXPORT_TOKEN: 'x', ALLO_HOOKS_URL: 'https://127.0.0.1:9' })
  ok('allo survives a dead Worker', r.status === 200 && r.body.ok === false, JSON.stringify(r.body).slice(0, 140))
  ok('allo names the reason', ['unreachable', 'timeout', 'upstream-error'].includes(r.body.reason), r.body.reason)
}

console.log('\nA bad key is reported, not thrown')
{
  const r = await call(instantly, { INSTANTLY_API_KEY: 'definitely-not-a-real-key' })
  ok('instantly survives a rejected key', r.status === 200 && r.body.ok === false, JSON.stringify(r.body).slice(0, 140))
  ok('instantly names the reason', ['unauthorized', 'upstream-error', 'timeout'].includes(r.body.reason), r.body.reason)

  const a = await call(apollo, { APOLLO_API_KEY: 'definitely-not-a-real-key' })
  ok('apollo survives a rejected key', a.status === 200, `got ${a.status}`)
  ok('apollo reports keyValid false rather than failing',
    a.body.ok === true ? a.body.keyValid === false : a.body.ok === false,
    JSON.stringify(a.body).slice(0, 140))
}

console.log('\nallo clamps a hostile limit')
{
  const r = await call(allo, { ALLO_EXPORT_TOKEN: 'x', ALLO_HOOKS_URL: 'https://127.0.0.1:9' },
    'https://sales.example/api/allo?limit=999999')
  ok('a huge limit does not throw', r.status === 200 && r.body.ok === false, JSON.stringify(r.body).slice(0, 120))
}

if (LIVE) {
  const env = Object.fromEntries(
    readFileSync(resolve(ROOT, '.env'), 'utf8').split('\n')
      .map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]),
  )

  console.log('\n--live: the real Instantly workspace')
  const i = await call(instantly, { INSTANTLY_API_KEY: env.INSTANTLY_API_KEY })
  ok('instantly returns ok', i.body.ok === true, JSON.stringify(i.body).slice(0, 200))
  if (i.body.ok) {
    ok('source is labelled live', i.body.source === 'live', i.body.source)
    ok('campaign counts look real', i.body.inWorkspace > 0 && i.body.launched >= 0)
    console.log(`        ${i.body.inWorkspace} in workspace · ${i.body.launched} live · ${i.body.totals.sent} sent`)
  }

  console.log('\n--live: the real Apollo key')
  const a = await call(apollo, { APOLLO_API_KEY: env.APOLLO_API_KEY })
  ok('apollo returns ok', a.body.ok === true, JSON.stringify(a.body).slice(0, 200))
  if (a.body.ok) {
    ok('key reports valid', a.body.keyValid === true, JSON.stringify(a.body).slice(0, 160))
    ok('no credit figure is invented', a.body.credits === undefined && a.body.spendsCredits === false)
  }
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
