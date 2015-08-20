import request from './request';

export default function head(resourcePath, options) {
	return request({
		...options,
		resource: resourcePath,
		method: 'head'
	})
}
