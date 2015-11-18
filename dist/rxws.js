!function(e){function r(n){if(t[n])return t[n].exports;var o=t[n]={exports:{},id:n,loaded:!1};return e[n].call(o.exports,o,o.exports,r),o.loaded=!0,o.exports}var t={};return r.m=e,r.c=t,r.p="",r(0)}([function(e,r,t){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(r,"__esModule",{value:!0});var o=t(1),a=n(o),u=t(6),s=n(u),f=t(7),i=n(f),d=t(8),c=n(d),l=t(9),v=n(l),p=t(10),b=n(p),h=t(2),g=n(h);g["default"].remove=a["default"],g["default"].get=s["default"],g["default"].put=c["default"],g["default"].post=i["default"],g["default"].patch=b["default"],g["default"].head=v["default"],g["default"].setBackend=h.setBackend,g["default"].onNotification=h.onNotification,r["default"]=g["default"],e.exports=r["default"]},function(e,r,t){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}function o(e,r){return s["default"](a({},r,{resource:e,method:"remove"}))}Object.defineProperty(r,"__esModule",{value:!0});var a=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e};r["default"]=o;var u=t(2),s=n(u);e.exports=r["default"]},function(e,r,t){"use strict";function n(e){b.write(JSON.stringify(e))}function o(e){var r=JSON.parse(e);r=j(r,u.bind(null,e),a.bind(null,e))}function a(e,r){var t=m[JSON.parse(e).header.correlationId];if(!t)throw new Error("No associated request to retry",rawMessage);var o=t.request;h?n(o):g.push(o)}function u(e,r){var t=r.header;if(t.notification)return s(r);var n=m[t.correlationId];if(!n)throw new Error("No associated request for the server message",e);var o=n.observer;r.body.__header=r.header,200!==r.header.statusCode?(o.onError(r.body),o.onCompleted(r.body)):(o.onNext(r.body),o.onCompleted(r.body))}function s(e){n({header:l({},y,e.header)});var r=O[e.header.notification];r&&r.observer.onNext(e.body)}function f(){for(;g.length;)n(g.shift())}function i(){var e=arguments.length<=0||void 0===arguments[0]?{}:arguments[0],r=l({requestTransformer:_,responseTransformer:j,defaultHeaders:{}},e);if(!r.url)throw new Error("No backend url provided");b=r.backend,y=r.defaultHeaders,_=r.requestTransformer,j=r.responseTransformer,b.connect(r.url).retryWhen(function(e){return v.Observable.range(1,3e4).zip(e,function(e){return e}).flatMap(function(e){h=!1;var r=p.getRetryTimer(e);return console.log("delay retry by "+r+" second(s)"),v.Observable.timer(r)})}).subscribe(function(e){h=!0,f(),b.onMessage(o)})}function d(e){return O[e]?O[e].observable:(O[e]={observable:v.Observable.create(function(r){O[e].observer=r})},O[e].observable)}function c(e){if(!b)throw new Error("Must define a websocket backend");return v.Observable.create(function(r){_(p.generateRequestObject(y)(e),function(e){h?n(e):g.push(e),m[e.header.correlationId]={observer:r,request:e}})})}Object.defineProperty(r,"__esModule",{value:!0});var l=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e};r.setBackend=i,r.onNotification=d,r["default"]=c;var v=t(3),p=t(4),b=void 0,h=!1,g=[],m={},O={},y={},_=function(e,r){r(e)},j=function(e,r,t){r(e)}},function(e,r){e.exports=rx},function(e,r,t){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}function o(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function a(e,r){var t=e.split(".");if(t.length>1&&!r)throw new Error("Invalid params: param is required for resource "+t[0]);t.forEach(function(e,t){if(t>0&&!r[e])throw new Error("Invalid params: param is required for resource "+e)})}function u(e){return 1e3*(Math.log(e)+Math.random()*(e-1))}function s(e){return function(r){if(!r||!r.resource||!r.method)throw new Error("Invalid config",r);a(r.resource,r.parameters);var t=r.data;delete r.data;var n=d["default"](),u=r.resource.split(".");return"remove"===r.method&&(r.method="delete"),r.resource=r.method+"."+r.resource,delete r.method,{header:f({},e,r,{correlationId:n}),body:o({},u[u.length-1],t)}}}Object.defineProperty(r,"__esModule",{value:!0});var f=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e};r.getRetryTimer=u,r.generateRequestObject=s;var i=t(5),d=n(i)},function(e,r){e.exports=uuid},function(e,r,t){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}function o(e,r){return s["default"](a({},r,{resource:e,method:"get"}))}Object.defineProperty(r,"__esModule",{value:!0});var a=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e};r["default"]=o;var u=t(2),s=n(u);e.exports=r["default"]},function(e,r,t){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}function o(e,r,t){return s["default"](a({},t,{resource:e,data:r,method:"post"}))}Object.defineProperty(r,"__esModule",{value:!0});var a=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e};r["default"]=o;var u=t(2),s=n(u);e.exports=r["default"]},function(e,r,t){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}function o(e,r,t){return s["default"](a({},t,{resource:e,data:r,method:"put"}))}Object.defineProperty(r,"__esModule",{value:!0});var a=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e};r["default"]=o;var u=t(2),s=n(u);e.exports=r["default"]},function(e,r,t){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}function o(e,r){return s["default"](a({},r,{resource:e,method:"head"}))}Object.defineProperty(r,"__esModule",{value:!0});var a=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e};r["default"]=o;var u=t(2),s=n(u);e.exports=r["default"]},function(e,r,t){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}function o(e,r,t){return s["default"](a({},t,{resource:e,data:r,method:"patch"}))}Object.defineProperty(r,"__esModule",{value:!0});var a=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e};r["default"]=o;var u=t(2),s=n(u);e.exports=r["default"]}]);
//# sourceMappingURL=rxws.js.map