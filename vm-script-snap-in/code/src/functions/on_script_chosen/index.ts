import { getScript, mergeCatalog } from '../../catalog';
import { clientFromEvent, timelineUpdate } from '../../devrev';
import { inputsFrom, queueScript } from '../../run-task';

export const run = async (events: any[]): Promise<void> => {
  for (const event of events) {
    await handle(event);
  }
};

async function handle(event: any): Promise<void> {
  const actionId = event.payload?.action?.id || event.payload?.action_id;
  const scriptId = event.payload?.action?.value || event.payload?.value;
  const entryId = event.payload?.context?.entry_id;
  const client = clientFromEvent(event);

  if (actionId === 'cancel') {
    if (entryId) {
      await timelineUpdate(client, {
        id: entryId,
        type: 'timeline_comment',
        body: 'Cancelled VM script run.',
        snap_kit_body: { snap_in_id: event.context?.snap_in_id || event.payload?.parent_id, snap_in_action_name: 'choose_vm_script', body: { snaps: [] } },
      });
    }
    return;
  }

  const catalog = mergeCatalog(inputsFrom(event).extraCatalogJson);
  const script = getScript(catalog, scriptId);
  if (!script) {
    await timelineUpdate(client, {
      id: entryId,
      type: 'timeline_comment',
      body: `Unknown script \`${scriptId}\`.`,
    });
    return;
  }

  await queueScript({ event, script, replaceEntryId: entryId });
}

export default run;
