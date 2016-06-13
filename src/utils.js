import uuid from 'simply-uuid';

let __rxwsLogs = [];
const MAX_LOG_LENGTH = 30;

if (typeof window === 'object') {
	window.__rxwsLogs = __rxwsLogs;
}

const debugLevel = (() => {
	let debug = typeof localStorage === 'object' ? localStorage.getItem('rxwsDebug') : '-1';
	return debug ? parseInt(debug, 10) : -1;
})()

function sanitizeParams(resource, params) {
	let resourceElements = resource.split('.');

	if (resourceElements.length > 1 && !params) {
		throw new Error(`Invalid params: param is required for resource ${resourceElements[0]}`);
	}

	resourceElements.forEach((el, i) => {
		if (i !== (resourceElements.length - 1)) {
			if (params[el] === undefined || params[el] === null) {
				throw new Error(`Invalid params: param is required for resource ${el}`);
			}
		}
	});
}

export function log(level = 5, message) {
	__rxwsLogs.unshift({
		time: (new Date()).toString(), message
	});

	if (__rxwsLogs.length > MAX_LOG_LENGTH) {
		__rxwsLogs.length = MAX_LOG_LENGTH;
	}

	if (level <= debugLevel) {
		console.log('rxws', new Date(), message);
	}
}

/**
 * Exponentially backoff connect retry according to
 * https://www.awsarchitectureblog.com/2015/03/backoff.html
 */
export function getRetryTimer(i) {
	const CAP = 15000;
	const BASE = 300;

	const temp = Math.min(CAP, BASE * 2 * (i - 1));
	return temp / 2 + (Math.random() * temp);
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

		const body = config.data;
		delete config.data;

		const extraResources = config.extraResources || {};
		delete config.extraResources;

		const correlationId = uuid.generate();
		const resourceList = config.resource.split('.');

		if (config.method === 'remove') config.method = 'delete';
		config.resource = config.method + '.' + config.resource;
		delete config.method;

		return {
			header: {
				...(typeof defaultHeaders === 'function' ? defaultHeaders() : defaultHeaders),
				...config,
				correlationId
			},
			body: {
				...extraResources,
				[resourceList[resourceList.length - 1]]: body
			}
		}
	}
}

export let defaultMiddleware = {
	request: {
		observer: {
			onNext: ({req, send}) => {
				send(req);
			}
		}
	},

	response: {
		observer: {
			onNext: ({res, reply}) => {
				reply(res);
			}
		}
	}
}
