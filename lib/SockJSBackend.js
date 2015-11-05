'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rx = require('rx');

var _sockjsClient = require('sockjs-client');

var _sockjsClient2 = _interopRequireDefault(_sockjsClient);

var sock = undefined;

function getTestUrl(url) {
	var parser = document.createElement('a');
	parser.href = url;
	return parser.protocol + '//' + parser.host + parser.pathname + '/info' + parser.search;
}

function tryConnect(url, observer) {
	sock = new _sockjsClient2['default'](url);

	sock.onopen = function () {
		observer.onNext();
	};

	sock.onclose = function () {
		fetch(getTestUrl(url), {
			method: 'get',
			credentials: 'include'
		}).then(function (response) {
			if (response.status === 401) {
				observer.onError('Unauthorized');
			} else {
				observer.onError('Lost connection');
			}
		})['catch'](function () {
			observer.onError('Lost connection');
		});
	};

	sock.onerror = function (e) {
		observer.onError(e);
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