# client-ip

Get the client IP address of the current request

## Install

```
npm install client-ip --save
```

## Usage

```js
var http = require('http');
var clientIp = require('client-ip');

http.createServer(function (req, res) {
  var ip = clientIp(req);
  res.end(ip);
}).listen(3000);
```

### clientIp(request)

* `request` - REQUIRED: http/https server request object
