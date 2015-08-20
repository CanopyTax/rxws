import request from './request';

export default function get(resourcePath, options) {
	return request({
		...options,
		resource: resourcePath,
		method: 'get'
	})
}
