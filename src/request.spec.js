import makeRequest, { setBackend } from './request';
import rxws from './rxws';

import { makeMockBackend, messagesAreEqual } from './test-utils';

describe('request', () => {

	describe('setup', () => {
		it('should define a backend', () => {
			let backend = makeMockBackend();
			setBackend(backend, 'someUrl');
			expect(backend.onMessage).toHaveBeenCalled();

			expect(backend.connect).toHaveBeenCalled();
			expect(backend.connect).toHaveBeenCalledWith('someUrl');
		});

		it('should return an observable', () => {
			let backend = makeMockBackend();
			setBackend(backend, 'someUrl');
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

			setBackend(backend, 'someUrl');

			expect(backend.connect).toHaveBeenCalled();
			expect(backend.connect).toHaveBeenCalledWith('someUrl');
			expect(subscribeSpy).toHaveBeenCalled();
		});

		it('should attach a correlationId to requests', () => {
			let backend = makeMockBackend();
			setBackend(backend, 'someUrl');

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
			setBackend(backend, 'someUrl', {
				testHeader: 'Bism Allah Irahman Irahim'
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
			setBackend(backend, 'someUrl', {
				testHeader: 'Bism Allah Irahman Irahim'
			});

			rxws({
				method: 'eval',
				resource: 'users'
			}).subscribe(() => {});

			let request = JSON.parse(backend.write.calls.argsFor(0));
			expect(request.header.resource).toBe('eval.users');
		});
	});

	describe('Request responses', () => {
		it('should throw an error if a correlation id has no resolution in the client', () => {
			let backend = makeMockBackend();
			setBackend(backend, 'someUrl');

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
			setBackend(backend, 'someUrl');

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
			setBackend(backend, 'someUrl');

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
			setBackend(backend, 'someUrl');

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
			setBackend(backend, 'someUrl');
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
			setBackend(backend, 'someUrl');
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

});
