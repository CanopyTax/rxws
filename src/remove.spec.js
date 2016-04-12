import remove from './remove';
import { setBackend, reset } from './request';
import { makeMockBackend, messagesAreEqual } from './test-utils';

/* istanbul ignore next */
describe('remove', () => {
	let backend;

	beforeEach(() => {
		backend = makeMockBackend();
		setBackend({backend: backend, url: 'someUrl'});
	});

	afterEach(() => {
		reset();
	});

	it('should make a request', () => {
		remove('wow').subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "delete.wow"
			},
			"body": {}
		})).toBe(true);
	});

	it('should make a request with parameters', () => {
		remove('users', {
			parameters: {
				users: 1234
			}
		}).subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "delete.users",
				"parameters": {
					"users": 1234
				}
			},
			"body": {}
		})).toBe(true);
	});

	it('should make a request with custom headers', () => {
		remove('users', {
			parameters: {
				users: 1234
			},
			"api-version": "1.2.3",
			authorization: "123234234344"
		}).subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "delete.users",
				"parameters": {
					"users": 1234
				},
				"api-version": "1.2.3",
				authorization: "123234234344"
			},
			"body": {}
		})).toBe(true);
	});

	it('should make a request with nested resource', () => {
		remove('users.posts.comments', {
			parameters: {
				users: 1234,
				posts: 1236,
				comments: 12345
			}
		}).subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "delete.users.posts.comments",
				"parameters": {
					users: 1234,
					posts: 1236,
					comments: 12345
				}
			},
			"body": {}
		})).toBe(true);
	});

	it('should throw when no resource is passed', () => {
		expect(function() { remove('').subscribe(function() {}) }).toThrow();
		expect(function() { remove('').subscribe(function() {}) }).toThrowError('Invalid config');
	})

	it('should throw when params are not passed to a parent resource', () => {
		expect(function() { remove('users.comments').subscribe(function() {}) }).toThrow();
		expect(function() { remove('users.comments').subscribe(function() {}) }).toThrowError('Invalid params: param is required for resource users');
	})

	it('should execute onConnectionError callback', (run) => {
		setBackend({backend: backend, url: 'someUrl', onConnectionError: (error) => {
			expect(error).toBe('Lost connection');
			run();
		}});

		backend.makeConnectionError();
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
			}, 10);
		}});

		remove('wow').subscribe(() => {});

		expect(backend.write.calls.count()).toBe(1);

		backend.makeConnectionError();
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
			}, tries === 1 ? 10 : 2000);
		}});

		remove('wow').subscribe(() => {});
		backend.makeConnectionError();
	});
});
