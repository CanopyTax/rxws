import backend from './HTTPBackend';

/* istanbul ignore next */
describe('HTTP Backend', function() {

	let fetch, fetchSpy;

	beforeEach(function() {
		fetchSpy = jasmine.createSpy('fetch spy');
		fetch = function() {
			fetchSpy.apply(null, arguments);
			return new Promise(function(resolve, reject) {});
		}
	});

	it('should setup the backend', function(run) {
		backend({}).subscribe((api) => {
			expect(api.write).toBeDefined();
			expect(api.onMessage).toBeDefined();
			expect(api.close).toBeDefined();
			run();
		});
	});

	it('should setup requests for nested resources', function(run) {
		backend({
			backendOptions: {fetch},
			url: 'https://api-canopytax.com'
		}).subscribe((api) => {

			api.write(JSON.stringify({
				"header": {
					"resource": "patch.accounts.years.formAnswers",
					"parameters": {"accounts": 333, "years": 12, "formAnswers": 9327645},
				},
				"body": {
					"formAnswers": {
						"married": "no",
						"numDepenents": 5
					}
				}
			}));

			expect(fetchSpy).toHaveBeenCalled();
			expect(fetchSpy.calls.argsFor(0)[0]).toBe(
				'https://api-canopytax.com/accounts/333/years/12/formAnswers/9327645'
			);

			const requestOptions = fetchSpy.calls.argsFor(0)[1];

			expect(requestOptions.method).toBe('patch');
			expect(Object.keys(requestOptions.headers).length).toBe(1);
			expect(requestOptions.body).toBe('{"formAnswers":{"married":"no","numDepenents":5}}');

			run();
		});
	});

	it('should setup requests for index requests', function(run) {
		backend({
			backendOptions: {fetch},
			url: 'https://api-canopytax.com'
		}).subscribe((api) => {

			api.write(JSON.stringify({
				"header": {
					"resource": "patch.accounts.years.formAnswers",
					"parameters": {"accounts": 333, "years": 12},
				},
				"body": {
					"formAnswers": {
						"married": "no",
						"numDepenents": 5
					}
				}
			}));

			expect(fetchSpy).toHaveBeenCalled();
			expect(fetchSpy.calls.argsFor(0)[0]).toBe(
				'https://api-canopytax.com/accounts/333/years/12/formAnswers'
			);

			const requestOptions = fetchSpy.calls.argsFor(0)[1];

			expect(requestOptions.method).toBe('patch');
			expect(Object.keys(requestOptions.headers).length).toBe(1);
			expect(requestOptions.body).toBe('{"formAnswers":{"married":"no","numDepenents":5}}');

			run();
		});
	});

	it('should setup request query parameters', function(run) {
		backend({
			backendOptions: {fetch},
			url: 'https://api-canopytax.com'
		}).subscribe((api) => {

			api.write(JSON.stringify({
				"header": {
					"resource": "patch.accounts.years.formAnswers",
					"parameters": {"accounts": 333, "years": 12},
					"queryParameters": {"include": "history"}
				},
				"body": {
					"formAnswers": {
						"married": "no",
						"numDepenents": 5
					}
				}
			}));

			expect(fetchSpy).toHaveBeenCalled();
			expect(fetchSpy.calls.argsFor(0)[0]).toBe(
				'https://api-canopytax.com/accounts/333/years/12/formAnswers?include=history'
			);

			const requestOptions = fetchSpy.calls.argsFor(0)[1];

			expect(requestOptions.method).toBe('patch');
			expect(Object.keys(requestOptions.headers).length).toBe(1);
			expect(requestOptions.body).toBe('{"formAnswers":{"married":"no","numDepenents":5}}');

			run();
		});
	});

	it('should setup request multiple query parameters', function(run) {
		backend({
			backendOptions: {fetch},
			url: 'https://api-canopytax.com'
		}).subscribe((api) => {

			api.write(JSON.stringify({
				"header": {
					"resource": "patch.accounts.years.formAnswers",
					"parameters": {"accounts": 333, "years": 12},
					"queryParameters": {"include": "history", "other": "3"}
				},
				"body": {
					"formAnswers": {
						"married": "no",
						"numDepenents": 5
					}
				}
			}));

			expect(fetchSpy).toHaveBeenCalled();
			expect(fetchSpy.calls.argsFor(0)[0]).toBe(
				'https://api-canopytax.com/accounts/333/years/12/formAnswers?include=history&other=3'
			);

			const requestOptions = fetchSpy.calls.argsFor(0)[1];

			expect(requestOptions.method).toBe('patch');
			expect(Object.keys(requestOptions.headers).length).toBe(1);
			expect(requestOptions.body).toBe('{"formAnswers":{"married":"no","numDepenents":5}}');

			run();
		});
	});

	it('should setup request with custom headers', function(run) {
		backend({
			backendOptions: {fetch},
			url: 'https://api-canopytax.com'
		}).subscribe((api) => {

			api.write(JSON.stringify({
				"header": {
					"resource": "patch.accounts.years.formAnswers",
					"parameters": {"accounts": 333, "years": 12},
					"queryParameters": {"include": "history"},
					"apiVersion": "1.1.5",
					"otherHeader": "here"
				},
				"body": {
					"formAnswers": {
						"married": "no",
						"numDepenents": 5
					}
				}
			}));

			expect(fetchSpy).toHaveBeenCalled();
			expect(fetchSpy.calls.argsFor(0)[0]).toBe(
				'https://api-canopytax.com/accounts/333/years/12/formAnswers?include=history'
			);

			const requestOptions = fetchSpy.calls.argsFor(0)[1];

			expect(requestOptions.method).toBe('patch');
			expect(Object.keys(requestOptions.headers).length).toBe(3);
			expect(requestOptions.headers.apiVersion).toBe('1.1.5');
			expect(requestOptions.headers.otherHeader).toBe('here');
			expect(requestOptions.body).toBe('{"formAnswers":{"married":"no","numDepenents":5}}');

			run();
		});
	});

	it('should not include body for get requests', function(run) {
		backend({
			backendOptions: {fetch},
			url: 'https://api-canopytax.com'
		}).subscribe((api) => {

			api.write(JSON.stringify({
				"header": {
					"resource": "get.accounts.years.formAnswers",
					"parameters": {"accounts": 333, "years": 12},
					"queryParameters": {"include": "history"},
				},
			}));

			expect(fetchSpy).toHaveBeenCalled();
			expect(fetchSpy.calls.argsFor(0)[0]).toBe(
				'https://api-canopytax.com/accounts/333/years/12/formAnswers?include=history'
			);

			const requestOptions = fetchSpy.calls.argsFor(0)[1];

			expect(requestOptions.method).toBe('get');
			expect(requestOptions.body).toBe(null);

			run();
		});
	});

	it('should handle responses', function(run) {
		backend({
			backendOptions: {
				fetch: function() {
					return new Promise(function(resolve, reject) {
						resolve({
							json: () => Promise.resolve({
								khalifa: {
									name: 'Abu Bakr'
								}
							}),
							status: 200
						});
					});
				}
			},
			url: 'https://api-canopytax.com'
		}).subscribe((api) => {

			api.write(JSON.stringify({
				"header": {
					"resource": "get.khalifa",
					"correlationId": "1",
					"parameters": {"khalifa": 1},
				},
			}));

			api.onMessage(function(resp) {
				expect(resp).toBe('{"header":{"correlationId":"1","statusCode":200},"body":{"khalifa":{"name":"Abu Bakr"}}}');
				run();
			});
		});
	});
});
