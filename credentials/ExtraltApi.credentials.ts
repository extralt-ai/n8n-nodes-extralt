import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ExtraltApi implements ICredentialType {
	name = 'extraltApi';

	displayName = 'Extralt API';

	icon: Icon = { light: 'file:extralt.svg', dark: 'file:extralt.dark.svg' };

	documentationUrl =
		'https://github.com/extralt-ai/n8n-nodes-extralt?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'An organization API key, created in the Extralt dashboard under Settings → Organization → API keys',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.extralt.com',
			description: 'Change only to reach a non-production Extralt API',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/webhooks',
		},
	};
}
