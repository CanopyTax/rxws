'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.getRetryTimer = getRetryTimer;
exports.generateRequestObject = generateRequestObject;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

function sanitizeParams(resource, params) {
	var resourceElements = resource.split('.');

	if (resourceElements.length > 1 && !params) {
		throw new Error('Invalid params: param is required for resource ' + resourceElements[0]);
	}

	resourceElements.forEach(function (el, i) {
		if (i !== resourceElements.length - 1) {
			if (!params[el]) throw new Error('Invalid params: param is required for resource ' + el);
		}
	});
}

function getRetryTimer(i) {
	return (Math.log(i) + Math.random() * (i - 1)) * 1000;
}

/**
 * Generate a request object which will be sent to the server.
 * The config needs to have a 'resource' and 'method' attribute.
 */

function generateRequestObject(defaultHeaders) {
	return function (config) {
		if (!config || !config.resource || !config.method) {
			throw new Error('Invalid config', config);
		}

		sanitizeParams(config.resource, config.parameters);

		var body = config.data;
		delete config.data;

		var correlationId = (0, _nodeUuid2['default'])();
		var resourceList = config.resource.split('.');

		if (config.method === 'remove') config.method = 'delete';
		config.resource = config.method + '.' + config.resource;
		delete config.method;

		return {
			header: _extends({}, defaultHeaders, config, {
				correlationId: correlationId
			}),
			body: _defineProperty({}, resourceList[resourceList.length - 1], body)
		};
	};
}