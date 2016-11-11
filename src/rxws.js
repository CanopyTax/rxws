import rx from 'rx';
import remove from './remove';
import get from './get';
import post from './post';
import put from './put';
import head from './head';
import patch from './patch';

import makeRequest, {
	setBackend,
	onNotification,
	use,
	requestUse,
	mockReturn,
	startMockingRequests,
	stopMockingRequests,
	reset
} from './request';

makeRequest.remove = remove;
makeRequest.get = get;
makeRequest.put = put;
makeRequest.post = post;
makeRequest.patch = patch;
makeRequest.head = head;
makeRequest.setBackend = setBackend;

makeRequest.onNotification = onNotification;
makeRequest.use = use;
makeRequest.requestUse = requestUse;
makeRequest.mockReturn = mockReturn;

makeRequest.startMockingRequests = startMockingRequests;
makeRequest.stopMockingRequests = stopMockingRequests;
makeRequest.reset = reset;
makeRequest.rx = rx;

export { remove };
export { get };
export { post };
export { put };
export { head };
export { patch };
export { setBackend };

export { onNotification };
export { use };
export { requestUse };

export { mockReturn }
export { startMockingRequests };
export { stopMockingRequests };
export { reset };
export { rx };

export default makeRequest;
