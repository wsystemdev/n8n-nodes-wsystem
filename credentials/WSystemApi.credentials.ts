import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WSystemApi implements ICredentialType {
	name = 'wSystemApi';

	displayName = 'W System API';

	icon = 'file:../icons/wsystem.svg' as const;

	documentationUrl = 'https://wsystem.dev/llms.txt';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Optional. Leave empty to use the free tier (20 calls/day per IP). A monthly-plan key raises the quota.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { 'X-API-Key': '={{$credentials.apiKey}}' } },
	};

	test: ICredentialTestRequest = {
		request: { baseURL: 'https://api.wsystem.dev', url: '/billing/plans', method: 'GET' },
	};
}
