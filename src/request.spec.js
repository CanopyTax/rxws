import makeRequest, { setBackend, reset, startMockingRequests, stopMockingRequests } from './request';
import remove from './remove';
import rxws from './rxws';

import { makeMockBackend, messagesAreEqual } from './test-utils';

/* istanbul ignore next */
describe('request', () => {
	beforeEach(function() {
		reset();
	});

	describe('request middleware', () => {
		beforeEach(function() {
			startMockingRequests();
		});

		afterEach(function() {
			stopMockingRequests();
		});

		it('should immediately respond', () => {

			let transformers = {
				response: ({req, send, reply, next}) => {
					reply({
						body: {
							data: 'dooggy'
						},
						header: {
							...req.header,
							statusCode: 200
						}
					});
				}
			}

			spyOn(transformers, 'response').and.callThrough();

			rxws.requestUse().subscribe(transformers.response);

			rxws.get('somedata').subscribe((resp) => {
				expect(resp.data).toBe('dooggy');
			});

			expect(transformers.response).toHaveBeenCalled();
		});

	});

	describe('setup', () => {
		it('should define a backend', () => {
			let objs = { backend: makeMockBackend() };
			spyOn(objs, 'backend').and.callThrough();

			setBackend({backend: objs.backend, url: 'someUrl'});

			objs.backend().subscribe((backend) => {
				expect(backend.onMessage).toHaveBeenCalled();
			});

			expect(objs.backend).toHaveBeenCalled();
			expect(typeof objs.backend.calls.argsFor(0)[0]).toBe('object');
		});

		it('should return an observable', () => {
			let backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});

			let observable = makeRequest({resource: 'test', method: 'get'})
			expect(observable).toBeDefined();
			expect(observable.catch).toBeDefined();
			expect(observable.forEach).toBeDefined();
			expect(observable.map).toBeDefined();
			expect(observable.reduce).toBeDefined();
		});

		it('should make call to connect to the socket server', () => {
			let createSpy = jasmine.createSpy('subscribe');
			let subscribeSpy = jasmine.createSpy('subscribe');
			let backend = function(options) {
				expect(options.url).toBe('someUrl');
				createSpy();
				return {
					subscribe(next) {
						subscribeSpy();
					}
				}
			}

			setBackend({backend: backend, url: 'someUrl'});

			expect(subscribeSpy).toHaveBeenCalled();
			expect(createSpy).toHaveBeenCalled();
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
				}, ({req, err}) => {
					expect(err.__header.statusCode).toBe(404);
					expect(req).toBeTruthy();
					expect(typeof req.header.correlationId).toBe('string');
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

		it('should make mocking a single return value easy for a given end point', () => {
			const returnValue = [{'user1': 'hi'}];
			rxws.mockReturn('contacts', returnValue);

			rxws({
				method: 'get',
				resource: 'email-accounts.contacts',
				parameters: {'email-accounts': 1},
			})
			.pluck('contacts')
			.subscribe(value => {
				expect(value).toEqual(returnValue);
			});

			const returnValue2 = [{'user2': 'hi'}];
			rxws.mockReturn('address', returnValue2);

			rxws({
				method: 'get',
				resource: 'email-accounts.address',
				parameters: {'email-accounts': 1},
			})
			.pluck('address')
			.subscribe(value => {
				expect(value).toEqual(returnValue2);
			});
		});
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

	describe('response middleware', () => {

		it('should execute response transformer', () => {
			let backend = makeMockBackend();

			let transformers = {
				response: ({res, reply, retry}) => {
					reply(res);
				}
			}

			spyOn(transformers, 'response').and.callThrough();

			setBackend({
				backend: backend,
				url: 'someUrl',
				responseTransformer: transformers.response
			});

			rxws.use().subscribe(transformers.response);

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

		it('should route through multiple request handlers', () => {
			let backend = makeMockBackend();

			let transformers = {
				response1: ({res, reply, retry, next}) => {
					next();
				},
				response2: ({res, reply, retry, next}) => {
					next();
				},
				response3: ({res, reply, retry, next}) => {
					next();
				},
				response4: ({res, reply, retry}) => {
					reply(res);
				}
			}

			spyOn(transformers, 'response1').and.callThrough();
			spyOn(transformers, 'response2').and.callThrough();
			spyOn(transformers, 'response3').and.callThrough();
			spyOn(transformers, 'response4').and.callThrough();

			setBackend({
				backend: backend,
				url: 'someUrl',
				responseTransformer: transformers.response
			});

			rxws.use().subscribe(transformers.response1);
			rxws.use().subscribe(transformers.response2);
			rxws.use().subscribe(transformers.response3);
			rxws.use().subscribe(transformers.response4);

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

			expect(transformers.response1).toHaveBeenCalled();
			expect(transformers.response2).toHaveBeenCalled();
			expect(transformers.response3).toHaveBeenCalled();
			expect(transformers.response4).toHaveBeenCalled();
		});

		it('should short circuit middleware', () => {
			let backend = makeMockBackend();

			let transformers = {
				response1: ({res, reply, retry, next}) => {
					next();
				},
				response2: ({res, reply, retry, next}) => {
					reply(res);
				},
				response3: ({res, reply, retry, next}) => {
					next();
				},
				response4: ({res, reply, retry}) => {
					reply(res);
				}
			}

			spyOn(transformers, 'response1').and.callThrough();
			spyOn(transformers, 'response2').and.callThrough();
			spyOn(transformers, 'response3').and.callThrough();
			spyOn(transformers, 'response4').and.callThrough();

			setBackend({
				backend: backend,
				url: 'someUrl',
				responseTransformer: transformers.response
			});

			rxws.use().subscribe(transformers.response1);
			rxws.use().subscribe(transformers.response2);
			rxws.use().subscribe(transformers.response3);
			rxws.use().subscribe(transformers.response4);

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

			expect(transformers.response1).toHaveBeenCalled();
			expect(transformers.response2).toHaveBeenCalled();
			expect(transformers.response3).not.toHaveBeenCalled();
			expect(transformers.response4).not.toHaveBeenCalled();
		});

		it('should retry requests', () => {
			let backend = makeMockBackend();

			let transformers = {
				response: ({res, reply, retry}) => {
					retry();
				}
			}

			setBackend({
				backend: backend,
				url: 'someUrl'
			});

			rxws.use().subscribe(transformers.response);

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

	describe('Connection errors and retries', () => {
		let backend;

		beforeEach(() => {
			reset();
			backend = makeMockBackend();
			setBackend({backend: backend, url: 'someUrl'});
		});

		afterEach(() => {
			reset();
		});

		it('should execute onConnectionError callback', (run) => {
			setBackend({backend: backend, url: 'someUrl', onConnectionError: (error) => {
				expect(error).toBe('Lost connection');
				setTimeout(() => {
					run();
				}, 100);
			}});

			backend.makeConnectionError('Lost connection');
		});

		it('should retry outstanding requests when the connection resets', (run) => {
			setBackend({backend: backend, url: 'someUrl', onConnectionError: (error) => {
				expect(error).toBe('Lost connection');
				setTimeout(() => {
					expect(backend.write.calls.count()).toBe(2);
					expect(messagesAreEqual(
						backend.write.calls.argsFor(0),
						backend.write.calls.argsFor(1),
						true
					)).toBeTruthy();
					run();
				}, 100);
			}});

			remove('wow').subscribe(() => {});

			expect(backend.write.calls.count()).toBe(1);

			backend.makeConnectionError('Lost connection');
		});

		it('should retry outstanding requests only once', (run) => {
			let tries = 0;
			setBackend({backend: backend, url: 'someUrl', onConnectionError: (error) => {
				tries++;

				setTimeout(() => {
					if (tries === 1) {
						expect(backend.write.calls.count()).toBe(2);
						backend.makeConnectionError();
					} else {
						expect(backend.write.calls.count()).toBe(2);
						run();
					}
				}, tries === 1 ? 100 : 200);
			}});

			remove('wow').subscribe(() => {});
			backend.makeConnectionError('Lost connection');
		});

		it('should retry multiple requests', (run) => {

			setBackend({backend: backend, url: 'someUrl', onConnectionError: (error) => {
				expect(error).toBe('Lost connection');
				setTimeout(() => {
					expect(backend.write.calls.count()).toBe(6);
					run();
				}, 100);
			}});

			remove('wow').subscribe(() => {});
			remove('wow').subscribe(() => {});

			expect(backend.write.calls.count()).toBe(2);
			backend.makeConnectionError('Lost connection');

			remove('wow').subscribe(() => {});
			remove('wow').subscribe(() => {});
		});
	});
});
