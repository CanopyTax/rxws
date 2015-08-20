'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rx = require('rx');

var _sockjsClient = require('sockjs-client');

var _sockjsClient2 = _interopRequireDefault(_sockjsClient);

var sock = undefined;

exports['default'] = {

	connect: function connect(url, forceFail) {
		return _rx.Observable.create(function (observer) {
			sock = new _sockjsClient2['default'](url);
			sock.onopen = function () {
				observer.onNext();
			};
		});
	},

	write: function write(request) {
		sock.send(request);
	},

	onMessage: function onMessage(callback) {
		sock.onmessage = callback;
	},

	close: function close() {
		sock.close();
	}
};
module.exports = exports['default'];