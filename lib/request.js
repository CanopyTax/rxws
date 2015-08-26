'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.setBackend = setBackend;
exports.onNotification = onNotification;
exports['default'] = makeRequest;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _rx = require('rx');

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var backend = undefined;
var isConnected = false;
var requestQueue = [];
var requestMap = {};
var notificationMap = {};
var defaultHeaders = {};

function getRetryTimer(i) {
	return Math.log(i) * (i - 1) + Math.random() * (i - 1) * 1000;
}

function sanitizeParams(resource, params) {
	var resourceElements = resource.split('.');

	if (resourceElements.length > 1 && !params) {
		throw new Error('Invalid params: param is required for resource ' + resourceElements[0]);
	}

	resourceElements.forEach(function (el, i) {
		if (i > 0) {
			if (!params[el]) throw new Error('Invalid params: param is required for resource ' + el);
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

	var body = config.data;
	delete config.data;

	var correlationId = (0, _nodeUuid2['default'])();
	var resourceList = config.resource.split('.');

	config.resource = config.method + '.' + config.resource;
	delete config.method;

	return {
		header: _extends({}, defaultHeaders, config, {
			correlationId: correlationId
		}),
		body: _defineProperty({}, resourceList[resourceList.length - 1], body)
	};
}

function sendRequest(request) {
	backend.write(JSON.stringify(request));
}

function handleMessage(message) {
	var response = JSON.parse(message);

	var header = response.header;

	if (header.notification) {
		return handleServerNotification(response);
	}

	var observer = requestMap[header.correlationId];

	if (!observer) throw new Error('No associated request for the server message', message);else {
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

function setBackend(Backend, url) {
	var _defaultHeaders = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	if (!url) throw new Error('No backend url provided');
	backend = Backend;
	defaultHeaders = _defaultHeaders;

	backend.connect(url).retryWhen(function (attempts) {
		return _rx.Observable.range(1, 3).zip(attempts, function (i) {
			return i;
		}).flatMap(function (i) {
			isConnected = false;
			console.log("delay retry by " + i + " second(s)");
			return _rx.Observable.timer(getRetryTimer(i));
		});
	}).subscribe(function (response) {
		isConnected = true;
		sendRequestQueue();
		backend.onMessage(handleMessage);
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

	var request = generateRequestObject(config);

	return _rx.Observable.create(function (observer) {
		if (isConnected) {
			sendRequest(request);
		} else {
			requestQueue.push(request);
		}

		requestMap[request.correlationId] = observer;
	});
}