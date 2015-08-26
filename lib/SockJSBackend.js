'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rx = require('rx');

var _sockjsClient = require('sockjs-client');

var _sockjsClient2 = _interopRequireDefault(_sockjsClient);

var sock = undefined;
var connectionTries = 0;

function getReconnectTimer() {
	return Math.log(connectionTries) * (connectionTries - 1) + Math.random() * (connectionTries - 1) * 1000;
}

function tryConnect(url, observer) {
	connectionTries++;

	try {
		sock = new _sockjsClient2['default'](url);
	} catch (error) {
		console.error(error);
		setTimeout(tryConnect.bind(null, url, observer), getReconnectTimer());
	}

	sock.onopen = function () {
		observer.onNext();
	};

	sock.onclose = function () {
		console.warn('Lost connection');
		observer.onError('Lost connection');
		setTimeout(tryConnect.bind(null, url, observer), getReconnectTimer());
	};

	sock.onerror = function (e) {
		console.warn(e);
		observer.onError(e);
		setTimeout(tryConnect.bind(null, url, observer), getReconnectTimer());
	};
}

exports['default'] = {

	connect: function connect(url, forceFail) {
		return _rx.Observable.create(function (observer) {
			tryConnect(url, observer);
		});
	},

	write: function write(request) {
		sock.send(request);
	},

	onMessage: function onMessage(callback) {
		sock.onmessage = function (message) {
			callback.call(null, message.data);
		};
	},

	close: function close() {
		sock.close();
	}
};
module.exports = exports['default'];