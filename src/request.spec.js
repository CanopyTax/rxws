import makeRequest, { setBackend } from './request';
import rxws from './rxws';

import { makeMockBackend, messagesAreEqual } from './test-utils';

describe('request', () => {

	describe('setup', () => {
		it('should define a backend', () => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});
			expect(backend.onMessage).toHaveBeenCalled();

			expect(backend.connect).toHaveBeenCalled();
			expect(backend.connect).toHaveBeenCalledWith('someUrl');
		});

		it('should return an observable', () => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});
			expect(backend.onMessage).toHaveBeenCalled();

			let observable = makeRequest({resource: 'test', method: 'get'})
			expect(observable).toBeDefined();
			expect(observable.catch).toBeDefined();
			expect(observable.forEach).toBeDefined();
			expect(observable.map).toBeDefined();
			expect(observable.reduce).toBeDefined();
		});

		it('should make call to connect to the socket server', () => {
			let subscribeSpy = jasmine.createSpy('subscribe');
			let backend = {
				connect: () => {
					return {
						retryWhen: function() {
							return {
								subscribe: subscribeSpy
							}
						}
					}
				}
			}

			spyOn(backend, 'connect').and.callThrough();

			setBackend({backend: backend, url: 'someUrl'});

			expect(backend.connect).toHaveBeenCalled();
			expect(backend.connect).toHaveBeenCalledWith('someUrl');
			expect(subscribeSpy).toHaveBeenCalled();
		});

		it('should attach a correlationId to requests', () => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe(() => {});

			let request = JSON.parse(backend.write.calls.argsFor(0));
			expect(request.header.correlationId).toBeDefined();
			expect(typeof request.header.correlationId).toBe('string');
		});

		it('should attach default headers', () => {
			let backend = makeMockBackend();
			setBackend({
				backend: backend,
				url: 'someUrl',
				defaultHeaders: {
					testHeader: 'Bism Allah Irahman Irahim'
				}
			});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe(() => {});

			let request = JSON.parse(backend.write.calls.argsFor(0));
			expect(request.header.testHeader).toBe('Bism Allah Irahman Irahim');
		});

		it('should accept custom methods', () => {
			let backend = makeMockBackend();
			setBackend({
				backend: backend,
				url: 'someUrl',
				defaultHeaders: {
					testHeader: 'Bism Allah Irahman Irahim'
				}
			});

			rxws({
				method: 'eval',
				resource: 'users'
			}).subscribe(() => {});

			let request = JSON.parse(backend.write.calls.argsFor(0));
			expect(request.header.resource).toBe('eval.users');
		});
	});

	describe('Timeouts', () => {
		beforeEach(function() {
			jasmine.clock().install();
		});

		afterEach(function() {
			jasmine.clock().uninstall();
		});

		it('should error if no response within a given timeout', (run) => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});

			rxws({
				method: 'get',
				resource: 'users',
				timeout: 100
			}).subscribe((response) => {
				expect('response should never come').toFail();
				run();
			}, (error) => {
				expect(error).toBe('Never received server response within timeout 100');
				run();
			});

			jasmine.clock().tick(101);
		});

		it('should error if no response within default timeout', (run) => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe((response) => {
				expect('response should never come').toFail();
				run();
			}, (error) => {
				expect(error).toBe('Never received server response within timeout 10000');
				run();
			});

			jasmine.clock().tick(10001);
		});

		it('should not error if a response is sent', (run) => {

			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe((response) => {
				expect(response.users[0].name).toBe('Ibn Al Haytham')
			}, (err) => {
				expect(err).toFail()
			});

			let request = JSON.parse(backend.write.calls.argsFor(0));

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"correlationId": request.header.correlationId,
					"customHeader": 5,
					"statusCode": 200
				},
				"body": {
					"users": [
						{
							name: 'Ibn Al Haytham'
						}
					]
				}
			}));

			setTimeout(() => {
				run();
			}, 11000);

			jasmine.clock().tick(11001);
		});
	});

	describe('Request responses', () => {
		it('should throw an error if a correlation id has no resolution in the client', () => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe((response) => {
				//expect(response).toBe('hi')
			});

			let request = JSON.parse(backend.write.calls.argsFor(0));

			expect(backend.mockServerMessage.bind(null, JSON.stringify({
				"header": {
					"correlationId": 'sdfdsdf',
					"customHeader": 5,
					"statusCode": 200
				},
				"body": {
					"users": [
						{
							name: 'Ibn Al Haytham'
						}
					]
				}
			}))).toThrowError('No associated request for the server message');
		})

		it('should resolve a request to the original observer', () => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe((response) => {
				expect(response.users[0].name).toBe('Ibn Al Haytham')
			});

			let request = JSON.parse(backend.write.calls.argsFor(0));

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"correlationId": request.header.correlationId,
					"customHeader": 5,
					"statusCode": 200
				},
				"body": {
					"users": [
						{
							name: 'Ibn Al Haytham'
						}
					]
				}
			}));
		})

		it('should attach headers to the response', () => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe((response) => {
				expect(response.__header.statusCode).toBe(200);
			});

			let request = JSON.parse(backend.write.calls.argsFor(0));

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"correlationId": request.header.correlationId,
					"customHeader": 5,
					"statusCode": 200
				},
				"body": {
					"users": [
						{
							name: 'Ibn Al Haytham'
						}
					]
				}
			}));
		})

		it('should trigger an error with a non 200 response', () => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe((response) => {
					expect('This should not be called').toBe('But it was');
				}, (response) => {
					expect(response.__header.statusCode).toBe(404);
				});

			let request = JSON.parse(backend.write.calls.argsFor(0));

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"correlationId": request.header.correlationId,
					"customHeader": 5,
					"statusCode": 404
				},
				"body": {
					"users": [
						{
							name: 'Ibn Al Haytham'
						}
					]
				}
			}));
		})
	});

	describe('server push notifications', () => {
		it('should add notification listeners', (run) => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});
			expect(backend.onMessage).toHaveBeenCalled();

			rxws.onNotification('farrot')
				.subscribe((body, headers) => {
					expect(body.eventData.test).toBe(5)
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

		it('should immediately send a acknowlegment message to the server when a message is received', () => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});
			expect(backend.onMessage).toHaveBeenCalled();

			rxws.onNotification('farrot')
				.subscribe((body, headers) => {
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

			expect(backend.write).toHaveBeenCalled();

			let request = JSON.parse(backend.write.calls.argsFor(0));
			expect(messagesAreEqual(request, {
				"header": {
					"apiVersion": "1.2.1", //major, minor, patch
					"correlationId": "FUFJ-XHJHF-FFFF-RRRR",
					"notification": "farrot"
				}
			}, true)).toBe(true);
		});
	});

	describe('transformers', () => {
		it('should execute request transformer', () => {
			let backend = makeMockBackend();

			let transformers = {
				request: function(req, send) {
					send(req);
				}
			}

			spyOn(transformers, 'request').and.callThrough();

			setBackend({
				backend: backend,
				url: 'someUrl',
				requestTransformer: transformers.request
			});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe((response) => {});

			expect(transformers.request).toHaveBeenCalled();
		});

		it('should execute response transformer', () => {
			let backend = makeMockBackend();

			let transformers = {
				response: function(res, reply, retry) {
					reply(res);
				}
			}

			spyOn(transformers, 'response').and.callThrough();

			setBackend({
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

		it('should retry requests', () => {
			let backend = makeMockBackend();

			let transformers = {
				response: function(res, reply, retry) {
					retry();
				}
			}

			setBackend({
				backend: backend,
				url: 'someUrl',
				responseTransformer: transformers.response
			});

			rxws({
				method: 'get',
				resource: 'users'
			}).subscribe((response) => {
				expect(response.__header.statusCode).toBe(200);
			});

			let request = JSON.parse(backend.write.calls.argsFor(0));

			backend.mockServerMessage(JSON.stringify({
				"header": {
					"correlationId": request.header.correlationId,
					"customHeader": 5,
					"statusCode": 200
				},
				"body": {
					"users": [
						{
							name: 'Ibn Al Haytham'
						}
					]
				}
			}));

			let request1 = JSON.parse(backend.write.calls.argsFor(0));
			let request2 = JSON.parse(backend.write.calls.argsFor(1));

			expect(JSON.stringify(request1)).toBe(JSON.stringify(request2));
		})
	});
});
