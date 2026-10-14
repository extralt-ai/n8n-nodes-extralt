import { randomUUID } from 'node:crypto';

import {
	type IDataObject,
	type IHookFunctions,
	type IHttpRequestMethods,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type JsonObject,
	NodeApiError,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { EVENT_OPTIONS } from './events';
import { verifySignature } from './signature';

const CREDENTIALS = 'extraltApi';
const MAX_DESCRIPTION_LENGTH = 200;

/** What the node remembers about the endpoint it registered, in the workflow's static data. */
interface EndpointData {
	webhookId?: string;
	webhookSecret?: string;
}

interface Webhook {
	id: string;
	url: string;
	enabled: boolean;
}

interface Response<T> {
	statusCode: number;
	body: T;
}

async function extraltRequest<T = unknown>(
	ctx: IHookFunctions,
	method: IHttpRequestMethods,
	path: string,
	options: { body?: IDataObject; headers?: IDataObject } = {},
): Promise<Response<T>> {
	const credentials = await ctx.getCredentials<{ baseUrl: string }>(CREDENTIALS);
	const response = (await ctx.helpers.httpRequestWithAuthentication.call(ctx, CREDENTIALS, {
		method,
		baseURL: credentials.baseUrl,
		url: path,
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
		...options,
	})) as Response<T>;
	if (response.statusCode >= 400 && response.statusCode !== 404) {
		const error = (response.body as { error?: { message?: string; request_id?: string } })?.error;
		throw new NodeApiError(ctx.getNode(), (response.body ?? {}) as JsonObject, {
			httpCode: String(response.statusCode),
			message: error?.message ?? `Extralt API returned HTTP ${response.statusCode}`,
			description: error?.request_id ? `Request ID: ${error.request_id}` : undefined,
		});
	}
	return response;
}

export class ExtraltTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Extralt Trigger',
		name: 'extraltTrigger',
		icon: 'file:extralt.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when Extralt finishes a Robot, Run, Enrichment or Import',
		defaults: {
			name: 'Extralt Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: CREDENTIALS,
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['run.completed'],
				options: EVENT_OPTIONS,
				description:
					'The events that start the workflow. Test events sent from the Extralt dashboard always start it.',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node') as EndpointData;
				if (!data.webhookId || !data.webhookSecret) return false;

				const response = await extraltRequest<Webhook>(
					this,
					'GET',
					`/v1/webhooks/${encodeURIComponent(data.webhookId)}`,
				);
				const webhook = response.statusCode === 404 ? undefined : response.body;
				// An endpoint for another URL, or one Extralt disabled after failed
				// deliveries, is replaced rather than reused.
				if (webhook && webhook.url === this.getNodeWebhookUrl('default') && webhook.enabled) {
					return true;
				}

				if (webhook) {
					await extraltRequest(this, 'DELETE', `/v1/webhooks/${encodeURIComponent(webhook.id)}`);
				}
				delete data.webhookId;
				delete data.webhookSecret;
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node') as EndpointData;
				const events = this.getNodeParameter('events') as string[];
				const workflow = this.getWorkflow();
				const description = `n8n: ${workflow.name ?? workflow.id ?? 'workflow'}`.slice(
					0,
					MAX_DESCRIPTION_LENGTH,
				);

				const response = await extraltRequest<{ id: string; secret: string }>(
					this,
					'POST',
					'/v1/webhooks',
					{
						body: { url: this.getNodeWebhookUrl('default'), event_types: events, description },
						headers: { 'Idempotency-Key': randomUUID() },
					},
				);
				if (response.statusCode === 404) {
					throw new NodeApiError(
						this.getNode(),
						{},
						{
							httpCode: '404',
							message: 'This Extralt API does not support webhooks',
						},
					);
				}
				data.webhookId = response.body.id;
				data.webhookSecret = response.body.secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node') as EndpointData;
				if (data.webhookId) {
					// A 404 means the endpoint is already gone, which is the goal.
					await extraltRequest(
						this,
						'DELETE',
						`/v1/webhooks/${encodeURIComponent(data.webhookId)}`,
					);
				}
				delete data.webhookId;
				delete data.webhookSecret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const data = this.getWorkflowStaticData('node') as EndpointData;
		const request = this.getRequestObject();
		const header = (name: string) => {
			const value = request.headers[name];
			return Array.isArray(value) ? value[0] : value;
		};

		const verified =
			data.webhookSecret !== undefined &&
			request.rawBody !== undefined &&
			verifySignature(data.webhookSecret, {
				id: header('webhook-id'),
				timestamp: header('webhook-timestamp'),
				signature: header('webhook-signature'),
				body: request.rawBody,
			});
		if (!verified) {
			// Extralt retries non-2xx responses, so a delivery signed for an
			// endpoint this workflow replaced fails visibly in the dashboard.
			this.getResponseObject().status(401).json({ error: 'Invalid webhook signature' });
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [this.helpers.returnJsonArray(this.getBodyData())],
		};
	}
}
