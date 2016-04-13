import put from './put';
import { setBackend, reset } from './request';
import { makeMockBackend, messagesAreEqual } from './test-utils';

/* istanbul ignore next */
describe('put', () => {
	let backend;

	beforeEach(() => {
		backend = makeMockBackend();
		setBackend({backend: backend, url: 'someUrl'});
	});

	afterEach(() => {
		reset();
	});

	it('should make a request', () => {
		put('wow', {
			name: 'Ibn Al-Haytham'
		}).subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "put.wow"
			},
			"body": {
				"wow": {
					name: 'Ibn Al-Haytham'
				}
			}
		})).toBe(true);
	});

	it('should make a request with parameters', () => {
		put('users', {
			name: 'Ibn Al-Haytham'
		}, {
			parameters: {
				users: 1234
			}
		}).subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "put.users",
				"parameters": {
					"users": 1234
				}
			},
			"body": {
				"users": {
					name: 'Ibn Al-Haytham'
				}
			}
		})).toBe(true);
	});

	it('should make a request with custom headers', () => {
		put('users', {
			name: 'Ibn Al-Haytham'
		}, {
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
				"resource": "put.users",
				"parameters": {
					"users": 1234
				},
				"api-version": "1.2.3",
				authorization: "123234234344"
			},
			"body": {
				"users": {
					name: 'Ibn Al-Haytham'
				}
			}
		})).toBe(true);
	});

	it('should make a request with nested resource', () => {
		put('users.posts.comments', {
			name: 'Ibn Al-Haytham'
		}, {
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
				"resource": "put.users.posts.comments",
				"parameters": {
					users: 1234,
					posts: 1236,
					comments: 12345
				}
			},
			"body": {
				"comments": {
					name: 'Ibn Al-Haytham'
				}
			}
		})).toBe(true);
	});

	it('should throw when no resource is passed', () => {
		expect(function() { put('').subscribe(function() {}) }).toThrow();
		expect(function() { put('').subscribe(function() {}) }).toThrowError('Invalid config');
	})

	it('should throw when params are not passed to a parent resource', () => {
		expect(function() { put('users.comments').subscribe(function() {}) }).toThrow();
		expect(function() { put('users.comments').subscribe(function() {}) }).toThrowError('Invalid params: param is required for resource users');
	})
});
