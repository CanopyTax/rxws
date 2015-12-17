import remove from './remove';
import get from './get';
import post from './post';
import put from './put';
import head from './head';
import patch from './patch';

import makeRequest, { setBackend, onNotification, use } from './request';

makeRequest.remove = remove;
makeRequest.get = get;
makeRequest.put = put;
makeRequest.post = post;
makeRequest.patch = patch;
makeRequest.head = head;
makeRequest.setBackend = setBackend;

makeRequest.onNotification = onNotification;
makeRequest.use = use;

export default makeRequest;
