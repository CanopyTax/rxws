import request from './request';

export default function patch(resourcePath, data, options) {
	return request({
		...options,
		resource: resourcePath,
		data: data,
		method: 'patch'
	})
}
