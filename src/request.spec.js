import makeRequest, { setBackend } from './request';
import rxws from './rxws';

import { makeMockBackend, messagesAreEqual } from './test-utils';

describe('request', () => {

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
					subscribe: subscribeSpy
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

	describe('server notifications', () => {
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
