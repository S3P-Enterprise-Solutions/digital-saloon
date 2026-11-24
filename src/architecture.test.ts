import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Enforces AGENTS.md layers: routes → pages → components → hooks → data → firebase.ts.
 * Also checks for import cycles and unused source files.
 */
const sourceRoot = path.join(process.cwd(), 'src')
const entryPoint = 'main.tsx'

interface SourceImport {
  target: string
  isTypeOnly: boolean
}

function listSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return listSourceFiles(fullPath)
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')
      ? [path.relative(sourceRoot, fullPath).split(path.sep).join('/')]
      : []
  })
}

function isTestFile(file: string): boolean {
  return /\.test\.tsx?$/.test(file)
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

function resolveImport(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const base = path.posix.join(path.posix.dirname(fromFile), specifier)
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
  return candidates.find((candidate) => allFiles.has(candidate)) ?? null
}

function importsOf(file: string): SourceImport[] {
  const source = withoutComments(fs.readFileSync(path.join(sourceRoot, file), 'utf8'))
  const found: SourceImport[] = []
  const add = (specifier: string, isTypeOnly: boolean): void => {
    const target = resolveImport(file, specifier)
    if (target !== null) found.push({ target, isTypeOnly })
  }
  for (const match of source.matchAll(
    /\b(?:import|export)\s+(type\s+)?[^'";]*?\bfrom\s*['"]([^'"]+)['"]/g,
  ))
    add(match[2], match[1] !== undefined)
  for (const match of source.matchAll(/\bimport\s*['"]([^'"]+)['"]/g)) add(match[1], false)
  for (const match of source.matchAll(/(typeof\s+)?\bimport\(\s*['"]([^'"]+)['"]\s*\)/g))
    add(match[2], match[1] !== undefined)
  return found
}

const allFiles: ReadonlySet<string> = new Set(listSourceFiles(sourceRoot))
const productionFiles = [...allFiles].filter((file) => !isTestFile(file)).sort()
const imports = new Map(productionFiles.map((file) => [file, importsOf(file)]))

function layerOf(file: string): string {
  return file.includes('/') ? file.slice(0, file.indexOf('/')) : file
}

const allowedLayerImports: Readonly<Record<string, readonly string[]>> = {
  'theme.ts': ['brands'],
  'firebase.ts': ['data'],
  auth: ['firebase.ts'],
  i18n: [],
  data: ['firebase.ts', 'i18n', 'brands'],
  brands: ['data', 'i18n', 'components', 'features'],
  features: ['data', 'i18n', 'hooks', 'components'],
  hooks: ['data', 'firebase.ts', 'i18n'],
  components: ['hooks', 'data', 'theme.ts', 'i18n', 'brands'],
  pages: ['components', 'hooks', 'data', 'auth', 'theme.ts', 'i18n', 'brands'],
  routes: [
    'pages',
    'components',
    'hooks',
    'data',
    'auth',
    'firebase.ts',
    'theme.ts',
    'i18n',
    'brands',
    'features',
  ],
  'router.ts': ['routes', 'brands'],
  'main.tsx': ['router.ts', 'routes', 'auth', 'theme.ts', 'i18n', 'brands'],
}

describe('architecture', () => {
  it('every source file belongs to a known layer', () => {
    const unknown = productionFiles.filter((file) => !(layerOf(file) in allowedLayerImports))
    expect(unknown).toEqual([])
  })

  it('layers import only the layers below them', () => {
    const violations = productionFiles.flatMap((file) =>
      (imports.get(file) ?? [])
        .filter((item) => !item.isTypeOnly)
        .map((item) => {
          const fromLayer = layerOf(file)
          const toLayer = layerOf(item.target)
          if (fromLayer === toLayer) return null
          const allowed = allowedLayerImports[fromLayer] ?? []
          return allowed.includes(toLayer)
            ? null
            : `${file} (${fromLayer}) → ${item.target} (${toLayer})`
        })
        .filter((value): value is string => value !== null),
    )
    expect(violations).toEqual([])
  })

  it('has no runtime import cycles', () => {
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const cycles: string[] = []

    const walk = (file: string, stack: string[]): void => {
      if (visited.has(file)) return
      if (visiting.has(file)) {
        const start = stack.indexOf(file)
        cycles.push([...stack.slice(start), file].join(' → '))
        return
      }
      visiting.add(file)
      for (const item of imports.get(file) ?? []) {
        if (!item.isTypeOnly) walk(item.target, [...stack, file])
      }
      visiting.delete(file)
      visited.add(file)
    }

    for (const file of productionFiles) walk(file, [])
    expect(cycles).toEqual([])
  })

  it('every production file is reachable from the entry point', () => {
    const reachable = new Set<string>()
    const walk = (file: string): void => {
      if (reachable.has(file)) return
      reachable.add(file)
      for (const item of imports.get(file) ?? []) walk(item.target)
    }
    walk(entryPoint)
    const unused = productionFiles.filter((file) => !reachable.has(file))
    expect(unused).toEqual([])
  })

  it('shared core does not import concrete brand modules', () => {
    const brandModulePath = /^brands\/(kimm|salon1500)(\/|$)/
    const violations = productionFiles.flatMap((file) => {
      if (file === 'brands/active.ts' || brandModulePath.test(file)) return []
      return (imports.get(file) ?? [])
        .filter((item) => brandModulePath.test(item.target))
        .map((item) => `${file} → ${item.target}`)
    })
    expect(violations).toEqual([])
  })

  it('features do not import brands', () => {
    const violations = productionFiles
      .filter((file) => file.startsWith('features/'))
      .flatMap((file) =>
        (imports.get(file) ?? [])
          .filter((item) => item.target.startsWith('brands/'))
          .map((item) => `${file} → ${item.target}`),
      )
    expect(violations).toEqual([])
  })

  it('brand modules do not import other brand modules', () => {
    const violations = productionFiles.flatMap((file) => {
      const match = /^brands\/(kimm|salon1500)\//.exec(file)
      if (!match) return []
      const own = match[1]
      const other = own === 'kimm' ? 'salon1500' : 'kimm'
      return (imports.get(file) ?? [])
        .filter((item) => item.target.startsWith(`brands/${other}/`))
        .map((item) => `${file} → ${item.target}`)
    })
    expect(violations).toEqual([])
  })

  it('router assembles feature routes via buildFeatureRoutes', () => {
    const routerSource = fs.readFileSync(path.join(sourceRoot, 'router.ts'), 'utf8')
    expect(routerSource).toMatch(/buildFeatureRoutes/)
    expect(routerSource).not.toMatch(/from ['"]\.\/routes\/balayage['"]/)
  })

  it('each brand module satisfies the BrandModule contract', async () => {
    const { kimmModule } = await import('./brands/kimm/module')
    const { salon1500Module } = await import('./brands/salon1500/module')
    for (const module of [kimmModule, salon1500Module]) {
      expect(module).toMatchObject({
        key: expect.any(String),
        features: expect.any(Object),
        profile: expect.objectContaining({ name: expect.any(String) }),
        theme: expect.anything(),
        HomePage: expect.any(Function),
      })
    }
  })

  it('brand-key conditionals only appear in the brand key loader', () => {
    const allowlist = new Set(['brands/brandKey.ts'])
    const pattern =
      /(?:===|!==)\s*['"](?:kimm|salon1500)['"]|['"](?:kimm|salon1500)['"]\s*(?:===|!==)|isSalon1500|brand\.key\s*===/
    const violations = productionFiles.flatMap((file) => {
      if (allowlist.has(file)) return []
      const source = withoutComments(fs.readFileSync(path.join(sourceRoot, file), 'utf8'))
      return pattern.test(source) ? [file] : []
    })
    expect(violations).toEqual([])
  })
})
