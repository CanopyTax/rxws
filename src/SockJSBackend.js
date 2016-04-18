import { Observable } from 'rx';
import SockJS from 'sockjs-client';

let sock;

const OPEN = 1; // should correspond to hidden SockJS.OPEN constant

function getTestUrl(url) {
	let parser = document.createElement('a');
	parser.href = url;
	return parser.protocol + '//' + parser.host + parser.pathname + '/info' + parser.search;
}

function tryConnect(url, success, error) {
	sock = new SockJS(url);

	sock.onopen = function() {
		success();
	}

	sock.onclose = function() {
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
		error(e);
	}

	window.__rxwstriggerError = error;
}

export default {

	connect(options = {}) {

		const { url, forceFail, onSuccess, onError } = options;
		let closing = false;

		if (typeof url === 'string' || url instanceof String) {
			tryConnect(url, onSuccess, handleError);
		} else {
			url().subscribe(u => tryConnect(u, onSuccess, handleError));
		}

		function handleError(error) {
			if (!closing) {
				onError(error);
				closing = true;
				sock.close();
			}
		}
	},

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
}

