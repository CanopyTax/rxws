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
	startMockingRequests,
	stopMockingRequests
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

makeRequest.startMockingRequests = startMockingRequests;
makeRequest.stopMockingRequests = stopMockingRequests;

export default makeRequest;
