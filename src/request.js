import { Observable } from 'rx';
import {
	log,
	defaultMiddleware,
	getRetryTimer,
	generateRequestObject
} from './utils';

let backend;
let isConnected = false;
let mockRequests = false;
let requestQueue = [];
let requestMap = {};
let notificationMap = {};
let defaultHeaders = {};
let connectionTries = 0;

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

	handleMessageWrapper(JSON.stringify(response), request);
}

function handleMessageWrapper(message, request) {
	log(5, "Core received message");

	let response = JSON.parse(message);
	if (!request) {
		request = response && response.header && requestMap[response.header.correlationId] ? requestMap[response.header.correlationId].request : null;
	}

	executeUseMiddleware(0, useMiddlewareQueue, response, message, request);
}

function executeUseMiddleware(index, useMiddlewareQueue, response, rawMessage, request) {
	let middleware = useMiddlewareQueue[index];
	if (!middleware) throw new Error("Invalid middleware");

	middleware.observer.onNext({
		res: response,
		req: request,
		rawMessage: rawMessage,
		reply: handleMessage.bind(null, rawMessage),
		retry: retryRequest.bind(null, rawMessage),
		next: (err) => {
			if (!err) {
				executeUseMiddleware(++index, useMiddlewareQueue, response, rawMessage, request);
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
		const req = observerObj.request;
		response.body.__header = response.header;

		clearTimeout(observerObj.timeout);

		if (response.header.statusCode !== 200) {
			observer.onError({
				err: response.body,
				req,
			});
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
		// setTimeout(() => {
			if (isConnected) {
				sendRequest(requestQueue.shift());
			}
		// });
	}
}

/**
 * Retry all outstanding requests. This is necessary if the websocket connection
 * has been reset. We only want to try it once though.
 */
function retryOutstandingRequests() {

	log(3, "Core retrying outstanding requests, amount: " + Object.keys(requestMap).length);

	// Requests will be re-enqueued below, this prevents them being added twice
	requestQueue.length = 0;

	Object.keys(requestMap).forEach((requestId) => {
		let reqObj = requestMap[requestId];

		if (reqObj.tries === 1) return; // We only want to retry once

		clearTimeout(reqObj.timeout);
		prepareRequest(reqObj.observer, reqObj.request, reqObj.timing, reqObj.tries + 1);
	});
}

function prepareRequest(observer, request, timeout, tries = 0) {

	log(5, "Core preparing request");

	requestMap[request.header.correlationId] = {
		observer, request, tries,
		timing: timeout,
		timeout: setTimeout(() => {
			log(1, "Core never received server response within timeout");

			observer.onError({
				err: 'Never received server response within timeout ' + timeout,
				req: request,
			});
		}, timeout)
	};

	if (isConnected || mockRequests) {
		sendRequest(request);
	} else {
		requestQueue.push(request);
	}
}

function connect(options, onSuccess, onError) {
	log(3, "Core connect attempt");

	backend.connect({
		url: options.url,
		forceFail: null,
		onSuccess, onError, log
	})
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

	connect(options, onSuccess, onError);

	function onSuccess() {
		log(3, "Core connect success");
		retryOutstandingRequests();
		isConnected = true;
		connectionTries = 0;
		sendRequestQueue();
		backend.onMessage(handleMessageWrapper);
	}

	function onError(error) {
		log(3, "Core connect error");
		isConnected = false;
		if (options.onConnectionError) {
			options.onConnectionError.call(null, error);
		}

		connectionTries++;
		log(3, "Core amount of retries " + connectionTries);

		const ms = getRetryTimer(connectionTries);
		log(2, "Core delay retry by " + (ms / 1000) + " second(s)");
		setTimeout(connect.bind(null, options, onSuccess, onError), ms);
	}
}

export function onNotification(type) {
	log(5, "Core recieved notification: " + type);

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
	connectionTries = 0;
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

		prepareRequest(observer, request, timeout);
	})
}
