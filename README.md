# RxWS
Status: [![Build Status](https://travis-ci.org/CanopyTax/rxws.svg?branch=master)](https://travis-ci.org/CanopyTax/rxws) [![codecov.io](https://codecov.io/github/CanopyTax/rxws/coverage.svg?branch=master)](https://codecov.io/github/CanopyTax/rxws?branch=master)

RxWS is a RESTful reactive JavaScript implementation on top of web sockets. This includes,
`GET`, `POST`, `PUT`, `REMOVE` (DELETE), `PATCH`, and `HEAD`. RxWS guarantees message delivery by generating
a correlation id for each message (to and from the server). Both the server and client automatically send an
acknowledgement response for each request. If there is no acknowledgement after a timeout, an error is thrown.

RxWS implements a [RESTful protocol](https://github.com/blittle/rxws-socketio/blob/master/protocol.md). You can use any websocket server as long as it implements the same protocol. By default RxWS supports SocketIO with [rxws-socketio](https://github.com/blittle/rxws-socketio)

## Setup
RxWS requires a websocket abstraction layer. By default it supports both SockJS and [SocketIO](https://github.com/blittle/rxws-socketio).

```javascript
import rxws from 'rxws';
import SocketIOBackend from 'rxws-socketio/SocketIOBackend';

rxws.setBackend({
	backend: SocketIOBackend,
	url: 'ws://someurl'
});

rxws.get('users')
  .subscribe(data => console.log)
  .catch(error => console.error)

```

## Example

Performing a `GET` request:
```javascript
// Request all users
rxws.get('users')
  .subscribe(data => console.log, error => console.error)
  
// Request a specific user
rxws.get('users', {
  parameters: { 'users': 13 }
})
  .subscribe(data => console.log, error => console.error)
  
// Optionally the request could have been built with
rxws({
  method: 'get',
  resource: 'users',
  parameters: { 'users': 13 }
})
  .subscribe(data => console.log, error => console.error)
```

Performing a `POST` request:
```javascript
// Create a user
rxws.post('users', {
  firstName: 'Johnny',
  lastName: 'Appleseed'
})
  .subscribe(data => console.log, error => console.error)

// Optionally the request could have been built with
rxws({
  method: 'post',
  resource: 'users',
  body: {
    firstName: 'Johnny',
    lastName: 'Appleseed'
  }
})
  .subscribe(data => console.log, error => console.error)
```

Nested resources:
```javascript
// Request a comment from a specific post
rxws.get('posts.comments', {
  parameters: { 'posts': 13, 'comments': 15 }
})
  .subscribe(data => console.log, error => console.error)
```

Custom headers:

```javascript
// Request all comments from a post
rxws.get('posts.comments', {
  parameters: { 'posts': 13 },
  apiVersion: '1.2.1',
  accessToken: '7fgnasdfvy0afdsjfjdls',
  queryParameters: { include: 'history' }
})  
  .subscribe(data => console.log, error => console.error)
```

Server Notifications:
```javascript
// Listen for new posts
rxws.onNotification('newPost')
  .forEach((messageBody) => {
    rxws.get('posts', { parameters: { posts: messageBody.id } })
      .subscribe(data => console.log, error => console.error);
  })
```

Request Middleware:
```javascript
// Middleware progress from one another in the order they are defined
rxws.requestUse()
	.subscribe(({req, send, reply, next}) => {
		req.header.resource = 'prefix.' + req.header.resource;
		next();
	}, ({req, err}) => {
		//the error function is currently never called
	});
```

Response Middleware:
```javascript
// Middleware progress from one another in the order they are defined
rxws.use()
	.subscribe(({req, res, reply, retry, next}) => {
		res.requestTime = Date.now();
		next();
	});

rxws.use()
	.subscribe(({req, res, reply, retry, next}) => {
		next();
	}, ({req, err}) => {
		// Do something with the error and the request.
	});

rxws.use()
	.subscribe(({req, res, reply, retry, next}) => {
		reply(res);
	});
```

```javascript
// Use middleware to retry requests

rxws.use()
	.subscribe(({res, reply, retry, next}) => {
		if (res.header.statusCode === 401) {
			auth.refreshAuthToken()
				.then(() => retry())
		} else {
			reply(res);
		}
	})
```

Reactive example:
```javascript
// Try three times to get the data and then return cached data if still fails
var source = rxws.get('url').retry(3).catch(cachedVersion());

var subscription = source.subscribe(
  (data) => {
    // Displays the data from the URL or cached data
    console.log(data);
  }
);
```


## API

`rxws.setBackend(options)`
```javascript
rxws.setBackend({
	backend: rxwsBackendImplementation,
	url: string,
	url: (): Observable,
	defaultHeaders?: object,
	requestTransformer?: (request: object, send: Function): null,
	responseTransformer?: (response: object, reply: Function, retry: Function): null,
	timeout?: 10000,
	onConnectionError?: (error: string): null
})
```

`rxws(config): observable`
```javascript
rxws({
  method: 'get',
  resource: 'posts',
  parameters: { 'posts': 13 }
});
```

`rxws.get(resource[, config]): observable`

`rxws.delete(resource[, config]): observable`

`rxws.head(resource[, config]): observable`

`rxws.post(resource[, data[, config]]): observable`

`rxws.put(resource[, data[, config]]): observable`

`rxws.patch(resource[, data[, config]]): observable`

`rxws.onMessage(type: string): observable`

`config obbject:`
```javascript
{
	resource: string,
	method: string,
	parameters: object,
	data: object,
	extraResources: object,
	queryParameters: object
}
```
