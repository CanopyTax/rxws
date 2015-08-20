'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _rx = require('rx');

exports['default'] = {

	connect: function connect(url, forceFail) {
		return _rx.Observable.create(function (observer) {
			setTimeout(function () {
				if (forceFail) {
					observer.onNext();
				} else {
					observer.onError();
				}
			});
		});
	},

	write: function write(request) {},

	on: function on(event, callback) {},

	close: function close() {}
};
module.exports = exports['default'];