import { Observable } from 'rx';
import SockJS from 'sockjs-client';

let sock;

var hb = null;
const OPEN = 1; // should correspond to hidden SockJS.OPEN constant

function getTestUrl(url) {
	let parser = document.createElement('a');
	parser.href = url;
	return parser.protocol + '//' + parser.host + parser.pathname + '/info' + parser.search;
}

function tryConnect(url, observer) {
	sock = new SockJS(url);

	sock.onopen = function() {
		observer.onNext();
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
		observer.onError(e)
	}

	sock.onheartbeat = function() {
		if (typeof hb !== 'undefined' && hb !== null && sock.readyState === OPEN) {
			sock.send(hb);
		}
	}
}

export default {

	connect(urlGetter, forceFail, options) {
		hb = options.heartbeat;

		return Observable.create((observer) => {

			if (typeof urlGetter === 'string') {
				tryConnect(urlGetter, observer);
			} else {
				urlGetter().subscribe((url) => tryConnect(url, observer));
			}
		})
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

