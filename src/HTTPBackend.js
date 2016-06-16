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
					.then((resp) => parseResponse(parsedRequest, resp))
					.then((resp) => messageCallback(JSON.stringify(resp)))
					.catch((err) => { throw err });
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
			response.json().then((json) => {

				let headers = { ...request.header };

				delete headers.resource;
				delete headers.parameters;
				delete headers.queryParameters;

				resolve({
					header: { ...headers, statusCode: response.status },
					body: json
				});
			}).catch((err) => { throw err });
		});
	}

	function makeRequest(url, request) {
		const resource = request.header.resource;
		const params = request.header.parameters || {};
		const query = request.header.queryParameters || {};

		let list = resource.split('.');
		const method = list.shift();
		const path = list.reduce(toPath.bind(null, params), '');


		let headers = { ...request.header, 'Content-Type': 'application/json' };

		delete headers.resource;
		delete headers.parameters;
		delete headers.queryParameters;
		delete headers.correlationId;

		const body = request.body || '';

		return fetch(`${url}${path}${getQueryString(query)}`, {
			method: method.toUpperCase(),
			headers,
			body: (method === 'get' || method === 'head') ? null : JSON.stringify(body)
		})

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
