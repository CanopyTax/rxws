import { Observable } from 'rx';
import SockJS from 'sockjs-client';

let sock;
let connectionTries = 0;

function getReconnectTimer() {
	return Math.log(connectionTries * 100) * (connectionTries - 1) + (Math.random() * 10 * (connectionTries - 1));
}

function tryConnect(url, observer) {
	connectionTries++;

	try {
		sock = new SockJS(url);
	} catch(error) {
		console.error(error);
		setTimeout(tryConnect.bind(null, url, observer), getReconnectTimer());
	}

	sock.onopen = function() {
		observer.onNext();
	}

	sock.onclose = function() {
		console.warn('Lost connection');
		observer.onError('Lost connection')
		setTimeout(tryConnect.bind(null, url, observer), getReconnectTimer());
	}

	sock.onerror = function(e) {
		console.warn(e);
		observer.onError(e)
		setTimeout(tryConnect.bind(null, url, observer), getReconnectTimer());
	}
}

export default {

	connect(url, forceFail) {
		return Observable.create((observer) => {
			tryConnect(url, observer);
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
