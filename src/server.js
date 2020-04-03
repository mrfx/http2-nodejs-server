
// import { createRequire } from 'module'; // only for

import * as hotelOwner from './modules/hotelowner';


const serverModule = {
  hotelOwner
}



const today = new Date();
console.info('server starting... ' + today.toISOString());

const postURLs = ['agihotelpanel'];
const allowedOrigins = [];

const HTTPS_PORT = 3333;
const HTTP2_PORT = 3334;

const https = require("https");
const fs = require("fs");
const mime = require("mime");
const md5 = require('md5');

const serverOptions = {
  key: fs.readFileSync("./secret/key.pem"),
  cert: fs.readFileSync("./secret/cert.pem")
};

let counter = 0;


const has = Object.prototype.hasOwnProperty; // cache the lookup once, in module scope.

/**
 * create an http2 server
 */
const http2 = require("http2");
const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE
} = http2.constants;



// read and send file content in the stream
const sendFile = (stream, fileName) => {
  const fd = fs.openSync(fileName, "r");
  const stat = fs.fstatSync(fd);
  const headers = {
    "content-length": stat.size,
    "last-modified": stat.mtime.toUTCString(),
    "content-type": mime.getType(fileName)
  };
  stream.respondWithFD(fd, headers);
  stream.on("close", () => {
    console.log("closing file", fileName);
    fs.closeSync(fd);
  });
  stream.end();
};



const pushFile = (stream, path, fileName) => {
  stream.pushStream({ ":path": path }, (err, pushStream) => {
    if (err) {
      throw err;
    }
    sendFile(pushStream, fileName);
  });
};







// handle requests
const http2Handlers = (req, res) => {
  console.log(req.url);

  let headers = {
    [HTTP2_HEADER_STATUS]: 200,
    [HTTP2_HEADER_CONTENT_TYPE]: 'text/json'
  }


  if(req.headers[':method']==='OPTIONS') {
    headers[HTTP2_HEADER_STATUS] = 204;
    headers[HTTP2_HEADER_CONTENT_TYPE] = 'no content';

    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
    headers['Access-Control-Allow-Origin'] = req.headers['origin']; // headers for CORS
    headers['Access-Control-Allow-Credentials'] = 'true'; // headers for CORS
    headers['Access-Control-Allow-Headers'] = req.headers['access-control-request-headers']; // for CORS
    res.stream.respond( headers );
    res.stream.end();
    return;
  }


  if (req.url === "/") {

    res.stream.respond({
      [HTTP2_HEADER_STATUS]: 200,
      [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain'
    });

    res.stream.end('APIserver-1.aginternet.pl');
    return;

  } else {

    // send empty response for favicon.ico
    if (req.url === "/favicon.ico") {
      res.stream.respond({ ":status": 200 });
      res.stream.end();
      return;
    }

    req.stream.on('headers', (headers, flags) => {
      console.log(headers);
    });


    counter++;
    console.info('counter', counter);
    // console.info('req headers', req.headers);



    /*
    ===========================================================================
    SESSION COOKIES START
    ===========================================================================
     */

    let agisession = {
      logged: false,
      confirmed: false,
      hotelOwner: {
        id: 0
      }
    }

    let cookies = {};
    console.info('cookie', req.headers['cookie']);
    if (req.headers['cookie'] !== undefined) {
      const cookieA1 = req.headers['cookie'].split(';')
      for (let i = 0; i < cookieA1.length; i++) {
        const cookieA2 = cookieA1[i].split('=');
        cookies[cookieA2[0].trim()] = cookieA2[1].trim();
      }
      console.info('cookies', cookies);
      console.info('after print cookies');
    }

    if ( !cookies.hasOwnProperty('agisession') ) {

      // create new session cookie
      const hash = md5(Math.random()) + today.getTime();
      fs.writeFileSync( './cookies/' + hash, JSON.stringify(agisession) );
      headers[ 'Set-Cookie' ] = 'agisession=' + hash + '; Path=/; HttpOnly; Secure; SameSite=None';

    } else {

      // cookie found, so load session from file
      console.info('cookie found', cookies['agisession']);
      if ( fs.existsSync( './cookies/' + cookies['agisession'] ) ) {

        const agisessionRaw = fs.readFileSync( './cookies/' + cookies['agisession'], 'UTF-8' );
        agisession = JSON.parse( agisessionRaw )

      }
      else {

        const hash = md5(Math.random()) + today.getTime();
        fs.writeFileSync( './cookies/' + hash, JSON.stringify(agisession) );
        headers[ 'Set-Cookie' ] = 'agisession=' + hash + '; Path=/; HttpOnly; Secure; SameSite=None';

      }

      // console.info('req query', require('url').parse(req.url));

    }

    headers['Access-Control-Allow-Origin'] = req.headers['origin']; // headers for CORS
    headers['Access-Control-Allow-Credentials'] = 'true'; // headers for CORS
    headers['Access-Control-Allow-Headers'] = req.headers['access-control-request-headers']; // for CORS


    /*
    ===========================================================================
    SESSION COOKIES END
    ===========================================================================
     */


    // console.info('session: ', agisession);
    // console.info('req headers', req.headers);
    // console.info('req.stream', req.stream);




    const pathArr = req.url.split('/');

    let postdata = [];
    if(req.headers[':method']==='POST') {

      // POST REQUESTS


      // FUNCTION EXECUTED AFTER END READING THE POST STREAM
      let end = false;
      function endStream(res, req, buffer) {
        if (end === false) {
          end = true;
          req.stream.off('end', ()=>{});
          console.info('force end');
          const body = Buffer.concat(buffer).toString();
          postdata = JSON.parse(body);
          if ( typeof postdata === 'object') {
            if ( has.call(postdata, 'sh') && has.call(postdata, 'postmodule') ) {
              if ( typeof serverModule[ postdata.postmodule ] === 'object') {
                if ( typeof serverModule[ postdata.postmodule ].post === 'function') {

                  try {

                    console.info('trying post...');
                    serverModule[ postdata.postmodule ].post(postdata)
                      .then( result => {
                        console.info('res last', result);
                        res.stream.respond(headers);
                        const rjson = JSON.stringify( result );
                        res.stream.end( rjson );
                        return;

                      } )
                      .catch( (err) => {

                        console.info('trying... error', err);
                        res.stream.respond(headers);
                        const rjson = JSON.stringify( err );
                        res.stream.end( rjson );
                        return;

                      } );

                  }
                  catch (e) {

                    res.stream.respond(headers);
                    res.stream.end( '{ err: "error, no module post?" }' );
                    return;

                  }

                }
              }

            }

          } else {

            // post data is not an (json) object
            res.stream.respond(headers);
            res.stream.end(body);
            return;
          }

        }
      }
      // END OF THE FUNCTION STARTED AFTER END OF THE POST STREAM

      if ( postURLs.indexOf( pathArr[1]) !== -1) {

        let receivesize = 0;
        let buffer = [];
        let body = '';
        req.stream.on('timeout', ()=> {
          res.stream.respond(headers);
          res.stream.end('{ error: timeout }');
        });
        req.stream.on('data', (chunk) => {
          receivesize += chunk.length;
          if (receivesize > 1024 * 1024 * 8) {
            res.stream.end('{ error: \'post size too big\' }');
            return;
          }
          buffer.push(chunk);
          if (receivesize === Number(req.headers['content-length']) ) {
            setTimeout( ()=>{
              endStream(res, req, buffer);
            }, 50 );
          }
        });
        req.stream.on('end', () => {
          endStream(res, req, buffer);
          return
        });

      }
      else {
        res.stream.respond(headers);
        res.stream.end('{}');
        return;
      }

      // END OF POST REQUEST HANDLE

    }
    else {

      // ----------------------------------------------------------------------
      // START OF GET AND OTHER REQUESTS
      // ----------------------------------------------------------------------

      // res.stream.respond(headers);
      let queryarr = require('url').parse(req.url, true).query;

      if ( has.call(queryarr, 'postmodule' ) && has.call(queryarr, 'sh') ) {
        if ( typeof serverModule[ queryarr['postmodule'] ] === 'object') {
          if ( typeof serverModule[ queryarr['postmodule'] ].post === 'function') {

            try {

              console.info('trying get...');
              serverModule[ queryarr['postmodule'] ].post( queryarr )
                .then( result => {
                  console.info('res get last', result);
                  res.stream.respond(headers);
                  const rjson = JSON.stringify( result );
                  console.info('rjson', rjson);
                  res.stream.end( rjson );
                  return;

                } )
                .catch( (err) => {

                  console.info('trying... error', err);
                  res.stream.respond(headers);
                  const rjson = JSON.stringify( err );
                  res.stream.end( rjson );
                  return;

                } );

            }
            catch (e) {

              res.stream.respond(headers);
              res.stream.end( '{ err: "error, no module post?" }' );
              return;

            }

          }
        }
      }
      else {

        let body = JSON.stringify(pathArr);
        body += "\n\nheaders:\n\n" + JSON.stringify( queryarr );
        res.stream.respond(headers);
        res.stream.end( body );
        return;

      }

    }

    //const fileName = __dirname + req.url;
    //sendFile(res.stream, fileName);
  }

};

const server2 = http2
  .createSecureServer(serverOptions, http2Handlers)
  .listen(HTTP2_PORT, () => {
    console.log("http2 server started on port", HTTP2_PORT);
  });



server2.on('session', (ses) => {

  // console.info( 'session', ses );

});

server2.on('stream', (stream, headers, flags) => {

  // console.info('stream', stream);

});

