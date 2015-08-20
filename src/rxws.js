import remove from './remove';
import get from './get';
import post from './post';
import put from './put';
import head from './head';
import patch from './patch';

import makeRequest, { setBackend, onNotification } from './request';

makeRequest.remove = remove;
makeRequest.get = get;
makeRequest.put = put;
makeRequest.post = post;
makeRequest.patch = patch;
makeRequest.head = head;
makeRequest.setBackend = setBackend;
makeRequest.onNotification = onNotification;

export default makeRequest;
