'use strict';

var _utils = require('./utils');

describe('utils', function () {
	describe('generateRequestObject', function () {
		it('should include default headers in request', function () {
			var defaultHeaders = { waahid: 1, eethnayn: 2 };

			var request = (0, _utils.generateRequestObject)(defaultHeaders)({
				resource: 'groups',
				method: 'put',
				parameters: {}
			});

			expect(request.header.waahid).toBe(1);
			expect(request.header.eethnayn).toBe(2);
		});

		it('should throw if no request resource', function () {
			function makeRequest() {
				(0, _utils.generateRequestObject)({})({ method: 'put' });
			}

			expect(makeRequest).toThrowError('Invalid config');
		});

		it('should throw if no request method', function () {
			function makeRequest() {
				(0, _utils.generateRequestObject)({})({ resource: 'put' });
			}

			expect(makeRequest).toThrowError('Invalid config');
		});

		it('should throw if no resourceId given for nested resource parents', function () {
			function makeRequest() {
				(0, _utils.generateRequestObject)({})({ resource: 'groups.forms', method: 'get' });
			}

			expect(makeRequest).toThrowError('Invalid params: param is required for resource groups');
		});

		it('should generate request object with parameters only for parent nested resources', function () {
			var request = (0, _utils.generateRequestObject)({})({
				resource: 'groups.forms.sections.subSections.blocks.questions',
				method: 'get',
				parameters: {
					groups: 1,
					forms: 2,
					sections: 3,
					subSections: 4,
					blocks: 5
				}
			});

			expect(request.header.resource).toBe('get.groups.forms.sections.subSections.blocks.questions');
		});

		it('should generate request object with parameters for each nested resource', function () {
			var request = (0, _utils.generateRequestObject)({})({
				resource: 'groups.forms.sections.subSections.blocks.questions',
				method: 'get',
				parameters: {
					groups: 1,
					forms: 2,
					sections: 3,
					subSections: 4,
					blocks: 5,
					questions: 4
				}
			});

			expect(request.header.resource).toBe('get.groups.forms.sections.subSections.blocks.questions');
		});
	});
});