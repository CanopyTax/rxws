'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _post = require('./post');

var _post2 = _interopRequireDefault(_post);

var _request = require('./request');

var _testUtils = require('./test-utils');

describe('POST', function () {
	var backend = undefined;

	beforeEach(function () {
		backend = (0, _testUtils.makeMockBackend)();
		(0, _request.setBackend)(backend, 'someUrl');
	});

	it('should make a request', function () {
		(0, _post2['default'])('wow', {
			name: 'Ibn Al-Haytham'
		}).subscribe(function () {});

		expect(backend.write).toHaveBeenCalled();
		var request = JSON.parse(backend.write.calls.argsFor(0));

		expect((0, _testUtils.messagesAreEqual)(request, {
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

	it('should make a request with parameters', function () {
		(0, _post2['default'])('users', {
			name: 'Ibn Al-Haytham'
		}, {
			parameters: {
				users: 1234
			}
		}).subscribe(function () {});

		expect(backend.write).toHaveBeenCalled();
		var request = JSON.parse(backend.write.calls.argsFor(0));

		expect((0, _testUtils.messagesAreEqual)(request, {
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

	it('should make a request with custom headers', function () {
		(0, _post2['default'])('users', {
			name: 'Ibn Al-Haytham'
		}, {
			parameters: {
				users: 1234
			},
			"api-version": "1.2.3",
			authorization: "123234234344"
		}).subscribe(function () {});

		expect(backend.write).toHaveBeenCalled();
		var request = JSON.parse(backend.write.calls.argsFor(0));

		expect((0, _testUtils.messagesAreEqual)(request, {
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

	it('should make a request with nested resource', function () {
		(0, _post2['default'])('users.posts.comments', {
			name: 'Ibn Al-Haytham'
		}, {
			parameters: {
				users: 1234,
				posts: 1236,
				comments: 12345
			}
		}).subscribe(function () {});

		expect(backend.write).toHaveBeenCalled();
		var request = JSON.parse(backend.write.calls.argsFor(0));

		expect((0, _testUtils.messagesAreEqual)(request, {
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

	it('should throw when no resource is passed', function () {
		expect(_post2['default'].bind(null, '')).toThrow();
		expect(_post2['default'].bind(null, '')).toThrowError('Invalid config');
	});

	it('should throw when params are not passed to a parent resource', function () {
		expect(_post2['default'].bind(null, 'users.comments')).toThrow();
		expect(_post2['default'].bind(null, 'users.comments')).toThrowError('Invalid params: param is required for resource users');
	});
});