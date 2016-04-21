import { isEqual, cloneDeep } from 'lodash';

/* istanbul ignore next */
export function makeMockBackend() {
	let callback;

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
		}
	}

	spyOn(backend, 'write');
	spyOn(backend, 'onMessage').and.callThrough();
	spyOn(backend, 'close');

	return function(options) {
		return {
			subscribe: (next, onError) => {
				next({
					...backend,
					mockServerError: onError
				});
			}
		}
	};
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
