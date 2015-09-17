import remove from './remove';
import { setBackend } from './request';
import { makeMockBackend, messagesAreEqual } from './test-utils';

describe('remove', () => {
	let backend;

	beforeEach(() => {
		backend = makeMockBackend();
		setBackend(backend, 'someUrl');
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
		expect(remove.bind(null, '')).toThrow();
		expect(remove.bind(null, '')).toThrowError('Invalid config');
	})

	it('should throw when params are not passed to a parent resource', () => {
		expect(remove.bind(null, 'users.comments')).toThrow();
		expect(remove.bind(null, 'users.comments')).toThrowError('Invalid params: param is required for resource users');
	})
});
