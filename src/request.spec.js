import makeRequest, { setBackend } from './request';
import MockBackend from './MockBackend';

describe('request', () => {

	it('should require defining a backend', () => {
		expect(makeRequest).toThrowError('Must define a websocket backend');
	});

	it('should define a backend', () => {
		setBackend(MockBackend, 'someUrl');
	});

	it('should return an observable', () => {
		setBackend(MockBackend);
		let observable = makeRequest({resource: ''});
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
});
