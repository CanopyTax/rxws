import { Observable } from 'rx';

export default {

	connect(url, forceFail) {
		return Observable.create((observer) => {
			setTimeout(() => {
				if (forceFail) {
					observer.onNext();
				} else {
					observer.onError();
				}
			});
		})
	},

	write(request) {
	},

	on(event, callback) {
	},

	close() {
	}
}
