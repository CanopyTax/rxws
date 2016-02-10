import { Observable } from 'rx';
import { defaultMiddleware, getRetryTimer, generateRequestObject } from './utils';

let backend;
let isConnected = false;
let mockRequests = false;
let requestQueue = [];
let requestMap = {};
let notificationMap = {};
let defaultHeaders = {};

let useMiddlewareQueue = [
	defaultMiddleware.response
];

let requestMiddlewareQueue = [
	defaultMiddleware.request
];

function sendRequest(request) {
	executeRequestMiddleware(0, requestMiddlewareQueue, request);
}

function transmitRequest(request) {
	backend.write(JSON.stringify(request));
}

function executeRequestMiddleware(index, requestMiddlewareQueue, request) {
	let middleware = requestMiddlewareQueue[index];
	if (!middleware) throw new Error("Invalid middleware");

	middleware.observer.onNext({
		req: request,
		send: transmitRequest,
		reply: replyImmediately.bind(null, request),
		next: (err) => {
			if (!err) {
				executeRequestMiddleware(++index, requestMiddlewareQueue, request);
			} else {
				throw new Error(err);
			}
		}
	})
}

function replyImmediately(request, response) {
	// Force the response to have the same correlationId as the request
	response.header.correlationId = request.header.correlationId;

	handleMessageWrapper(JSON.stringify(response));
}

function handleMessageWrapper(message) {
	let response = JSON.parse(message);

	executeUseMiddleware(0, useMiddlewareQueue, response, message);
}

function executeUseMiddleware(index, useMiddlewareQueue, response, rawMessage) {
	let middleware = useMiddlewareQueue[index];
	if (!middleware) throw new Error("Invalid middleware");

	middleware.observer.onNext({
		res: response,
		rawMessage: rawMessage,
		reply: handleMessage.bind(null, rawMessage),
		retry: retryRequest.bind(null, rawMessage),
		next: (err) => {
			if (!err) {
				executeUseMiddleware(++index, useMiddlewareQueue, response, rawMessage);
			} else {
				throw new Error(err);
			}
		}
	})
}

function retryRequest(message, response) {
	let observerObj = requestMap[JSON.parse(message).header.correlationId];
	if (!observerObj) throw new Error('No associated request to retry', message);

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
	transmitRequest({
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
	if (useMiddlewareQueue.length > 1) {
		useMiddlewareQueue.splice(0, useMiddlewareQueue.length - 1);
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
		let defaultMiddleware = useMiddlewareQueue.pop();
		useMiddlewareQueue.push(observer);
		useMiddlewareQueue.push(defaultMiddleware);
	});
}

export function requestUse() {
	return Observable.create((observer) => {
		let defaultMiddleware = requestMiddlewareQueue.pop();
		requestMiddlewareQueue.push(observer);
		requestMiddlewareQueue.push(defaultMiddleware);
	});
}

/**
 * If mocking requests, don't require a backend
 */
export function startMockingRequests() {
	mockRequests = true;
}

/**
 * Stop mocking requests.
 */
export function stopMockingRequests() {
	mockRequests = false;
}

/**
 * Reset middleware, backend, and all internal state
 */
export function reset() {
	useMiddlewareQueue = [
		defaultMiddleware.response
	];

	requestMiddlewareQueue = [
		defaultMiddleware.request
	];

	backend = null;
	isConnected = false;
	mockRequests = false;
	requestQueue = [];
	requestMap = {};
	notificationMap = {};
	defaultHeaders = {};
}

export default function makeRequest(config) {
	if (!backend && !mockRequests) throw new Error('Must define a websocket backend');

	return Observable.create((observer) => {
		let request = generateRequestObject(defaultHeaders)(config);

		let timeout = config.timeout || 10000;

		requestMap[request.header.correlationId] = {
			observer, request, timeout: setTimeout(() => {
				observer.onError('Never received server response within timeout ' + timeout);
			}, timeout)
		};

		if (isConnected) {
			sendRequest(request);
		} else {
			requestQueue.push(request);
		}
	})
}

