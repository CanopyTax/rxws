import uuid from 'node-uuid';

function sanitizeParams(resource, params) {
	let resourceElements = resource.split('.');

	if (resourceElements.length > 1 && !params) {
		throw new Error(`Invalid params: param is required for resource ${resourceElements[0]}`);
	}

	resourceElements.forEach((el, i) => {
		if (i > 0) {
			if (!params[el]) throw new Error(`Invalid params: param is required for resource ${el}`);
		}
	});
}

export function getRetryTimer(i) {
	return (Math.log(i) + (Math.random() * (i - 1))) * 1000;
}

/**
 * Generate a request object which will be sent to the server.
 * The config needs to have a 'resource' and 'method' attribute.
 */
export function generateRequestObject(defaultHeaders) {
	return (config) => {
		if (!config || !config.resource || !config.method) {
			throw new Error('Invalid config', config);
		}

		sanitizeParams(config.resource, config.parameters);

		let body = config.data;
		delete config.data;

		let correlationId = uuid();
		let resourceList = config.resource.split('.');

		if (config.method === 'remove') config.method = 'delete';
		config.resource = config.method + '.' + config.resource;
		delete config.method;

		return {
			header: {
				...defaultHeaders,
				...config,
				correlationId
			},
			body: {
				[resourceList[resourceList.length - 1]]: body
			}
		}
	}
}
