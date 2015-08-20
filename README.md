# RxWS
A RESTful Reactive JavaScript Implementation on top of Web Sockets. This includes,
`GET`, `POST`, 'PUT`, 'REMOVE` (DELETE), `PATCH`, and `HEAD`. RxWS gaurantees message delivery by generating
a correlation id for each message (to and from the server). Both the server and client automatically send an
acknowledgement response for each request. If there is no acknowledgement after a timeout, an error is thrown.

## Setup
RxWS requires a websocket abstraction layer. By default it comes with a SockJS backend implementation.
```javascript
import rxws from 'rxws';
import SockJSBackend from 'rxws/SockJSBackend';

rxws.setBackend(SockJSBackend, 'ws://someurl');
rxws.get('/users')
  .subscribe(data => console.log)
  .catch(error => console.error)

```

## Example

Performing a `GET` request:
```javascript
// Request all users
jxws.get('/users')
  .subscribe(data => console.log)
  .catch(error => console.error)
  
// Request a specific user
jxws.get('/users', {
  parameters: { 'users': 13 }
})
  .subscribe(data => console.log)
  .catch(error => console.error)
  
// Optionally the request could have been built with
rxws({
  method: 'get',
  resource: 'users',
  parameters: { 'users': 13 }
})
  .subscribe(data => console.log)
  .catch(error => console.error)
```

Performing a `POST` request:
```javascript
// Create a user
jxws.post('/users', {
  firstName: 'Johnny',
  lastName: 'Appleseed'
})
  .subscribe(data => console.log)
  .catch(error => console.error)

// Optionally the request could have been built with
rxws({
  method: 'post',
  resource: 'users',
  body: {
    firstName: 'Johnny',
    lastName: 'Appleseed'
  }
})
  .subscribe(data => console.log)
  .catch(error => console.error)
```

Nested resources:
```javascript
// Request a comment from a specific post
jxws.get('posts.comments', {
  parameters: { 'posts': 13, 'comments': 15 }
})
  .subscribe(data => console.log)
  .catch(error => console.error)
```

Custom headers:

```javascript
// Request all comments from a post
jxws.get('posts.comments', {
  parameters: { 'posts': 13 },
  apiVersion: '1.2.1',
  accessToken: '7fgnasdfvy0afdsjfjdls',
  queryParameters: { include: 'history' }
})  
  .subscribe(data => console.log)
  .catch(error => console.error)
```

Server Notifications:
```javascript
// Listen for new posts
jxws.onNotification('newPost')
  .forEach((messageBody) => {
    jxws.get('posts', { parameters: { posts: messageBody.id } })
      .subscribe(data => console.log);
  })
```

Reactive example:
```javascript
// Try three times to get the data and then return cached data if still fails
var source = rxws.get('url').retry(3).catch(cachedVersion());

var subscription = source.subscribe(
  function (data) {
    // Displays the data from the URL or cached data
    console.log(data);
  }
);
```


## API

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

`rxws.setBackend(Backend): null`

`rxws.onMessage(type: string): observable`
