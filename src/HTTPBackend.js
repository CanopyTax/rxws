import { Observable } from 'rx';
// import fetcher from 'fetcher!sofe';

export default function(options) {
	const { url, forceFail, onError, log, backendOptions } = options;
	const { fetch } = backendOptions ? backendOptions : {};

	let messageCallback;

	return Observable.create((observer) => {
		observer.onNext({

			write(request) {
				const parsedRequest = JSON.parse(request);

				makeRequest(url, parsedRequest)
					.then(resp => parseResponse(parsedRequest, resp))
					.then(resp => setTimeout(() => messageCallback(JSON.stringify(resp))))
					.catch(err => messageCallback(unknownError(err, parsedRequest)));
			},

			onMessage(callback) {
				messageCallback = callback;
			},

			close() {
			}
		});
	});

	function parseResponse(request, response) {
		return new Promise(function(resolve, reject) {
			let headers = { ...request.header };
			delete headers.resource;
			delete headers.parameters;
			delete headers.queryParameters;

			response.text().then(text => {
				try {
					const json = JSON.parse(text);
					resolve({
						header: { ...headers, statusCode: response.status },
						body: json
					});
				} catch (err) {
					resolve({
						header: { ...headers, statusCode: response.status },
						body: {
							errors: {
								message: text
							}
						}
					})
				}
			}).catch(reject);
		});
	}

	function unknownError(err, request) {
		let headers = { ...request.header };
		delete headers.resource;
		delete headers.parameters;
		delete headers.queryParameters;

		/* Status code 412 means "precondition failed", which is sort of what happened
		 * when the fetch api itself throws an Error.
		 */
		err.header = {...headers, statusCode: 412};
		err.body = {
			errors: {
				message: "Unable to perform http request -- fetch threw a client side error"
			}
		}
		return err;
	}

	function makeRequest(url, request) {
		const resource = request.header.resource;
		const params = request.header.parameters || {};
		const query = request.header.queryParameters || {};

		let list = resource.split('.');
		const method = list.shift().toUpperCase();
		const path = list.reduce(toPath.bind(null, params), '');


		let headers = { ...request.header, 'Content-Type': 'application/json' };

		delete headers.resource;
		delete headers.parameters;
		delete headers.queryParameters;
		delete headers.correlationId;

		const body = request.body || '';

		let requestOptions = {
			method,
			headers,
		};

		if (method !== 'GET' && method !== 'HEAD') {
			requestOptions.body = JSON.stringify(body);
		}

		return fetch(`${url}${path}${getQueryString(query)}`, requestOptions)

		function toPath(params, path, res) {
			if (params[res] === undefined || params[res] === null) {
				return `${path}/${res}`
			} else {
				return `${path}/${res}/${params[res]}`
			}
		}

		function getQueryString(query) {
			return Object.keys(query).reduce((queryString, q) => {
				if (!queryString) {
					return `?${q}=${query[q]}`
				} else {
					return `${queryString}&${q}=${query[q]}`
				}
			}, '');
		}
	}
}
