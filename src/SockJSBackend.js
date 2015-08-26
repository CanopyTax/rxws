import { Observable } from 'rx';
import SockJS from 'sockjs-client';

let sock;

function tryConnect(url, observer) {
	sock = new SockJS(url);

	sock.onopen = function() {
		observer.onNext();
	}

	sock.onclose = function() {
		observer.onError('Lost connection')
	}

	sock.onerror = function(e) {
		observer.onError(e)
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
