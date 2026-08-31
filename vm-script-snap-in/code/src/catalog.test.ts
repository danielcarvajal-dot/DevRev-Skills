import {
  computerCommand,
  getScript,
  mergeCatalog,
  parseCommandParameters,
  parseExtraCatalog,
} from './catalog';

describe('catalog', () => {
  it('loads bundled scripts including printer and firefox', () => {
    const catalog = mergeCatalog();
    expect(getScript(catalog, 'install-printer-driver')?.name).toMatch(/printer/i);
    expect(getScript(catalog, 'shutdown-firefox')?.id).toBe('shutdown-firefox');
    expect(getScript(catalog, 'hello-vm')?.id).toBe('hello-vm');
  });

  it('merges extra catalog JSON so new scripts can be added without a code change', () => {
    const extra = JSON.stringify({
      scripts: [
        {
          id: 'disk-cleanup',
          name: 'Disk cleanup',
          platforms: { linux: { argv: ['bash', 'scripts/disk-cleanup.sh'] } },
        },
      ],
    });
    const catalog = mergeCatalog(extra);
    expect(getScript(catalog, 'disk-cleanup')?.name).toBe('Disk cleanup');
    expect(getScript(catalog, 'hello-vm')).toBeDefined();
  });

  it('rejects duplicate extra ids', () => {
    expect(() =>
      mergeCatalog(JSON.stringify([{ id: 'hello-vm', name: 'dup', platforms: {} }]))
    ).toThrow(/duplicate catalog id/);
  });

  it('parses extra catalog arrays', () => {
    const extra = parseExtraCatalog('[{"id":"x","name":"X","platforms":{}}]');
    expect(extra[0].id).toBe('x');
  });
});

describe('parseCommandParameters', () => {
  it('opens the picker when no args are given', () => {
    expect(parseCommandParameters('')).toEqual({ action: 'picker', extraArgs: [] });
  });

  it('lists the catalog', () => {
    expect(parseCommandParameters('list').action).toBe('list');
  });

  it('runs by id with extra args', () => {
    expect(parseCommandParameters('run shutdown-firefox -- --force')).toEqual({
      action: 'run',
      scriptId: 'shutdown-firefox',
      extraArgs: ['--force'],
    });
  });

  it('treats a bare id as run', () => {
    expect(parseCommandParameters('hello-vm')).toEqual({
      action: 'run',
      scriptId: 'hello-vm',
      extraArgs: [],
    });
  });
});

describe('computerCommand', () => {
  it('builds the python dispatcher Computer should execute', () => {
    expect(
      computerCommand({ pythonBin: 'python3', repoPath: '.', scriptId: 'hello-vm' })
    ).toBe('python3 scripts/run_script.py run hello-vm');
  });

  it('cds into a configured repo path and forwards extra args', () => {
    expect(
      computerCommand({
        pythonBin: 'python3',
        repoPath: '/opt/skills',
        scriptId: 'shutdown-firefox',
        extraArgs: ['--force'],
      })
    ).toBe("cd /opt/skills && python3 scripts/run_script.py run shutdown-firefox -- --force");
  });
});
