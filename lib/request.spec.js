'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _rxws = require('./rxws');

var _rxws2 = _interopRequireDefault(_rxws);

var _testUtils = require('./test-utils');

describe('request', function () {

	describe('setup', function () {
		it('should define a backend', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });
			expect(backend.onMessage).toHaveBeenCalled();

			expect(backend.connect).toHaveBeenCalled();
			expect(backend.connect).toHaveBeenCalledWith('someUrl');
		});

		it('should return an observable', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });
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
						retryWhen: function retryWhen() {
							return {
								subscribe: subscribeSpy
							};
						}
					};
				}
			};

			spyOn(backend, 'connect').and.callThrough();

			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });

			expect(backend.connect).toHaveBeenCalled();
			expect(backend.connect).toHaveBeenCalledWith('someUrl');
			expect(subscribeSpy).toHaveBeenCalled();
		});

		it('should attach a correlationId to requests', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });

			(0, _rxws2['default'])({
				method: 'get',
				resource: 'users'
			}).subscribe(function () {});

			var request = JSON.parse(backend.write.calls.argsFor(0));
			expect(request.header.correlationId).toBeDefined();
			expect(typeof request.header.correlationId).toBe('string');
		});

		it('should attach default headers', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({
				backend: backend,
				url: 'someUrl',
				defaultHeaders: {
					testHeader: 'Bism Allah Irahman Irahim'
				}
			});

			(0, _rxws2['default'])({
				method: 'get',
				resource: 'users'
			}).subscribe(function () {});

			var request = JSON.parse(backend.write.calls.argsFor(0));
			expect(request.header.testHeader).toBe('Bism Allah Irahman Irahim');
		});

		it('should accept custom methods', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({
				backend: backend,
				url: 'someUrl',
				defaultHeaders: {
					testHeader: 'Bism Allah Irahman Irahim'
				}
			});

			(0, _rxws2['default'])({
				method: 'eval',
				resource: 'users'
			}).subscribe(function () {});

			var request = JSON.parse(backend.write.calls.argsFor(0));
			expect(request.header.resource).toBe('eval.users');
		});
	});

	describe('Request responses', function () {
		it('should throw an error if a correlation id has no resolution in the client', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });

			(0, _rxws2['default'])({
				method: 'get',
				resource: 'users'
			}).subscribe(function (response) {
				//expect(response).toBe('hi')
			});

			var request = JSON.parse(backend.write.calls.argsFor(0));

			expect(backend.mockServerMessage.bind(null, JSON.stringify({
				"header": {
					"correlationId": 'sdfdsdf',
					"customHeader": 5,
					"statusCode": 200
				},
				"body": {
					"users": [{
						name: 'Ibn Al Haytham'
					}]
				}
			}))).toThrowError('No associated request for the server message');
		});

		it('should resolve a request to the original observer', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });

			(0, _rxws2['default'])({
				method: 'get',
				resource: 'users'
			}).subscribe(function (response) {
				expect(response.users[0].name).toBe('Ibn Al Haytham');
			});

			var request = JSON.parse(backend.write.calls.argsFor(0));

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"correlationId": request.header.correlationId,
					"customHeader": 5,
					"statusCode": 200
				},
				"body": {
					"users": [{
						name: 'Ibn Al Haytham'
					}]
				}
			}));
		});

		it('should attach headers to the response', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });

			(0, _rxws2['default'])({
				method: 'get',
				resource: 'users'
			}).subscribe(function (response) {
				expect(response.__header.statusCode).toBe(200);
			});

			var request = JSON.parse(backend.write.calls.argsFor(0));

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"correlationId": request.header.correlationId,
					"customHeader": 5,
					"statusCode": 200
				},
				"body": {
					"users": [{
						name: 'Ibn Al Haytham'
					}]
				}
			}));
		});

		it('should trigger an error with a non 200 response', function () {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });

			(0, _rxws2['default'])({
				method: 'get',
				resource: 'users'
			}).subscribe(function (response) {
				expect('This should not be called').toBe('But it was');
			}, function (response) {
				expect(response.__header.statusCode).toBe(404);
			});

			var request = JSON.parse(backend.write.calls.argsFor(0));

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"correlationId": request.header.correlationId,
					"customHeader": 5,
					"statusCode": 404
				},
				"body": {
					"users": [{
						name: 'Ibn Al Haytham'
					}]
				}
			}));
		});
	});

	describe('server push notifications', function () {
		it('should add notification listeners', function (run) {
			var backend = (0, _testUtils.makeMockBackend)();
			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });
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
			(0, _request.setBackend)({ backend: backend, url: 'someUrl' });
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

	describe('transformers', function () {
		it('should execute request transformer', function () {
			var backend = (0, _testUtils.makeMockBackend)();

			var transformers = {
				request: function request(req, send) {
					send(req);
				}
			};

			spyOn(transformers, 'request').and.callThrough();

			(0, _request.setBackend)({
				backend: backend,
				url: 'someUrl',
				requestTransformer: transformers.request
			});

			(0, _rxws2['default'])({
				method: 'get',
				resource: 'users'
			}).subscribe(function (response) {});

			expect(transformers.request).toHaveBeenCalled();
		});

		it('should execute response transformer', function () {
			var backend = (0, _testUtils.makeMockBackend)();

			var transformers = {
				response: function response(res, reply, retry) {
					reply(res);
				}
			};

			spyOn(transformers, 'response').and.callThrough();

			(0, _request.setBackend)({
				backend: backend,
				url: 'someUrl',
				responseTransformer: transformers.response
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

			expect(transformers.response).toHaveBeenCalled();
		});

		it('should retry requests', function () {
			var backend = (0, _testUtils.makeMockBackend)();

			var transformers = {
				response: function response(res, reply, retry) {
					retry();
				}
			};

			(0, _request.setBackend)({
				backend: backend,
				url: 'someUrl',
				responseTransformer: transformers.response
			});

			(0, _rxws2['default'])({
				method: 'get',
				resource: 'users'
			}).subscribe(function (response) {
				expect(response.__header.statusCode).toBe(200);
			});

			var request = JSON.parse(backend.write.calls.argsFor(0));

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"correlationId": request.header.correlationId,
					"customHeader": 5,
					"statusCode": 200
				},
				"body": {
					"users": [{
						name: 'Ibn Al Haytham'
					}]
				}
			}));

			var request1 = JSON.parse(backend.write.calls.argsFor(0));
			var request2 = JSON.parse(backend.write.calls.argsFor(1));

			expect(JSON.stringify(request1)).toBe(JSON.stringify(request2));
		});
	});
});