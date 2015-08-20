import head from './head';
import { setBackend } from './request';
import { makeMockBackend, messagesAreEqual } from './test-utils';

describe('HEAD', () => {
	let backend;

	beforeEach(() => {
		backend = makeMockBackend();
		setBackend(backend, 'someUrl');
	});

	it('should make a request', () => {
		head('wow').subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "head.wow"
			},
			"body": {}
		})).toBe(true);
	});

	it('should make a request with parameters', () => {
		head('users', {
			parameters: {
				users: 1234
			}
		}).subscribe(() => {});

		expect(backend.write).toHaveBeenCalled();
		let request = JSON.parse(backend.write.calls.argsFor(0));

		expect(messagesAreEqual(request, {
			"header": {
				"resource": "head.users",
				"parameters": {
					"users": 1234
				}
			},
			"body": {}
		})).toBe(true);
	});

	it('should make a request with custom headers', () => {
		head('users', {
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
				"resource": "head.users",
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
		head('users.posts.comments', {
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
				"resource": "head.users.posts.comments",
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
		expect(head.bind(null, '')).toThrow();
		expect(head.bind(null, '')).toThrowError('Invalid config');
	})

	it('should throw when params are not passed to a parent resource', () => {
		expect(head.bind(null, 'users.comments')).toThrow();
		expect(head.bind(null, 'users.comments')).toThrowError('Invalid params: param is required for resource users');
	})
});
