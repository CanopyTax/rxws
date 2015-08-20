'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _remove = require('./remove');

var _remove2 = _interopRequireDefault(_remove);

var _get = require('./get');

var _get2 = _interopRequireDefault(_get);

var _post = require('./post');

var _post2 = _interopRequireDefault(_post);

var _put = require('./put');

var _put2 = _interopRequireDefault(_put);

var _head = require('./head');

var _head2 = _interopRequireDefault(_head);

var _patch = require('./patch');

var _patch2 = _interopRequireDefault(_patch);

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

_request2['default'].remove = _remove2['default'];
_request2['default'].get = _get2['default'];
_request2['default'].put = _put2['default'];
_request2['default'].post = _post2['default'];
_request2['default'].patch = _patch2['default'];
_request2['default'].head = _head2['default'];
_request2['default'].setBackend = _request.setBackend;
_request2['default'].onNotification = _request.onNotification;

exports['default'] = _request2['default'];
module.exports = exports['default'];