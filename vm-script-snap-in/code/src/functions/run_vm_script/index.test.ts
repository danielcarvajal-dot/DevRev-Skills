import run from './index';

const posted: Array<{ url: string; body: any }> = [];

describe('run_vm_script', () => {
  beforeEach(() => {
    posted.length = 0;
    (global as any).fetch = async (url: string, init?: RequestInit) => {
      posted.push({ url, body: JSON.parse(String(init?.body || '{}')) });
      return { ok: true, status: 200, text: async () => '{}' } as Response;
    };
  });

  const baseEvent = {
    payload: { source_id: 'don:core:issue/1', parameters: '' },
    context: { snap_in_id: 'don:snap/1', secrets: { service_account_token: 'tok' } },
    execution_metadata: { devrev_endpoint: 'https://api.devrev.ai' },
    input_data: { global_values: {}, keyrings: {} },
  };

  it('posts a picker when invoked with no arguments', async () => {
    await run([{ ...baseEvent }]);
    expect(posted).toHaveLength(1);
    expect(posted[0].body.snap_kit_body.snap_in_action_name).toBe('choose_vm_script');
    const buttons = posted[0].body.snap_kit_body.body.snaps[0].elements[1].elements;
    const ids = buttons.filter((b: any) => b.action_id === 'run').map((b: any) => b.value);
    expect(ids).toEqual(expect.arrayContaining(['install-printer-driver', 'shutdown-firefox', 'hello-vm']));
  });

  it('queues a Computer task for a named script', async () => {
    await run([{ ...baseEvent, payload: { ...baseEvent.payload, parameters: 'run hello-vm' } }]);
    expect(posted[0].body.body).toMatch(/python3 scripts\/run_script.py run hello-vm/);
    expect(posted[0].body.body).toMatch(/Computer VM task/);
  });

  it('lists catalog ids', async () => {
    await run([{ ...baseEvent, payload: { ...baseEvent.payload, parameters: 'list' } }]);
    expect(posted[0].body.body).toMatch(/hello-vm/);
    expect(posted[0].body.body).toMatch(/install-printer-driver/);
  });

  it('rejects unknown script ids with the catalog', async () => {
    await run([{ ...baseEvent, payload: { ...baseEvent.payload, parameters: 'run does-not-exist' } }]);
    expect(posted[0].body.body).toMatch(/Unknown script/);
    expect(posted[0].body.body).toMatch(/hello-vm/);
  });
});
