import patch from './patch';
import { setBackend } from './request';
import { makeMockBackend, messagesAreEqual } from './test-utils';

describe('patch', () => {
	let backend;

	beforeEach(() => {
		backend = makeMockBackend();
		setBackend(backend, 'someUrl');
	});

	it('should make a request', () => {
		patch('wow', {
			name: 'Ibn Al-Haytham'
		}).subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "patch.wow"
			},
			"body": {
				"wow": {
					name: 'Ibn Al-Haytham'
				}
			}
		})).toBe(true);
	});

	it('should make a request with parameters', () => {
		patch('users', {
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
				"resource": "patch.users",
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
		patch('users', {
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
				"resource": "patch.users",
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
		patch('users.posts.comments', {
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
				"resource": "patch.users.posts.comments",
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
		expect(patch.bind(null, '')).toThrow();
		expect(patch.bind(null, '')).toThrowError('Invalid config');
	})

	it('should throw when params are not passed to a parent resource', () => {
		expect(patch.bind(null, 'users.comments')).toThrow();
		expect(patch.bind(null, 'users.comments')).toThrowError('Invalid params: param is required for resource users');
	})
});
