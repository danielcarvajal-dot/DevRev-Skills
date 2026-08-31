import { Catalog, CatalogScript } from './catalog';

export function scriptPickerSnapKit(options: {
  snapInId: string;
  catalog: Catalog;
  title?: string;
}): Record<string, unknown> {
  const buttons = options.catalog.scripts.map((entry) => ({
    type: 'button',
    action_id: 'run',
    action_type: 'remote',
    style: 'primary',
    value: entry.id,
    text: { type: 'plain_text', text: entry.name },
  }));

  return {
    snap_in_id: options.snapInId,
    snap_in_action_name: 'choose_vm_script',
    body: {
      snaps: [
        {
          type: 'card',
          title: {
            type: 'plain_text',
            text: options.title || 'Run a script on the Computer VM',
          },
          elements: [
            {
              type: 'content',
              elements: [
                {
                  type: 'plain_text',
                  text:
                    'Pick a cataloged script. Computer will run it with ' +
                    '`python3 scripts/run_script.py`. Add more entries in scripts/catalog.json.',
                },
              ],
            },
            {
              type: 'actions',
              direction: 'row',
              justify: 'start',
              elements: [
                ...buttons,
                {
                  type: 'button',
                  action_id: 'cancel',
                  action_type: 'remote',
                  style: 'danger',
                  value: 'cancel',
                  text: { type: 'plain_text', text: 'Cancel' },
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

export function queuedSnapKit(options: {
  snapInId: string;
  script: CatalogScript;
  command: string;
}): Record<string, unknown> {
  return {
    snap_in_id: options.snapInId,
    snap_in_action_name: 'choose_vm_script',
    body: {
      snaps: [
        {
          type: 'card',
          title: {
            type: 'plain_text',
            text: `Queued: ${options.script.name}`,
          },
          elements: [
            {
              type: 'content',
              elements: [
                {
                  type: 'plain_text',
                  text: options.command,
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
