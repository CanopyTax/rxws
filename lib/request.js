'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.setBackend = setBackend;
exports.onNotification = onNotification;
exports['default'] = makeRequest;

var _rx = require('rx');

var _utils = require('./utils');

var backend = undefined;
var isConnected = false;
var requestQueue = [];
var requestMap = {};
var notificationMap = {};
var defaultHeaders = {};

var requestTransformer = function requestTransformer(request, reply) {
	reply(request);
};

var responseTransformer = function responseTransformer(response, reply, retry) {
	reply(response);
};

function sendRequest(request) {
	backend.write(JSON.stringify(request));
}

function handleMessageWrapper(message) {
	var response = JSON.parse(message);
	response = responseTransformer(response, handleMessage.bind(null, message), retryRequest.bind(null, message));
}

function retryRequest(message, response) {
	var observerObj = requestMap[JSON.parse(message).header.correlationId];
	if (!observerObj) throw new Error('No associated request to retry', rawMessage);

	var request = observerObj.request;

	if (isConnected) {
		sendRequest(request);
	} else {
		requestQueue.push(request);
	}
}

function handleMessage(rawMessage, response) {
	var header = response.header;

	if (header.notification) {
		return handleServerNotification(response);
	}

	var observerObj = requestMap[header.correlationId];

	if (!observerObj) throw new Error('No associated request for the server message', rawMessage);else {
		var observer = observerObj.observer;
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
		header: _extends({}, defaultHeaders, message.header)
	});

	var notificationResponse = notificationMap[message.header.notification];

	if (notificationResponse) {
		notificationResponse.observer.onNext(message.body);
	}
}

function sendRequestQueue() {
	while (requestQueue.length) {
		sendRequest(requestQueue.shift());
	}
}

function setBackend() {
	var _options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	//Backend, url, _defaultHeaders = {}, _requestTransformer = requestTransformer, _responseTransformer = responseTransformer) {
	var options = _extends({
		requestTransformer: requestTransformer, responseTransformer: responseTransformer,
		defaultHeaders: {}
	}, _options);

	if (!options.url) throw new Error('No backend url provided');

	backend = options.backend;
	defaultHeaders = options.defaultHeaders;
	requestTransformer = options.requestTransformer;
	responseTransformer = options.responseTransformer;

	backend.connect(options.url).retryWhen(function (attempts) {
		return _rx.Observable.range(1, 30000).zip(attempts, function (i, error) {
			if (options.onConnectionError) {
				options.onConnectionError.call(null, error);
			}
			return i;
		}).flatMap(function (i) {
			isConnected = false;
			var seconds = (0, _utils.getRetryTimer)(i);
			console.log("delay retry by " + seconds + " second(s)");
			return _rx.Observable.timer(seconds);
		});
	}).subscribe(function (response) {
		isConnected = true;
		sendRequestQueue();
		backend.onMessage(handleMessageWrapper);
	});
}

function onNotification(type) {
	if (notificationMap[type]) return notificationMap[type].observable;

	notificationMap[type] = {
		observable: _rx.Observable.create(function (observer) {
			notificationMap[type].observer = observer;
		})
	};

	return notificationMap[type].observable;
}

function makeRequest(config) {
	if (!backend) throw new Error('Must define a websocket backend');

	return _rx.Observable.create(function (observer) {
		requestTransformer((0, _utils.generateRequestObject)(defaultHeaders)(config), function (request) {
			if (isConnected) {
				sendRequest(request);
			} else {
				requestQueue.push(request);
			}

			var timeout = config.timeout || 10000;

			requestMap[request.header.correlationId] = {
				observer: observer, request: request, timeout: setTimeout(function () {
					observer.onError('Never received server response within timeout ' + timeout);
				}, timeout)
			};
		});
	});
}