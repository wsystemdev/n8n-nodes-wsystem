import {
	NodeConnectionTypes,
	type INodeProperties,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

const show = (resource: string, operation: string) => ({
	show: { resource: [resource], operation: [operation] },
});

const op = (
	resource: string,
	options: Array<{
		name: string;
		value: string;
		action: string;
		description: string;
		method: 'GET' | 'POST';
		url: string;
	}>,
// eslint-disable-next-line n8n-nodes-base/node-param-default-missing -- default is set from options[0].value
): INodeProperties => ({
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: [resource] } },
	default: options[0].value,
	options: options.map((o) => ({
		name: o.name,
		value: o.value,
		action: o.action,
		description: o.description,
		routing: { request: { method: o.method, url: o.url } },
	})),
});

const requester = (
	operation: string,
	type: 'query' | 'body',
	resource = 'vat',
): INodeProperties => ({
	displayName: 'Requester VAT Number',
	name: 'requester',
	type: 'string',
	default: '',
	description:
		'Your own EU VAT number, to receive a VIES consultation number (audit proof). Leave empty for the API default.',
	displayOptions: show(resource, operation),
	routing: { send: { type, property: 'requester' } },
});

const threshold = (
	resource: string,
	operation: string,
	type: 'query' | 'body',
): INodeProperties => ({
	displayName: 'Match Threshold',
	name: 'threshold',
	type: 'number',
	default: 85,
	typeOptions: { minValue: 50, maxValue: 100 },
	description: 'Minimum fuzzy-match score (50-100) for a potential sanctions match',
	displayOptions: show(resource, operation),
	routing: { send: { type, property: 'threshold' } },
});

export class WSystem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'W System EU Business Data',
		name: 'wSystem',
		icon: { light: 'file:wsystem.svg', dark: 'file:wsystem.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Validate EU VAT (VIES) and EORI numbers, look up official company registers, screen sanctions lists and run KYB checks',
		defaults: { name: 'W System' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'wSystemApi', required: false }],
		requestDefaults: {
			baseURL: 'https://api.wsystem.dev',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'vat',
				options: [
					{ name: 'Company', value: 'company' },
					{ name: 'EORI', value: 'eori' },
					{ name: 'KYB', value: 'kyb' },
					{ name: 'Sanction', value: 'sanctions' },
					{ name: 'VAT', value: 'vat' },
				],
			},
			op('vat', [
				{
					name: 'Check',
					value: 'check',
					action: 'Check an EU VAT number',
					description: 'Validate one EU VAT number via VIES',
					method: 'GET',
					url: '/verify',
				},
				{
					name: 'Check Batch',
					value: 'batch',
					action: 'Check up to 100 EU VAT numbers',
					description: 'Validate up to 100 EU VAT numbers in one request',
					method: 'POST',
					url: '/verify/batch',
				},
			]),
			op('eori', [
				{
					name: 'Check',
					value: 'check',
					action: 'Check an EU EORI number',
					description: 'Validate an EORI number via the EC EOS service',
					method: 'GET',
					url: '/eori',
				},
			]),
			op('company', [
				{
					name: 'Look Up',
					value: 'lookup',
					action: 'Look up a company in an official register',
					description: 'Search official EU business registers by name or registry number',
					method: 'GET',
					url: '/company',
				},
			]),
			op('sanctions', [
				{
					name: 'Screen',
					value: 'screen',
					action: 'Screen a name against sanctions lists',
					description: 'Fuzzy-screen a person or company against EU, UN, OFAC and UK lists',
					method: 'GET',
					url: '/sanctions/screen',
				},
			]),
			op('kyb', [
				{
					name: 'Check',
					value: 'check',
					action: 'Run a KYB check on a company',
					description: 'VAT + registry + sanctions in one call with a pass/review/fail verdict',
					method: 'POST',
					url: '/kyb/check',
				},
			]),
			{
				displayName: 'VAT Number',
				name: 'vat',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'HU33119856',
				description: 'EU VAT number with country prefix',
				displayOptions: show('vat', 'check'),
				routing: { send: { type: 'query', property: 'vat' } },
			},
			requester('check', 'query'),
			{
				displayName: 'VAT Numbers',
				name: 'vats',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'DE811193231, IE6388047V',
				description: 'Comma-separated list of up to 100 VAT numbers',
				displayOptions: show('vat', 'batch'),
				routing: {
					send: {
						type: 'body',
						property: 'vats',
						value: '={{$value.split(",").map(v => v.trim()).filter(v => v)}}',
					},
				},
			},
			requester('batch', 'body'),
			{
				displayName: 'EORI Number',
				name: 'eori',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'SE5560360793',
				displayOptions: show('eori', 'check'),
				routing: { send: { type: 'query', property: 'eori' } },
			},
			{
				displayName: 'Query',
				name: 'q',
				type: 'string',
				required: true,
				default: '',
				placeholder: '552032534',
				description: 'Company name or registry number',
				displayOptions: show('company', 'lookup'),
				routing: { send: { type: 'query', property: 'q' } },
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				placeholder: 'FR',
				description: 'ISO country code (FR, NO, FI, CZ, PL, EE; others via GLEIF)',
				displayOptions: show('company', 'lookup'),
				routing: { send: { type: 'query', property: 'country' } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Sberbank',
				description: 'Person or company name to screen',
				displayOptions: show('sanctions', 'screen'),
				routing: { send: { type: 'query', property: 'name' } },
			},
			threshold('sanctions', 'screen', 'query'),
			{
				displayName: 'Company',
				name: 'company',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'FR40303265045',
				description: "VAT ID, or 'CC:name or registry ID' (e.g. NO:equinor)",
				displayOptions: show('kyb', 'check'),
				routing: { send: { type: 'body', property: 'company' } },
			},
			requester('check', 'body', 'kyb'),
			threshold('kyb', 'check', 'body'),
		],
	};
}
