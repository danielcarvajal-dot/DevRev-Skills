import { CatalogScript, computerCommand, computerTaskBody, mergeCatalog } from './catalog';
import { clientFromEvent, postWebhook, timelineCreate, timelineUpdate } from './devrev';
import { queuedSnapKit } from './snapkit';

export interface SnapInEvent {
  payload?: any;
  context?: any;
  input_data?: any;
  execution_metadata?: any;
}

export function inputsFrom(event: SnapInEvent): {
  repoPath: string;
  pythonBin: string;
  extraCatalogJson: string;
  webhookUrl: string;
  webhookSecret: string;
} {
  const values = event.input_data?.global_values || {};
  const keyrings = event.input_data?.keyrings || {};
  return {
    repoPath: values.vm_repo_path || '.',
    pythonBin: values.python_bin || 'python3',
    extraCatalogJson: values.extra_catalog_json || '',
    webhookUrl: values.computer_webhook_url || '',
    webhookSecret: keyrings.computer_webhook_secret || '',
  };
}

export function sourceObjectId(event: SnapInEvent): string {
  return (
    event.payload?.source_id ||
    event.payload?.context?.parent_core_object_id ||
    event.payload?.work_created?.work?.id ||
    ''
  );
}

export async function queueScript(options: {
  event: SnapInEvent;
  script: CatalogScript;
  extraArgs?: string[];
  replaceEntryId?: string;
}): Promise<void> {
  const inputs = inputsFrom(options.event);
  const command = computerCommand({
    pythonBin: inputs.pythonBin,
    repoPath: inputs.repoPath,
    scriptId: options.script.id,
    extraArgs: options.extraArgs,
    extraCatalogJson: inputs.extraCatalogJson,
  });
  const client = clientFromEvent(options.event);
  const snapInId = options.event.context?.snap_in_id || options.event.payload?.parent_id;
  const objectId = sourceObjectId(options.event);
  const body = {
    object: objectId,
    type: 'timeline_comment',
    body: computerTaskBody({ script: options.script, command }),
    snap_kit_body: queuedSnapKit({ snapInId, script: options.script, command }),
  };

  if (options.replaceEntryId) {
    await timelineUpdate(client, { id: options.replaceEntryId, type: 'timeline_comment', body: body.body, snap_kit_body: body.snap_kit_body });
  } else {
    await timelineCreate(client, body);
  }

  if (inputs.webhookUrl) {
    const result = await postWebhook(
      inputs.webhookUrl,
      {
        script_id: options.script.id,
        command,
        extra_args: options.extraArgs || [],
        object_id: objectId,
        catalog: mergeCatalog(inputs.extraCatalogJson),
      },
      inputs.webhookSecret
    );
    if (!result.ok) {
      await timelineCreate(client, {
        object: objectId,
        type: 'timeline_comment',
        body: `Computer webhook returned HTTP ${result.status}. The timeline task was still posted so Computer can run the command manually.`,
      });
    }
  }
}
