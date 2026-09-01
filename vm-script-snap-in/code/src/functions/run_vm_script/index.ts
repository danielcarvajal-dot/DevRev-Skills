import { getScript, listScriptSummaries, mergeCatalog, parseCommandParameters } from '../../catalog';
import { clientFromEvent, timelineCreate } from '../../devrev';
import { inputsFrom, queueScript, sourceObjectId } from '../../run-task';
import { scriptPickerSnapKit } from '../../snapkit';

const HELP = [
  '**VM Script Runner**',
  '',
  '• `/vm-script` — pick a script',
  '• `/vm-script list` — show the catalog',
  '• `/vm-script run install-printer-driver` — queue the Windows printer demo',
  '• `/vm-script run shutdown-firefox -- --force` — pass extra args through',
  '',
  'Add scripts in `scripts/catalog.json` (or Extra catalog JSON in snap-in config).',
].join('\n');

export const run = async (events: any[]): Promise<void> => {
  for (const event of events) {
    await handle(event);
  }
};

async function handle(event: any): Promise<void> {
  const inputs = inputsFrom(event);
  const catalog = mergeCatalog(inputs.extraCatalogJson);
  const parsed = parseCommandParameters(event.payload?.parameters);
  const client = clientFromEvent(event);
  const objectId = sourceObjectId(event);
  const snapInId = event.context?.snap_in_id;

  if (parsed.action === 'help') {
    await timelineCreate(client, { object: objectId, type: 'timeline_comment', body: HELP });
    return;
  }

  if (parsed.action === 'list') {
    await timelineCreate(client, {
      object: objectId,
      type: 'timeline_comment',
      body: `**VM script catalog**\n\n${listScriptSummaries(catalog)}\n\nRun with \`/vm-script run <id>\`.`,
    });
    return;
  }

  if (parsed.action === 'picker') {
    await timelineCreate(client, {
      object: objectId,
      type: 'timeline_comment',
      body: 'Choose a VM script for Computer to run.',
      snap_kit_body: scriptPickerSnapKit({ snapInId, catalog }),
    });
    return;
  }

  const script = getScript(catalog, parsed.scriptId || '');
  if (!script) {
    await timelineCreate(client, {
      object: objectId,
      type: 'timeline_comment',
      body: `Unknown script \`${parsed.scriptId}\`.\n\n${listScriptSummaries(catalog)}`,
    });
    return;
  }

  await queueScript({ event, script, extraArgs: parsed.extraArgs });
}

export default run;
