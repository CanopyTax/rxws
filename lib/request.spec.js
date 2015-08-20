'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _rxws = require('./rxws');

var _rxws2 = _interopRequireDefault(_rxws);

var _testUtils = require('./test-utils');

describe('request', function () {

	it('should define a backend', function () {
		var backend = (0, _testUtils.makeMockBackend)();
		(0, _request.setBackend)(backend, 'someUrl');
		expect(backend.onMessage).toHaveBeenCalled();

		expect(backend.connect).toHaveBeenCalled();
		expect(backend.connect).toHaveBeenCalledWith('someUrl');
	});

	it('should return an observable', function () {
		var backend = (0, _testUtils.makeMockBackend)();
		(0, _request.setBackend)(backend, 'someUrl');
		expect(backend.onMessage).toHaveBeenCalled();

		var observable = (0, _request2['default'])({ resource: 'test', method: 'get' });
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

	it('should attach a correlationId to requests', function () {
		var backend = (0, _testUtils.makeMockBackend)();
		(0, _request.setBackend)(backend, 'someUrl');

		(0, _rxws2['default'])({
			method: 'get',
			resource: 'users'
		}).subscribe(function () {});

		var request = JSON.parse(backend.write.calls.argsFor(0));
		expect(request.header.correlationId).toBeDefined();
		expect(typeof request.header.correlationId).toBe('string');
	});

	describe('server notifications', function () {
		it('should add notification listeners', function (run) {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)(backend, 'someUrl');
			expect(backend.onMessage).toHaveBeenCalled();

			_rxws2['default'].onNotification('farrot').subscribe(function (body, headers) {
				expect(body.eventData.test).toBe(5);
				run();
			});

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"apiVersion": "1.2.1", //major, minor, patch
					"correlationId": "FUFJ-XHJHF-FFFF-RRRR",
					"notification": "farrot"
				},
				"body": {
					"eventData": {
						"test": 5
					}
				}
			}));
		});

		it('should immediately send a acknowlegment message to the server when a message is received', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)(backend, 'someUrl');
			expect(backend.onMessage).toHaveBeenCalled();

			_rxws2['default'].onNotification('farrot').subscribe(function (body, headers) {});

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"apiVersion": "1.2.1", //major, minor, patch
					"correlationId": "FUFJ-XHJHF-FFFF-RRRR",
					"notification": "farrot"
				},
				"body": {
					"eventData": {
						"test": 5
					}
				}
			}));

			expect(backend.write).toHaveBeenCalled();

			var request = JSON.parse(backend.write.calls.argsFor(0));
			expect((0, _testUtils.messagesAreEqual)(request, {
				"header": {
					"apiVersion": "1.2.1", //major, minor, patch
					"correlationId": "FUFJ-XHJHF-FFFF-RRRR",
					"notification": "farrot"
				}
			}, true)).toBe(true);
		});
	});
});