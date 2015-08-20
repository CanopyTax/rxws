import { Observable } from 'rx';
import SockJS from 'sockjs-client';

let sock;

export default {

	connect(url, forceFail) {
		return Observable.create((observer) => {
			sock = new SockJS(url);
			sock.onopen = function() {
				observer.onNext();
			}
		})
	},

	write(request) {
		sock.send(request);
	},

	onMessage(callback) {
		sock.onmessage = callback;
	},

	close() {
		sock.close();
	}
}
