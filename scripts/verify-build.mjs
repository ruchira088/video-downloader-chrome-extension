#!/usr/bin/env node
// Verifies that ./build is a loadable extension. webpack reporting "compiled successfully" says nothing about
// whether manifest.json and index.html actually point at the files that got emitted — those are copied verbatim,
// so renaming a webpack entry produces a green build and a silently broken extension.
import { readFileSync, statSync } from "node:fs"
import { dirname, join, posix, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const buildDir = process.env.BUILD_TARGET ?? resolve(dirname(fileURLToPath(import.meta.url)), "..", "build")
const packageJson = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "..", "package.json")))

/**
 * Ceilings, not targets. Sized to catch a regression in kind (emitting CommonJS instead of ESM costs webpack its
 * tree-shaking and scope hoisting, which pushed every bundle past 400 KiB) while leaving room for normal growth.
 */
const SIZE_BUDGETS = [
  { pattern: /\.bundle\.js$/, maxBytes: 200 * 1024, label: "JS bundle" },
  { pattern: /\.css$/, maxBytes: 20 * 1024, label: "stylesheet" },
]

const failures = []
const checked = []

const fail = (message) => failures.push(message)

const fileSize = (relativePath) => {
  try {
    const stats = statSync(join(buildDir, relativePath))
    return stats.isFile() ? stats.size : null
  } catch {
    return null
  }
}

const requireFile = (relativePath, referencedBy) => {
  const size = fileSize(relativePath)

  if (size === null) {
    fail(`${referencedBy} references "${relativePath}", which is not in the build output`)
  } else {
    checked.push({ relativePath, size, referencedBy })
  }

  return size
}

/* ------------------------------------------------------------------ manifest */

let manifest
try {
  manifest = JSON.parse(readFileSync(join(buildDir, "manifest.json"), "utf8"))
} catch (error) {
  console.error(`Could not read ${join(buildDir, "manifest.json")}: ${error.message}`)
  console.error("Run `npm run build` first.")
  process.exit(1)
}

if (manifest.manifest_version !== 3) {
  fail(`manifest_version is ${manifest.manifest_version}, expected 3`)
}

// name/version/description are injected from package.json by the CopyPlugin transform in webpack.config.js.
for (const field of ["name", "version", "description"]) {
  if (manifest[field] !== packageJson[field]) {
    fail(`manifest.${field} is "${manifest[field]}" but package.json says "${packageJson[field]}"`)
  }
}

for (const [size, path] of Object.entries(manifest.icons ?? {})) {
  requireFile(path, `manifest.icons["${size}"]`)
}

for (const [index, contentScript] of (manifest.content_scripts ?? []).entries()) {
  for (const path of contentScript.js ?? []) {
    requireFile(path, `manifest.content_scripts[${index}].js`)
  }
  for (const path of contentScript.css ?? []) {
    requireFile(path, `manifest.content_scripts[${index}].css`)
  }
}

if (manifest.background?.service_worker) {
  requireFile(manifest.background.service_worker, "manifest.background.service_worker")
}

if (manifest.action?.default_popup) {
  requireFile(manifest.action.default_popup, "manifest.action.default_popup")
}

for (const [index, entry] of (manifest.web_accessible_resources ?? []).entries()) {
  for (const path of entry.resources ?? []) {
    requireFile(path, `manifest.web_accessible_resources[${index}].resources`)
  }
}

/* --------------------------------------------------------------- popup HTML */

// The popup is plain HTML copied as-is, so its <script src> / <link href> are unchecked by webpack.
if (manifest.action?.default_popup && fileSize(manifest.action.default_popup) !== null) {
  const popupPath = manifest.action.default_popup
  const html = readFileSync(join(buildDir, popupPath), "utf8")
  const references = [...html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)].map(([, reference]) => reference)

  const localReferences = references.filter(
    (reference) => !/^(?:[a-z]+:)?\/\//i.test(reference) && !reference.startsWith("data:") && reference !== "#",
  )

  if (localReferences.length === 0) {
    fail(`${popupPath} references no local assets, which means its script tag is probably gone`)
  }

  for (const reference of localReferences) {
    // Popup references are relative to the HTML file's own directory.
    const resolved = posix.normalize(posix.join(posix.dirname(popupPath), reference.split(/[?#]/)[0]))
    requireFile(resolved, popupPath)
  }
}

/* ------------------------------------------------------------- size budgets */

for (const { relativePath, size } of checked) {
  const budget = SIZE_BUDGETS.find(({ pattern }) => pattern.test(relativePath))

  if (budget !== undefined && size > budget.maxBytes) {
    fail(
      `${relativePath} is ${(size / 1024).toFixed(1)} KiB, over the ${budget.maxBytes / 1024} KiB ` +
        `${budget.label} budget. If this growth is intended, raise the budget in scripts/verify-build.mjs.`,
    )
  }
}

/* -------------------------------------------------------------------- report */

const unique = [...new Map(checked.map((entry) => [entry.relativePath, entry])).values()].sort((a, b) =>
  a.relativePath.localeCompare(b.relativePath),
)

for (const { relativePath, size } of unique) {
  const budget = SIZE_BUDGETS.find(({ pattern }) => pattern.test(relativePath))
  const overBudget = budget !== undefined && size > budget.maxBytes
  const budgetNote = budget === undefined ? "" : ` / ${budget.maxBytes / 1024} KiB budget`

  const status = overBudget ? "OVER" : " ok "
  console.log(`  ${status} ${relativePath.padEnd(28)} ${(size / 1024).toFixed(1).padStart(7)} KiB${budgetNote}`)
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s) with the build output:`)
  for (const failure of failures) {
    console.error(`  - ${failure}`)
  }
  process.exit(1)
}

console.log(`\n${unique.length} referenced files present, all within budget.`)
