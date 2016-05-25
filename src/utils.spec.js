import { generateRequestObject } from './utils';

/* istanbul ignore next */
describe('utils', () => {
	describe('generateRequestObject', () => {
		it('should include default headers in request', () => {
			const defaultHeaders = { waahid: 1, eethnayn: 2 };

			const request = generateRequestObject(defaultHeaders)({
				resource: 'groups',
				method: 'put',
				parameters: {}
			});

			expect(request.header.waahid).toBe(1);
			expect(request.header.eethnayn).toBe(2);
		});

		it('should generate default headers with callback', () => {
			const defaultHeaders = () => ({ waahid: 1, eethnayn: 2 });

			const request = generateRequestObject(defaultHeaders)({
				resource: 'groups',
				method: 'put',
				parameters: {}
			});

			expect(request.header.waahid).toBe(1);
			expect(request.header.eethnayn).toBe(2);
		});

		it('should throw if no request resource', () => {
			function makeRequest() {
				generateRequestObject({})({method: 'put'})
			}

			expect(makeRequest).toThrowError('Invalid config');
		});

		it('should throw if no request method', () => {
			function makeRequest() {
				generateRequestObject({})({resource: 'put'})
			}

			expect(makeRequest).toThrowError('Invalid config');
		});

		it('should throw if no resourceId given for nested resource parents', () => {
			function makeRequest() {
				generateRequestObject({})({resource: 'groups.forms', method: 'get'})
			}

			expect(makeRequest).toThrowError('Invalid params: param is required for resource groups');
		});

		it('should generate request object with parameters only for parent nested resources', () => {
			const request = generateRequestObject({})({
				resource: 'groups.forms.sections.subSections.blocks.questions',
				method: 'get',
				parameters: {
					groups: 1,
					forms: 2,
					sections: 3,
					subSections: 4,
					blocks: 5
				}
			})

			expect(request.header.resource).toBe('get.groups.forms.sections.subSections.blocks.questions');
		});

		it('should generate request object with parameters for each nested resource', () => {
			const request = generateRequestObject({})({
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
			})

			expect(request.header.resource).toBe('get.groups.forms.sections.subSections.blocks.questions');
		});

		it('should generate request object with extra resource bodies', () => {
			const request = generateRequestObject({})({
				resource: 'groups.forms.sections.subSections.blocks.questions',
				method: 'get',
				parameters: {
					groups: 1,
					forms: 2,
					sections: 3,
					subSections: 4,
					blocks: 5,
					questions: 4
				},
				data: {
					stuff: 1
				},
				extraResources: {
					notifications: {
						template: 'client-invite',
						url: 'https:/./app.canopytax.com'
					},
					invoices: {
						id: 123,
						name: 'your mom'
					}
				}
			})

			expect(request.body.notifications.template).toBe('client-invite');
			expect(request.body.invoices.id).toBe(123);
			expect(request.extraResources).not.toBeDefined();
		});
	});
});
