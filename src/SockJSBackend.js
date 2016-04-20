import { Observable } from 'rx';
import SockJS from 'sockjs-client';

let sock;
let logger;

const OPEN = 1; // should correspond to hidden SockJS.OPEN constant

function getTestUrl(url) {
	let parser = document.createElement('a');
	parser.href = url;
	return parser.protocol + '//' + parser.host + parser.pathname + '/info' + parser.search;
}

function tryConnect(url, success, error, log) {
	sock = new SockJS(url);

	log(3, "SockJSBackend: tryConnect \t readyState: " + sock.readyState);

	sock.onopen = function() {
		log(3, "SockJSBackend: connection opened \t readyState: " + sock.readyState);
		success();
	}

	sock.onclose = function() {
		log(3, "SockJSBackend: connection closed, trying to see if token is still valid \t readyState: " + sock.readyState);

		fetch(getTestUrl(url), {
			method: 'get',
			credentials: 'include'
		}).then((response) => {
			if (response.status === 401) {
				error('Unauthorized');
			} else {
				error('Lost connection');
			}
		}).catch(() => {
			error('Lost connection');
		});
	}

	sock.onerror = function(e) {
		log(3, "SockJSBackend: sockjs error \t readyState: " + sock.readyState);
		error(e);
	}

	window.__rxwstriggerError = error;
}

export default {

	connect(options = {}) {

		const { url, forceFail, onSuccess, onError, log } = options;
		let closing = false;

		logger = log;

		log(3, "SockJSBackend: connect \t readyState: " + (sock ? sock.readyState : -1));

		if (typeof url === 'string' || url instanceof String) {
			tryConnect(url, onSuccess, handleError, log);
		} else {
			url().subscribe(u => tryConnect(u, onSuccess, handleError, log));
		}

		function handleError(error) {
			log(3, "SockJSBackend: Error being handled, already closing: " + closing);
			log(3, "SockJSBackend: Error being handled, error: " + error);

			if (!closing) {
				onError(error);
				closing = true;
				sock.close();
			}
		}
	},

	write(request) {
		logger(5, 'SockJSBackend: writing \t readyState: ' + sock.readyState);
		sock.send(request);
	},

	onMessage(callback) {
		logger(5, 'SockJSBackend: onMessage \t readyState: ' + sock.readyState);
		sock.onmessage = (message) => {
			callback.call(null, message.data);
		}
	},

	close() {
		sock.close();
	}
}

