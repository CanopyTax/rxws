import request from './request';

export default function put(resourcePath, data, options) {
	return request({
		...options,
		resource: resourcePath,
		data: data,
		method: 'put'
	})
}
