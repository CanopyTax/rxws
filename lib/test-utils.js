'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.makeMockBackend = makeMockBackend;
exports.messagesAreEqual = messagesAreEqual;

var _rx = require('rx');

var _lodash = require('lodash');

function makeMockBackend() {
	var callback = undefined;

	var backend = {
		connect: function connect(url) {
			return _rx.Observable.create(function (observer) {
				observer.onNext();
				observer.onCompleted();
			});
		},

		write: function write(request) {},

		onMessage: function onMessage(_callback) {
			callback = _callback;
		},

		close: function close() {},

		mockServerMessage: function mockServerMessage(message) {
			callback(message);
		}
	};

	spyOn(backend, 'connect').and.callThrough();
	spyOn(backend, 'write');
	spyOn(backend, 'onMessage').and.callThrough();
	spyOn(backend, 'close');

	return backend;
}

function messagesAreEqual(actual, expected, preserveCorrelation) {
	actual = (0, _lodash.cloneDeep)(actual);
	if (!preserveCorrelation) delete actual.header.correlationId;
	var equal = (0, _lodash.isEqual)(actual, expected);

	if (!equal) {
		console.error('EXPECTED: ', expected);
		console.error('ACTUAL: ', actual);
	}

	return equal;
}