# http2-nodejs-server
Sample HTTP/2 Node.js Server with CORS support, Sessions Cookie, POST/GET based dynamic modules/function calls and MariaDB support.

While Node.js http2 request.stream.on('end') is not reliable yet (Google Chrome/Chromium bug, see https://github.com/nodejs/node/issues/31309) there is this workaround (from line 298 at src/server.js).

Sample request:

GET https : // your.domain:3334/somePath/?postmodule=[ModuleName]&sh=[FunctionName]&otherParams=...

and the same for POST...
