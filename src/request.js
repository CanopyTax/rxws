import { Observable } from 'rx';
import uuid from 'node-uuid';

let backend;
let isConnected = false;
let requestQueue = [];
let requestMap = {};
let notificationMap = {};
let defaultHeaders = {};

function getRetryTimer(i) {
	return (Math.log(i) + (Math.random() * (i - 1))) * 1000;
}

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

/**
 * Generate a request object which will be sent to the server.
 * The config needs to have a 'resource' and 'method' attribute.
 */
function generateRequestObject(config) {
	if (!config || !config.resource || !config.method) {
		throw new Error('Invalid config', config);
	}

	sanitizeParams(config.resource, config.parameters);

	let body = config.data;
	delete config.data;

	let correlationId = uuid();
	let resourceList = config.resource.split('.');

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

function sendRequest(request) {
	backend.write(JSON.stringify(request));
}

function handleMessage(message) {
	let response = JSON.parse(message);

	let { header } = response;

	if (header.notification) {
		return handleServerNotification(response);
	}

	let observer = requestMap[header.correlationId];

	if (!observer) throw new Error('No associated request for the server message', message);
	else {
		response.body.__header = response.header;
		if (response.header.statusCode !== 200) {
			observer.onError(response.body);
			observer.onCompleted(response.body);
		} else {
			observer.onNext(response.body);
			observer.onCompleted(response.body);
		}
	}
}

function handleServerNotification(message) {
	sendRequest({
		header: {
			...defaultHeaders,
			...message.header
		}
	});

	let notificationResponse = notificationMap[message.header.notification];

	if (notificationResponse) {
		notificationResponse.observer.onNext(message.body);
	}
}

function sendRequestQueue() {
	while (requestQueue.length) {
		sendRequest(requestQueue.shift());
	}
}

export function setBackend(Backend, url, _defaultHeaders = {}) {
	if (!url) throw new Error('No backend url provided');
	backend = Backend;
	defaultHeaders = _defaultHeaders;

	backend.connect(url).retryWhen(function(attempts) {
		return Observable.range(1, 30000).zip(attempts, function(i) {
			return i;
		}).flatMap(function(i) {
			isConnected = false;
			const seconds = getRetryTimer(i);
			console.log("delay retry by " + seconds + " second(s)");
			return Observable.timer(seconds);
		});
	}).subscribe((response) => {
		isConnected = true;
		sendRequestQueue();
		backend.onMessage(handleMessage);
	});
}

export function onNotification(type) {
	if (notificationMap[type]) return notificationMap[type].observable;

	notificationMap[type] = {
		observable: Observable.create((observer) => {
			notificationMap[type].observer = observer;
		})
	}

	return notificationMap[type].observable;
}

export default function makeRequest(config) {
	if (!backend) throw new Error('Must define a websocket backend');

	let request = generateRequestObject(config);

	return Observable.create((observer) => {
		if (isConnected) {
			sendRequest(request);
		} else {
			requestQueue.push(request);
		}

		requestMap[request.header.correlationId] = observer;
	})
}
