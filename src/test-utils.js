import { isEqual, cloneDeep } from 'lodash';

/* istanbul ignore next */
export function makeMockBackend() {
	let callback;
	let error;

	let backend = {
		write(request) {
		},

		onMessage(_callback) {
			callback = _callback;
		},

		close() {
		},

		mockServerMessage(message) {
			callback(message);
		},

		makeConnectionError(...args) {
			error(...args);
		}
	}

	spyOn(backend, 'write');
	spyOn(backend, 'onMessage').and.callThrough();
	spyOn(backend, 'close');

	function backendConstructor(options) {
		return {
			subscribe: (next, onError) => {
				error = onError;
				next({
					...backend
				});
			}
		}
	}

	backendConstructor.write = backend.write;
	backendConstructor.onMessage = backend.onMessage;
	backendConstructor.close = backend.close;
	backendConstructor.mockServerMessage = backend.mockServerMessage;
	backendConstructor.makeConnectionError = backend.makeConnectionError;

	return backendConstructor;
}

/* istanbul ignore next */
export function messagesAreEqual(actual, expected, preserveCorrelation) {
	actual = cloneDeep(actual);
	if (!preserveCorrelation) delete actual.header.correlationId;
	let equal = isEqual(actual, expected);

	if (!equal) {
		console.error('EXPECTED: ', expected);
		console.error('ACTUAL: ', actual);
	}

	return equal;
}
