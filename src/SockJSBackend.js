import SockJS from 'sockjs-client';
import { Observable } from 'rx';

function getTestUrl(url) {
	let parser = document.createElement('a');
	parser.href = url;
	return parser.protocol + '//' + parser.host + parser.pathname + '/info' + parser.search;
}

function createSocket(url, backendOptions, callback) {
	callback(new SockJS(url, null, backendOptions));
}

function loadSocket(url, observer, log, sock) {

	log(5, 'SockJS\tconnection attempt\treadyState: ' + sock.readyState);

	window.__rxwstriggerError = handleError;
	let closing = false;

	sock.onopen = function() {
		log(5, 'SockJS\tconnected\treadyState: ' + sock.readyState);

		observer.onNext({
			write(request) {
				log(5, 'SockJS\twrite\treadyState: ' + sock.readyState);
				sock.send(request);
			},

			onMessage(callback) {
				sock.onmessage = (message) => {
					log(5, 'SockJS\tonmessage\treadyState: ' + sock.readyState);
					callback.call(null, message.data);
				}
			},

			close() {
				sock.close();
			}
		});
	}

	sock.onclose = function() {
		log(5, 'SockJS\tclosed\treadyState: ' + sock.readyState);

		fetch(getTestUrl(url), {
			method: 'get',
			credentials: 'include'
		}).then((response) => {
			if (response.status === 401) {
				handleError('Unauthorized');
			} else {
				handleError('Lost connection');
			}
		}).catch(() => {
			handleError('Lost connection');
		});
	}

	sock.onerror = function(e) {
		log(1, 'SockJS\terror\t' + e + '\treadyState: ' + sock.readyState);
		handleError(e);
	}

	function handleError(error) {
		log(3, 'SockJS\thandling error\t' + closing + '\treadyState: ' + sock.readyState);
		if (!closing) {
			closing = true;
			observer.onError(error);
			sock.close();
		}
	}
}

export default function(options) {
	const { url, forceFail, onSuccess, onError, log, backendOptions } = options;

	return Observable.create((observer) => {
		if (typeof url === 'string' || url instanceof String) {
			createSocket(url, backendOptions, loadSocket.bind(null, url, observer, log));
		} else {
			url().subscribe(u => createSocket(u, backendOptions, loadSocket.bind(null, u, observer, log)));
		}
	})
}
