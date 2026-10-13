import type { INodePropertyOptions } from 'n8n-workflow';

/** The event types an endpoint can subscribe to, as the Extralt API names them. */
export const EVENT_OPTIONS: INodePropertyOptions[] = [
	{
		name: 'Enrichment Completed',
		value: 'enrichment.completed',
		description: 'An Enrichment normalized every Capture of its Run or Import',
	},
	{
		name: 'Enrichment Failed',
		value: 'enrichment.failed',
	},
	{
		name: 'Enrichment Stopped',
		value: 'enrichment.stopped',
	},
	{
		name: 'Import Completed',
		value: 'import.completed',
		description: 'A catalog file was turned into Captures',
	},
	{
		name: 'Import Failed',
		value: 'import.failed',
	},
	{
		name: 'Robot Completed',
		value: 'robot.completed',
		description: 'A Robot finished building and can run',
	},
	{
		name: 'Robot Failed',
		value: 'robot.failed',
	},
	{
		name: 'Run Completed',
		value: 'run.completed',
		description: 'A Run finished extracting its Captures',
	},
	{
		name: 'Run Enrichment Skipped',
		value: 'run.enrichment_skipped',
		description: 'A Run completed but its automatic Enrichment could not start',
	},
	{
		name: 'Run Failed',
		value: 'run.failed',
	},
	{
		name: 'Run Stopped',
		value: 'run.stopped',
	},
];

/** Sent to an endpoint on request, whatever it subscribes to. */
export const TEST_EVENT = 'webhook.test';
