import { Observable } from 'rx';
import { getRetryTimer, generateRequestObject } from './utils';

let backend;
let isConnected = false;
let requestQueue = [];
let requestMap = {};
let notificationMap = {};
let defaultHeaders = {};

let middlewareQueue = [
	{
		onNext: ({req, reply}) => {
			reply(req);
		}
	}
];

let requestTransformer = function(request, reply) {
	reply(request);
};

function sendRequest(request) {
	backend.write(JSON.stringify(request));
}

function handleMessageWrapper(message) {
	let request = JSON.parse(message);

	executeMiddleware(0, middlewareQueue, request, message);
}

function executeMiddleware(index, middlewareQueue, request, rawMessage) {
	let middleware = middlewareQueue[index];

	if (!middleware) throw new Error("Invalid middleware");

	middleware.onNext({
		req: request,
		rawMessage: rawMessage,
		reply: handleMessage.bind(null, rawMessage),
		retry: retryRequest.bind(null, rawMessage),
		next: (err) => {
			if (!err) {
				executeMiddleware(++index, middlewareQueue, request, rawMessage);
			}
		}
	})
}

function retryRequest(message, response) {
	let observerObj = requestMap[JSON.parse(message).header.correlationId];
	if (!observerObj) throw new Error('No associated request to retry', rawMessage);

	let request = observerObj.request;

	if (isConnected) {
		sendRequest(request);
	} else {
		requestQueue.push(request);
	}
}

function handleMessage(rawMessage, response) {
	let { header } = response;

	if (header.notification) {
		return handleServerNotification(response);
	}

	let observerObj = requestMap[header.correlationId];

	if (!observerObj) throw new Error('No associated request for the server message', rawMessage);
	else {
		let observer = observerObj.observer;
		response.body.__header = response.header;

		clearTimeout(observerObj.timeout);

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

export function setBackend(_options = {}) {
	if (middlewareQueue.length > 1) {
		middlewareQueue.splice(0, middlewareQueue.length - 1);
	}

	let options = {
		defaultHeaders: {},
		..._options
	};

	if (!options.url) throw new Error('No backend url provided');

	backend = options.backend;
	defaultHeaders = options.defaultHeaders;

	backend.connect(options.url).retryWhen(function(attempts) {
		return Observable.range(1, 30000).zip(attempts, function(i, error) {
			if (options.onConnectionError) {
				options.onConnectionError.call(null, error);
			}
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
		backend.onMessage(handleMessageWrapper);
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

export function use() {
	return Observable.create((observer) => {
		let defaultMiddleware = middlewareQueue.pop();
		middlewareQueue.push(observer);
		middlewareQueue.push(defaultMiddleware);
	});
}

export default function makeRequest(config) {
	if (!backend) throw new Error('Must define a websocket backend');

	return Observable.create((observer) => {
		let request = generateRequestObject(defaultHeaders)(config);
		if (isConnected) {
			sendRequest(request);
		} else {
			requestQueue.push(request);
		}

		let timeout = config.timeout || 10000;

		requestMap[request.header.correlationId] = {
			observer, request, timeout: setTimeout(() => {
				observer.onError('Never received server response within timeout ' + timeout);
			}, timeout)
		};
	})
}
