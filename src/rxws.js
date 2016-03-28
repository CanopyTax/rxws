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
	startMockingRequests,
	stopMockingRequests,
	reset
} from './request';

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

export { startMockingRequests };
export { stopMockingRequests };
export { reset };
export { rx };

export default makeRequest;
