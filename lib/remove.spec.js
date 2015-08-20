'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _remove = require('./remove');

var _remove2 = _interopRequireDefault(_remove);

var _request = require('./request');

var _testUtils = require('./test-utils');

describe('remove', function () {
	var backend = undefined;

	beforeEach(function () {
		backend = (0, _testUtils.makeMockBackend)();
		(0, _request.setBackend)(backend, 'someUrl');
	});

	it('should make a request', function () {
		(0, _remove2['default'])('wow').subscribe(function () {});

		expect(backend.write).toHaveBeenCalled();
		var request = JSON.parse(backend.write.calls.argsFor(0));

		expect((0, _testUtils.messagesAreEqual)(request, {
			"header": {
				"resource": "remove.wow"
			},
			"body": {}
		})).toBe(true);
	});

	it('should make a request with parameters', function () {
		(0, _remove2['default'])('users', {
			parameters: {
				users: 1234
			}
		}).subscribe(function () {});

		expect(backend.write).toHaveBeenCalled();
		var request = JSON.parse(backend.write.calls.argsFor(0));

		expect((0, _testUtils.messagesAreEqual)(request, {
			"header": {
				"resource": "remove.users",
				"parameters": {
					"users": 1234
				}
			},
			"body": {}
		})).toBe(true);
	});

	it('should make a request with custom headers', function () {
		(0, _remove2['default'])('users', {
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
				"resource": "remove.users",
				"parameters": {
					"users": 1234
				},
				"api-version": "1.2.3",
				authorization: "123234234344"
			},
			"body": {}
		})).toBe(true);
	});

	it('should make a request with nested resource', function () {
		(0, _remove2['default'])('users.posts.comments', {
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
				"resource": "remove.users.posts.comments",
				"parameters": {
					users: 1234,
					posts: 1236,
					comments: 12345
				}
			},
			"body": {}
		})).toBe(true);
	});

	it('should throw when no resource is passed', function () {
		expect(_remove2['default'].bind(null, '')).toThrow();
		expect(_remove2['default'].bind(null, '')).toThrowError('Invalid config');
	});

	it('should throw when params are not passed to a parent resource', function () {
		expect(_remove2['default'].bind(null, 'users.comments')).toThrow();
		expect(_remove2['default'].bind(null, 'users.comments')).toThrowError('Invalid params: param is required for resource users');
	});
});