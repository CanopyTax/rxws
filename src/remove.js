import request from './request';

export default function remove(resourcePath, options) {
	return request({
		...options,
		resource: resourcePath,
		method: 'remove'
	})
}
