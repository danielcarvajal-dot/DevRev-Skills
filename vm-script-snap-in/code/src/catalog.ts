/*
 * Catalog helpers shared by snap-in functions and unit tests.
 * Keep src/catalog.json in sync with scripts/catalog.json.
 */

import bundledCatalog from './catalog.json';

export interface PlatformSpec {
  argv: string[];
  default_args?: string[];
  needs_root?: boolean;
}

export interface CatalogScript {
  id: string;
  name: string;
  description?: string;
  platforms: Record<string, PlatformSpec>;
}

export interface Catalog {
  version: number;
  scripts: CatalogScript[];
}

export function parseExtraCatalog(raw: string | undefined | null): CatalogScript[] {
  const text = (raw || '').trim();
  if (!text) {
    return [];
  }
  const parsed = JSON.parse(text) as Catalog | CatalogScript[];
  if (Array.isArray(parsed)) {
    return parsed;
  }
  return parsed.scripts || [];
}

export function mergeCatalog(extraJson?: string | null): Catalog {
  const extra = parseExtraCatalog(extraJson);
  const seen = new Set<string>();
  const scripts: CatalogScript[] = [];
  for (const entry of [...(bundledCatalog.scripts as CatalogScript[]), ...extra]) {
    if (!entry?.id) {
      throw new Error('catalog entry is missing id');
    }
    if (seen.has(entry.id)) {
      throw new Error(`duplicate catalog id: ${entry.id}`);
    }
    seen.add(entry.id);
    scripts.push(entry);
  }
  return { version: bundledCatalog.version, scripts };
}

export function getScript(catalog: Catalog, id: string): CatalogScript | undefined {
  return catalog.scripts.find((entry) => entry.id === id);
}

export function listScriptSummaries(catalog: Catalog): string {
  return catalog.scripts
    .map((entry) => `• \`${entry.id}\` — ${entry.name}${entry.description ? `: ${entry.description}` : ''}`)
    .join('\n');
}

export function computerCommand(options: {
  pythonBin: string;
  repoPath: string;
  scriptId: string;
  extraArgs?: string[];
  extraCatalogJson?: string;
}): string {
  const pythonBin = options.pythonBin || 'python3';
  const repoPath = options.repoPath || '.';
  const parts = [pythonBin, 'scripts/run_script.py'];
  if (options.extraCatalogJson && options.extraCatalogJson.trim()) {
    parts.push('--extra-catalog-json', shellQuote(options.extraCatalogJson.trim()));
  }
  parts.push('run', options.scriptId);
  const extra = options.extraArgs || [];
  if (extra.length) {
    parts.push('--', ...extra.map(shellQuote));
  }
  const command = parts.join(' ');
  if (repoPath === '.' || repoPath === '') {
    return command;
  }
  return `cd ${shellQuote(repoPath)} && ${command}`;
}

export function computerTaskBody(options: {
  script: CatalogScript;
  command: string;
}): string {
  return [
    '**Computer VM task** — run this cataloged script on the VM.',
    '',
    `**Script:** ${options.script.name} (\`${options.script.id}\`)`,
    options.script.description ? `**What it does:** ${options.script.description}` : '',
    '',
    'Computer, execute this from the repo checkout (do not rewrite the command):',
    '',
    '```bash',
    options.command,
    '```',
    '',
    'Then reply with the exit code and the last 30 lines of output.',
    'To add more scripts later, append an entry to `scripts/catalog.json` (or Extra catalog JSON in this snap-in).',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function parseCommandParameters(parameters: string | undefined | null): {
  action: 'picker' | 'list' | 'run' | 'help';
  scriptId?: string;
  extraArgs: string[];
} {
  const tokens = tokenize(parameters || '');
  if (tokens.length === 0) {
    return { action: 'picker', extraArgs: [] };
  }
  const head = tokens[0].toLowerCase();
  if (head === 'list' || head === 'ls') {
    return { action: 'list', extraArgs: [] };
  }
  if (head === 'help' || head === '-h' || head === '--help') {
    return { action: 'help', extraArgs: [] };
  }
  if (head === 'run') {
    if (!tokens[1]) {
      return { action: 'help', extraArgs: [] };
    }
    return { action: 'run', scriptId: tokens[1], extraArgs: stripSeparator(tokens.slice(2)) };
  }
  return { action: 'run', scriptId: tokens[0], extraArgs: stripSeparator(tokens.slice(1)) };
}

function stripSeparator(tokens: string[]): string[] {
  return tokens[0] === '--' ? tokens.slice(1) : tokens;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@+=,-]+$/.test(value)) {
    return value;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
