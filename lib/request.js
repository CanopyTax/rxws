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

function generateRequestObject(config) {
	var correlationId = (0, _nodeUuid2['default'])();
	var resourceList = config.resource.split('.');
	// need to add method to resource path

	return {
		header: _extends({}, config.header, {
			resource: config.resource,
			correlationId: correlationId
		}),
		body: _defineProperty({}, resourceList[resourceList.length - 1], correlationId)
	};
}

function sendRequest(request) {
	backend.write(JSON.stringify(request));
}

function handleMessage(message) {
	var response = JSON.parse(message);

	var header = response.header;

	if (header.notification) {
		return handleServerNotification(message);
	}

	var observer = requestMap[header.correlationId];

	if (!observer) console.error('No associated request for the server message ', message);else {
		if (response.header.statusCode !== 200) {
			observer.onError(message.body, message.header);
		} else {
			observer.onNext(message.body, message.header);
		}
	}
}

function handleServerNotification(message) {
	sendRequest({
		header: _extends({}, message.header)
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
	backend = Backend;

	backend.connect(url).subscribe(function (response) {
		isConnected = true;
		sendRequestQueue();
		backend.onMessage(handleMessage);
	}, function (error) {
		console.error('Cannot connect to backend: ', url, error);
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