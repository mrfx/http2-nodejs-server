# http2-nodejs-server-example
HTTP2 Node.js Server with CORS support, COOKIES, POST/GET based dynamic modules/function calls and MariaDB support.

Since Node.js http2 request.stream.on('end') is not reliable yet (see https://github.com/nodejs/node/issues/31309) there is this workaround (from line 298 at src/server.js).
