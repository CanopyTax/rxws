'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _MockBackend = require('./MockBackend');

var _MockBackend2 = _interopRequireDefault(_MockBackend);

describe('request', function () {

	it('should require defining a backend', function () {
		expect(_request2['default']).toThrowError('Must define a websocket backend');
	});

	it('should define a backend', function () {
		(0, _request.setBackend)(_MockBackend2['default'], 'someUrl');
	});

	it('should return an observable', function () {
		(0, _request.setBackend)(_MockBackend2['default']);
		var observable = (0, _request2['default'])({ resource: '' });
		expect(observable).toBeDefined();
		expect(observable['catch']).toBeDefined();
		expect(observable.forEach).toBeDefined();
		expect(observable.map).toBeDefined();
		expect(observable.reduce).toBeDefined();
	});

	it('should make call to connect to the socket server', function () {
		var subscribeSpy = jasmine.createSpy('subscribe');
		var backend = {
			connect: function connect() {
				return {
					subscribe: subscribeSpy
				};
			}
		};

		spyOn(backend, 'connect').and.callThrough();

		(0, _request.setBackend)(backend, 'someUrl');

		expect(backend.connect).toHaveBeenCalled();
		expect(backend.connect).toHaveBeenCalledWith('someUrl');
		expect(subscribeSpy).toHaveBeenCalled();
	});
});