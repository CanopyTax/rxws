import post from './post';
import { setBackend } from './request';
import { makeMockBackend, messagesAreEqual } from './test-utils';

describe('POST', () => {
	let backend;

	beforeEach(() => {
		backend = makeMockBackend();
		setBackend(backend, 'someUrl');
	});

	it('should make a request', () => {
		post('wow', {
			name: 'Ibn Al-Haytham'
		}).subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "post.wow"
			},
			"body": {
				"wow": {
					name: 'Ibn Al-Haytham'
				}
			}
		})).toBe(true);
	});

	it('should make a request with parameters', () => {
		post('users', {
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
				"resource": "post.users",
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
		post('users', {
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
				"resource": "post.users",
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
		post('users.posts.comments', {
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
				"resource": "post.users.posts.comments",
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
		expect(post.bind(null, '')).toThrow();
		expect(post.bind(null, '')).toThrowError('Invalid config');
	})

	it('should throw when params are not passed to a parent resource', () => {
		expect(post.bind(null, 'users.comments')).toThrow();
		expect(post.bind(null, 'users.comments')).toThrowError('Invalid params: param is required for resource users');
	})
});