import SockJS from 'sockjs-client';
import { Observable } from 'rx';

function getTestUrl(url) {
	let parser = document.createElement('a');
	parser.href = url;
	return parser.protocol + '//' + parser.host + parser.pathname + '/includefo' + parser.search;
}

function createSocket(url, callback) {
	callback(new SockJS(url));
}

function loadSocket(url, observer, sock) {

	sock.onopen = function() {
		observer.onNext({
			write(request) {
				sock.send(request);
			},

			onMessage(callback) {
				sock.onmessage = (message) => {
					callback.call(null, message.data);
				}
			},

			close() {
				sock.close();
			}
		});
	}

	sock.onclose = function() {

		fetch(getTestUrl(url), {
			method: 'get',
			credentials: 'include'
		}).then((response) => {
			if (response.status === 401) {
				observer.onError('Unauthorized');
			} else {
				observer.onError('Lost connection');
			}
		}).catch(() => {
			observer.onError('Lost connection');
		});
	}

	sock.onerror = function(e) {
		observer.onError(e);
	}
}

export default function(options) {
	const { url, forceFail, onSuccess, onError, log } = options;

	return Observable.create((observer) => {

		if (typeof url === 'string' || url instanceof String) {
			createSocket(url, loadSocket.bind(null, url, observer));
		} else {
			url().subscribe(u => createSocket(u, loadSocket.bind(null, url, observer)));
		}

	})
}
