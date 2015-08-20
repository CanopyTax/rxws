import request from './request';

export default function post(resourcePath, data, options) {
	return request({
		...options,
		resource: resourcePath,
		data: data,
		method: 'post'
	})
}
