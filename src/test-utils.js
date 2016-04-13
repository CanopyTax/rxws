import { Observable } from 'rx';
import { isEqual, cloneDeep } from 'lodash';

/* istanbul ignore next */
export function makeMockBackend() {
	let callback;
	let _makeConnectionError;

	let backend = {
		connect(url) {
			return Observable.create((observer) => {
				observer.onNext();
				_makeConnectionError = function() {
					observer.onError('Lost connection');
				}
			})
		},

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

	spyOn(backend, 'connect').and.callThrough();
	spyOn(backend, 'write');
	spyOn(backend, 'onMessage').and.callThrough();
	spyOn(backend, 'close');
	backend.makeConnectionError = () => _makeConnectionError();

	return backend;
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
