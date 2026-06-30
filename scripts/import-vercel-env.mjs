#!/usr/bin/env node
/**
 * Sube variables de deploy/vercel.env a Vercel (requiere Vercel CLI: npm i -g vercel)
 *
 * Uso:
 *   1) copy deploy\vercel.env.example deploy\vercel.env
 *   2) Edita deploy\vercel.env con tus valores reales
 *   3) vercel link   (si no lo hiciste)
 *   4) node scripts/import-vercel-env.mjs
 *      node scripts/import-vercel-env.mjs --env production
 *      node scripts/import-vercel-env.mjs --env preview --dry-run
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { spawnSync } from 'child_process'

const args = process.argv.slice(2)
const envName = args.includes('--env') ? args[args.indexOf('--env') + 1] : 'production'
const dryRun = args.includes('--dry-run')
const file = resolve('deploy/vercel.env')

if (!existsSync(file)) {
  console.error(`No existe ${file}`)
  console.error('Copia deploy/vercel.env.example → deploy/vercel.env y rellena los valores.')
  process.exit(1)
}

function parseEnv(text) {
  const out = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!key) continue
    if (!val || val.includes('REPLACE_ME')) {
      console.warn(`  omitido (vacío o placeholder): ${key}`)
      continue
    }
    out.push({ key, val })
  }
  return out
}

const vars = parseEnv(readFileSync(file, 'utf8'))
if (!vars.length) {
  console.error('No hay variables válidas para importar. Revisa deploy/vercel.env')
  process.exit(1)
}

console.log(`Importando ${vars.length} variables → entorno "${envName}"${dryRun ? ' (dry-run)' : ''}…`)

for (const { key, val } of vars) {
  if (dryRun) {
    console.log(`  ${key}=${val.length > 60 ? val.slice(0, 57) + '…' : val}`)
    continue
  }
  const r = spawnSync(
    'vercel',
    ['env', 'add', key, envName, '--force'],
    {
      input: val,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    },
  )
  if (r.status !== 0) {
    console.error(`  ERROR ${key}:`, r.stderr?.trim() || r.stdout?.trim())
  } else {
    console.log(`  OK ${key}`)
  }
}

if (!dryRun) {
  console.log('\nListo. Redeploy en Vercel para aplicar cambios.')
}
