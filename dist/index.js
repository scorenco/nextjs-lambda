"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/serverless-http/lib/finish.js
var require_finish = __commonJS({
  "node_modules/serverless-http/lib/finish.js"(exports, module2) {
    "use strict";
    module2.exports = async function finish(item, transform, ...details) {
      await new Promise((resolve, reject) => {
        if (item.finished || item.complete) {
          resolve();
          return;
        }
        let finished = false;
        function done(err) {
          if (finished) {
            return;
          }
          finished = true;
          item.removeListener("error", done);
          item.removeListener("end", done);
          item.removeListener("finish", done);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
        item.once("error", done);
        item.once("end", done);
        item.once("finish", done);
      });
      if (typeof transform === "function") {
        await transform(item, ...details);
      } else if (typeof transform === "object" && transform !== null) {
        Object.assign(item, transform);
      }
      return item;
    };
  }
});

// node_modules/serverless-http/lib/response.js
var require_response = __commonJS({
  "node_modules/serverless-http/lib/response.js"(exports, module2) {
    "use strict";
    var http = require("http");
    var headerEnd = "\r\n\r\n";
    var BODY = Symbol();
    var HEADERS = Symbol();
    function getString(data) {
      if (Buffer.isBuffer(data)) {
        return data.toString("utf8");
      } else if (typeof data === "string") {
        return data;
      } else {
        throw new Error(`response.write() of unexpected type: ${typeof data}`);
      }
    }
    function addData(stream, data) {
      if (Buffer.isBuffer(data) || typeof data === "string" || data instanceof Uint8Array) {
        stream[BODY].push(Buffer.from(data));
      } else {
        throw new Error(`response.write() of unexpected type: ${typeof data}`);
      }
    }
    module2.exports = class ServerlessResponse extends http.ServerResponse {
      static from(res) {
        const response = new ServerlessResponse(res);
        response.statusCode = res.statusCode;
        response[HEADERS] = res.headers;
        response[BODY] = [Buffer.from(res.body)];
        response.end();
        return response;
      }
      static body(res) {
        return Buffer.concat(res[BODY]);
      }
      static headers(res) {
        const headers = typeof res.getHeaders === "function" ? res.getHeaders() : res._headers;
        return Object.assign(headers, res[HEADERS]);
      }
      get headers() {
        return this[HEADERS];
      }
      setHeader(key, value) {
        if (this._wroteHeader) {
          this[HEADERS][key] = value;
        } else {
          super.setHeader(key, value);
        }
      }
      writeHead(statusCode, reason, obj) {
        const headers = typeof reason === "string" ? obj : reason;
        for (const name in headers) {
          this.setHeader(name, headers[name]);
          if (!this._wroteHeader) {
            break;
          }
        }
        super.writeHead(statusCode, reason, obj);
      }
      constructor({ method }) {
        super({ method });
        this[BODY] = [];
        this[HEADERS] = {};
        this.useChunkedEncodingByDefault = false;
        this.chunkedEncoding = false;
        this._header = "";
        this.assignSocket({
          _writableState: {},
          writable: true,
          on: Function.prototype,
          removeListener: Function.prototype,
          destroy: Function.prototype,
          cork: Function.prototype,
          uncork: Function.prototype,
          write: (data, encoding, cb) => {
            if (typeof encoding === "function") {
              cb = encoding;
              encoding = null;
            }
            if (this._header === "" || this._wroteHeader) {
              addData(this, data);
            } else {
              const string = getString(data);
              const index = string.indexOf(headerEnd);
              if (index !== -1) {
                const remainder = string.slice(index + headerEnd.length);
                if (remainder) {
                  addData(this, remainder);
                }
                this._wroteHeader = true;
              }
            }
            if (typeof cb === "function") {
              cb();
            }
          }
        });
      }
    };
  }
});

// node_modules/serverless-http/lib/framework/get-framework.js
var require_get_framework = __commonJS({
  "node_modules/serverless-http/lib/framework/get-framework.js"(exports, module2) {
    "use strict";
    var Response = require_response();
    function common(cb) {
      return (request) => {
        const response = new Response(request);
        cb(request, response);
        return response;
      };
    }
    module2.exports = function getFramework(app) {
      if (typeof app.callback === "function") {
        return common(app.callback());
      }
      if (typeof app.handle === "function") {
        return common((request, response) => {
          app.handle(request, response);
        });
      }
      if (typeof app.handler === "function") {
        return common((request, response) => {
          app.handler(request, response);
        });
      }
      if (typeof app._onRequest === "function") {
        return common((request, response) => {
          app._onRequest(request, response);
        });
      }
      if (typeof app === "function") {
        return common(app);
      }
      if (app.router && typeof app.router.route == "function") {
        return common((req, res) => {
          const { url, method, headers, body } = req;
          app.router.route({ url, method, headers, body }, res);
        });
      }
      if (app._core && typeof app._core._dispatch === "function") {
        return common(app._core._dispatch({
          app
        }));
      }
      if (typeof app.inject === "function") {
        return async (request) => {
          const { method, url, headers, body } = request;
          const res = await app.inject({ method, url, headers, payload: body });
          return Response.from(res);
        };
      }
      if (typeof app.main === "function") {
        return common(app.main);
      }
      throw new Error("Unsupported framework");
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/clean-up-event.js
var require_clean_up_event = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/clean-up-event.js"(exports, module2) {
    "use strict";
    function removeBasePath(path2 = "/", basePath) {
      if (basePath) {
        const basePathIndex = path2.indexOf(basePath);
        if (basePathIndex > -1) {
          return path2.substr(basePathIndex + basePath.length) || "/";
        }
      }
      return path2;
    }
    function isString(value) {
      return typeof value === "string" || value instanceof String;
    }
    function specialDecodeURIComponent(value) {
      if (!isString(value)) {
        return value;
      }
      let decoded;
      try {
        decoded = decodeURIComponent(value.replace(/[+]/g, "%20"));
      } catch (err) {
        decoded = value.replace(/[+]/g, "%20");
      }
      return decoded;
    }
    function recursiveURLDecode(value) {
      if (isString(value)) {
        return specialDecodeURIComponent(value);
      } else if (Array.isArray(value)) {
        const decodedArray = [];
        for (let index in value) {
          decodedArray.push(recursiveURLDecode(value[index]));
        }
        return decodedArray;
      } else if (value instanceof Object) {
        const decodedObject = {};
        for (let key of Object.keys(value)) {
          decodedObject[specialDecodeURIComponent(key)] = recursiveURLDecode(value[key]);
        }
        return decodedObject;
      }
      return value;
    }
    module2.exports = function cleanupEvent(evt, options) {
      const event = evt || {};
      event.requestContext = event.requestContext || {};
      event.body = event.body || "";
      event.headers = event.headers || {};
      if ("elb" in event.requestContext) {
        if (event.multiValueQueryStringParameters) {
          event.multiValueQueryStringParameters = recursiveURLDecode(event.multiValueQueryStringParameters);
        }
        if (event.queryStringParameters) {
          event.queryStringParameters = recursiveURLDecode(event.queryStringParameters);
        }
      }
      if (event.version === "2.0") {
        event.requestContext.authorizer = event.requestContext.authorizer || {};
        event.requestContext.http.method = event.requestContext.http.method || "GET";
        event.rawPath = removeBasePath(event.requestPath || event.rawPath, options.basePath);
      } else {
        event.requestContext.identity = event.requestContext.identity || {};
        event.httpMethod = event.httpMethod || "GET";
        event.path = removeBasePath(event.requestPath || event.path, options.basePath);
      }
      return event;
    };
  }
});

// node_modules/serverless-http/lib/request.js
var require_request = __commonJS({
  "node_modules/serverless-http/lib/request.js"(exports, module2) {
    "use strict";
    var http = require("http");
    module2.exports = class ServerlessRequest extends http.IncomingMessage {
      constructor({ method, url, headers, body, remoteAddress }) {
        super({
          encrypted: true,
          readable: false,
          remoteAddress,
          address: () => ({ port: 443 }),
          end: Function.prototype,
          destroy: Function.prototype
        });
        if (typeof headers["content-length"] === "undefined") {
          headers["content-length"] = Buffer.byteLength(body);
        }
        Object.assign(this, {
          ip: remoteAddress,
          complete: true,
          httpVersion: "1.1",
          httpVersionMajor: "1",
          httpVersionMinor: "1",
          method,
          headers,
          body,
          url
        });
        this._read = () => {
          this.push(body);
          this.push(null);
        };
      }
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/create-request.js
var require_create_request = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/create-request.js"(exports, module2) {
    "use strict";
    var URL = require("url");
    var Request = require_request();
    function requestMethod(event) {
      if (event.version === "2.0") {
        return event.requestContext.http.method;
      }
      return event.httpMethod;
    }
    function requestRemoteAddress(event) {
      if (event.version === "2.0") {
        return event.requestContext.http.sourceIp;
      }
      return event.requestContext.identity.sourceIp;
    }
    function requestHeaders(event) {
      const initialHeader = event.version === "2.0" && Array.isArray(event.cookies) ? { cookie: event.cookies.join("; ") } : {};
      if (event.multiValueHeaders) {
        return Object.keys(event.multiValueHeaders).reduce((headers, key) => {
          headers[key.toLowerCase()] = event.multiValueHeaders[key].join(", ");
          return headers;
        }, initialHeader);
      }
      return Object.keys(event.headers).reduce((headers, key) => {
        headers[key.toLowerCase()] = event.headers[key];
        return headers;
      }, initialHeader);
    }
    function requestBody(event) {
      const type = typeof event.body;
      if (Buffer.isBuffer(event.body)) {
        return event.body;
      } else if (type === "string") {
        return Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
      } else if (type === "object") {
        return Buffer.from(JSON.stringify(event.body));
      }
      throw new Error(`Unexpected event.body type: ${typeof event.body}`);
    }
    function requestUrl(event) {
      if (event.version === "2.0") {
        return URL.format({
          pathname: event.rawPath,
          search: event.rawQueryString
        });
      }
      const query = event.multiValueQueryStringParameters || {};
      if (event.queryStringParameters) {
        Object.keys(event.queryStringParameters).forEach((key) => {
          if (Array.isArray(query[key])) {
            if (!query[key].includes(event.queryStringParameters[key])) {
              query[key].push(event.queryStringParameters[key]);
            }
          } else {
            query[key] = [event.queryStringParameters[key]];
          }
        });
      }
      return URL.format({
        pathname: event.path,
        query
      });
    }
    module2.exports = (event, context, options) => {
      const method = requestMethod(event);
      const remoteAddress = requestRemoteAddress(event);
      const headers = requestHeaders(event);
      const body = requestBody(event);
      const url = requestUrl(event);
      if (typeof options.requestId === "string" && options.requestId.length > 0) {
        const header = options.requestId.toLowerCase();
        const requestId = headers[header] || event.requestContext.requestId;
        if (requestId) {
          headers[header] = requestId;
        }
      }
      const req = new Request({
        method,
        headers,
        body,
        remoteAddress,
        url
      });
      req.requestContext = event.requestContext;
      req.apiGateway = {
        event,
        context
      };
      return req;
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/is-binary.js
var require_is_binary = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/is-binary.js"(exports, module2) {
    "use strict";
    var BINARY_ENCODINGS = ["gzip", "deflate", "br"];
    var BINARY_CONTENT_TYPES = (process.env.BINARY_CONTENT_TYPES || "").split(",");
    function isBinaryEncoding(headers) {
      const contentEncoding = headers["content-encoding"];
      if (typeof contentEncoding === "string") {
        return contentEncoding.split(",").some(
          (value) => BINARY_ENCODINGS.some((binaryEncoding) => value.indexOf(binaryEncoding) !== -1)
        );
      }
    }
    function isBinaryContent(headers, options) {
      const contentTypes = [].concat(
        options.binary ? options.binary : BINARY_CONTENT_TYPES
      ).map(
        (candidate) => new RegExp(`^${candidate.replace(/\*/g, ".*")}$`)
      );
      const contentType = (headers["content-type"] || "").split(";")[0];
      return !!contentType && contentTypes.some((candidate) => candidate.test(contentType));
    }
    module2.exports = function isBinary(headers, options) {
      if (options.binary === false) {
        return false;
      }
      if (options.binary === true) {
        return true;
      }
      if (typeof options.binary === "function") {
        return options.binary(headers);
      }
      return isBinaryEncoding(headers) || isBinaryContent(headers, options);
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/sanitize-headers.js
var require_sanitize_headers = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/sanitize-headers.js"(exports, module2) {
    "use strict";
    module2.exports = function sanitizeHeaders(headers) {
      return Object.keys(headers).reduce((memo, key) => {
        const value = headers[key];
        if (Array.isArray(value)) {
          memo.multiValueHeaders[key] = value;
          if (key.toLowerCase() !== "set-cookie") {
            memo.headers[key] = value.join(", ");
          }
        } else {
          memo.headers[key] = value == null ? "" : value.toString();
        }
        return memo;
      }, {
        headers: {},
        multiValueHeaders: {}
      });
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/format-response.js
var require_format_response = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/format-response.js"(exports, module2) {
    "use strict";
    var isBinary = require_is_binary();
    var Response = require_response();
    var sanitizeHeaders = require_sanitize_headers();
    module2.exports = (event, response, options) => {
      const { statusCode } = response;
      const { headers, multiValueHeaders } = sanitizeHeaders(Response.headers(response));
      let cookies = [];
      if (multiValueHeaders["set-cookie"]) {
        cookies = multiValueHeaders["set-cookie"];
      }
      const isBase64Encoded = isBinary(headers, options);
      const encoding = isBase64Encoded ? "base64" : "utf8";
      let body = Response.body(response).toString(encoding);
      if (headers["transfer-encoding"] === "chunked" || response.chunkedEncoding) {
        const raw = Response.body(response).toString().split("\r\n");
        const parsed = [];
        for (let i = 0; i < raw.length; i += 2) {
          const size = parseInt(raw[i], 16);
          const value = raw[i + 1];
          if (value) {
            parsed.push(value.substring(0, size));
          }
        }
        body = parsed.join("");
      }
      let formattedResponse = { statusCode, headers, isBase64Encoded, body };
      if (event.version === "2.0" && cookies.length) {
        formattedResponse["cookies"] = cookies;
      }
      if ((!event.version || event.version === "1.0") && Object.keys(multiValueHeaders).length) {
        formattedResponse["multiValueHeaders"] = multiValueHeaders;
      }
      return formattedResponse;
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/index.js
var require_aws = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/index.js"(exports, module2) {
    var cleanUpEvent = require_clean_up_event();
    var createRequest = require_create_request();
    var formatResponse = require_format_response();
    module2.exports = (options) => {
      return (getResponse) => async (event_, context = {}) => {
        const event = cleanUpEvent(event_, options);
        const request = createRequest(event, context, options);
        const response = await getResponse(request, event, context);
        return formatResponse(event, response, options);
      };
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/clean-up-request.js
var require_clean_up_request = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/clean-up-request.js"(exports, module2) {
    "use strict";
    function getUrl({ requestPath, url }) {
      if (requestPath) {
        return requestPath;
      }
      return typeof url === "string" ? url : "/";
    }
    function getRequestContext(request) {
      const requestContext = {};
      requestContext.identity = {};
      const forwardedIp = request.headers["x-forwarded-for"];
      const clientIp = request.headers["client-ip"];
      const ip = forwardedIp ? forwardedIp : clientIp ? clientIp : "";
      if (ip) {
        requestContext.identity.sourceIp = ip.split(":")[0];
      }
      return requestContext;
    }
    module2.exports = function cleanupRequest(req, options) {
      const request = req || {};
      request.requestContext = getRequestContext(req);
      request.method = request.method || "GET";
      request.url = getUrl(request);
      request.body = request.body || "";
      request.headers = request.headers || {};
      if (options.basePath) {
        const basePathIndex = request.url.indexOf(options.basePath);
        if (basePathIndex > -1) {
          request.url = request.url.substr(basePathIndex + options.basePath.length);
        }
      }
      return request;
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/create-request.js
var require_create_request2 = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/create-request.js"(exports, module2) {
    "use strict";
    var url = require("url");
    var Request = require_request();
    function requestHeaders(request) {
      return Object.keys(request.headers).reduce((headers, key) => {
        headers[key.toLowerCase()] = request.headers[key];
        return headers;
      }, {});
    }
    function requestBody(request) {
      const type = typeof request.rawBody;
      if (Buffer.isBuffer(request.rawBody)) {
        return request.rawBody;
      } else if (type === "string") {
        return Buffer.from(request.rawBody, "utf8");
      } else if (type === "object") {
        return Buffer.from(JSON.stringify(request.rawBody));
      }
      throw new Error(`Unexpected request.body type: ${typeof request.rawBody}`);
    }
    module2.exports = (request) => {
      const method = request.method;
      const query = request.query;
      const headers = requestHeaders(request);
      const body = requestBody(request);
      const req = new Request({
        method,
        headers,
        body,
        url: url.format({
          pathname: request.url,
          query
        })
      });
      req.requestContext = request.requestContext;
      return req;
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/is-binary.js
var require_is_binary2 = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/is-binary.js"(exports, module2) {
    "use strict";
    var BINARY_ENCODINGS = ["gzip", "deflate", "br"];
    var BINARY_CONTENT_TYPES = (process.env.BINARY_CONTENT_TYPES || "").split(",");
    function isBinaryEncoding(headers) {
      const contentEncoding = headers["content-encoding"];
      if (typeof contentEncoding === "string") {
        return contentEncoding.split(",").some(
          (value) => BINARY_ENCODINGS.some((binaryEncoding) => value.indexOf(binaryEncoding) !== -1)
        );
      }
    }
    function isBinaryContent(headers, options) {
      const contentTypes = [].concat(
        options.binary ? options.binary : BINARY_CONTENT_TYPES
      ).map(
        (candidate) => new RegExp(`^${candidate.replace(/\*/g, ".*")}$`)
      );
      const contentType = (headers["content-type"] || "").split(";")[0];
      return !!contentType && contentTypes.some((candidate) => candidate.test(contentType));
    }
    module2.exports = function isBinary(headers, options) {
      if (options.binary === false) {
        return false;
      }
      if (options.binary === true) {
        return true;
      }
      if (typeof options.binary === "function") {
        return options.binary(headers);
      }
      return isBinaryEncoding(headers) || isBinaryContent(headers, options);
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/set-cookie.json
var require_set_cookie = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/set-cookie.json"(exports, module2) {
    module2.exports = { variations: ["set-cookie", "Set-cookie", "sEt-cookie", "SEt-cookie", "seT-cookie", "SeT-cookie", "sET-cookie", "SET-cookie", "set-Cookie", "Set-Cookie", "sEt-Cookie", "SEt-Cookie", "seT-Cookie", "SeT-Cookie", "sET-Cookie", "SET-Cookie", "set-cOokie", "Set-cOokie", "sEt-cOokie", "SEt-cOokie", "seT-cOokie", "SeT-cOokie", "sET-cOokie", "SET-cOokie", "set-COokie", "Set-COokie", "sEt-COokie", "SEt-COokie", "seT-COokie", "SeT-COokie", "sET-COokie", "SET-COokie", "set-coOkie", "Set-coOkie", "sEt-coOkie", "SEt-coOkie", "seT-coOkie", "SeT-coOkie", "sET-coOkie", "SET-coOkie", "set-CoOkie", "Set-CoOkie", "sEt-CoOkie", "SEt-CoOkie", "seT-CoOkie", "SeT-CoOkie", "sET-CoOkie", "SET-CoOkie", "set-cOOkie", "Set-cOOkie", "sEt-cOOkie", "SEt-cOOkie", "seT-cOOkie", "SeT-cOOkie", "sET-cOOkie", "SET-cOOkie", "set-COOkie", "Set-COOkie", "sEt-COOkie", "SEt-COOkie", "seT-COOkie", "SeT-COOkie", "sET-COOkie", "SET-COOkie", "set-cooKie", "Set-cooKie", "sEt-cooKie", "SEt-cooKie", "seT-cooKie", "SeT-cooKie", "sET-cooKie", "SET-cooKie", "set-CooKie", "Set-CooKie", "sEt-CooKie", "SEt-CooKie", "seT-CooKie", "SeT-CooKie", "sET-CooKie", "SET-CooKie", "set-cOoKie", "Set-cOoKie", "sEt-cOoKie", "SEt-cOoKie", "seT-cOoKie", "SeT-cOoKie", "sET-cOoKie", "SET-cOoKie", "set-COoKie", "Set-COoKie", "sEt-COoKie", "SEt-COoKie", "seT-COoKie", "SeT-COoKie", "sET-COoKie", "SET-COoKie", "set-coOKie", "Set-coOKie", "sEt-coOKie", "SEt-coOKie", "seT-coOKie", "SeT-coOKie", "sET-coOKie", "SET-coOKie", "set-CoOKie", "Set-CoOKie", "sEt-CoOKie", "SEt-CoOKie", "seT-CoOKie", "SeT-CoOKie", "sET-CoOKie", "SET-CoOKie", "set-cOOKie", "Set-cOOKie", "sEt-cOOKie", "SEt-cOOKie", "seT-cOOKie", "SeT-cOOKie", "sET-cOOKie", "SET-cOOKie", "set-COOKie", "Set-COOKie", "sEt-COOKie", "SEt-COOKie", "seT-COOKie", "SeT-COOKie", "sET-COOKie", "SET-COOKie", "set-cookIe", "Set-cookIe", "sEt-cookIe", "SEt-cookIe", "seT-cookIe", "SeT-cookIe", "sET-cookIe", "SET-cookIe", "set-CookIe", "Set-CookIe", "sEt-CookIe", "SEt-CookIe", "seT-CookIe", "SeT-CookIe", "sET-CookIe", "SET-CookIe", "set-cOokIe", "Set-cOokIe", "sEt-cOokIe", "SEt-cOokIe", "seT-cOokIe", "SeT-cOokIe", "sET-cOokIe", "SET-cOokIe", "set-COokIe", "Set-COokIe", "sEt-COokIe", "SEt-COokIe", "seT-COokIe", "SeT-COokIe", "sET-COokIe", "SET-COokIe", "set-coOkIe", "Set-coOkIe", "sEt-coOkIe", "SEt-coOkIe", "seT-coOkIe", "SeT-coOkIe", "sET-coOkIe", "SET-coOkIe", "set-CoOkIe", "Set-CoOkIe", "sEt-CoOkIe", "SEt-CoOkIe", "seT-CoOkIe", "SeT-CoOkIe", "sET-CoOkIe", "SET-CoOkIe", "set-cOOkIe", "Set-cOOkIe", "sEt-cOOkIe", "SEt-cOOkIe", "seT-cOOkIe", "SeT-cOOkIe", "sET-cOOkIe", "SET-cOOkIe", "set-COOkIe", "Set-COOkIe", "sEt-COOkIe", "SEt-COOkIe", "seT-COOkIe", "SeT-COOkIe", "sET-COOkIe", "SET-COOkIe", "set-cooKIe", "Set-cooKIe", "sEt-cooKIe", "SEt-cooKIe", "seT-cooKIe", "SeT-cooKIe", "sET-cooKIe", "SET-cooKIe", "set-CooKIe", "Set-CooKIe", "sEt-CooKIe", "SEt-CooKIe", "seT-CooKIe", "SeT-CooKIe", "sET-CooKIe", "SET-CooKIe", "set-cOoKIe", "Set-cOoKIe", "sEt-cOoKIe", "SEt-cOoKIe", "seT-cOoKIe", "SeT-cOoKIe", "sET-cOoKIe", "SET-cOoKIe", "set-COoKIe", "Set-COoKIe", "sEt-COoKIe", "SEt-COoKIe", "seT-COoKIe", "SeT-COoKIe", "sET-COoKIe", "SET-COoKIe", "set-coOKIe", "Set-coOKIe", "sEt-coOKIe", "SEt-coOKIe", "seT-coOKIe", "SeT-coOKIe", "sET-coOKIe", "SET-coOKIe", "set-CoOKIe", "Set-CoOKIe", "sEt-CoOKIe", "SEt-CoOKIe", "seT-CoOKIe", "SeT-CoOKIe", "sET-CoOKIe", "SET-CoOKIe", "set-cOOKIe", "Set-cOOKIe", "sEt-cOOKIe", "SEt-cOOKIe", "seT-cOOKIe", "SeT-cOOKIe", "sET-cOOKIe", "SET-cOOKIe", "set-COOKIe", "Set-COOKIe", "sEt-COOKIe", "SEt-COOKIe", "seT-COOKIe", "SeT-COOKIe", "sET-COOKIe", "SET-COOKIe", "set-cookiE", "Set-cookiE", "sEt-cookiE", "SEt-cookiE", "seT-cookiE", "SeT-cookiE", "sET-cookiE", "SET-cookiE", "set-CookiE", "Set-CookiE", "sEt-CookiE", "SEt-CookiE", "seT-CookiE", "SeT-CookiE", "sET-CookiE", "SET-CookiE", "set-cOokiE", "Set-cOokiE", "sEt-cOokiE", "SEt-cOokiE", "seT-cOokiE", "SeT-cOokiE", "sET-cOokiE", "SET-cOokiE", "set-COokiE", "Set-COokiE", "sEt-COokiE", "SEt-COokiE", "seT-COokiE", "SeT-COokiE", "sET-COokiE", "SET-COokiE", "set-coOkiE", "Set-coOkiE", "sEt-coOkiE", "SEt-coOkiE", "seT-coOkiE", "SeT-coOkiE", "sET-coOkiE", "SET-coOkiE", "set-CoOkiE", "Set-CoOkiE", "sEt-CoOkiE", "SEt-CoOkiE", "seT-CoOkiE", "SeT-CoOkiE", "sET-CoOkiE", "SET-CoOkiE", "set-cOOkiE", "Set-cOOkiE", "sEt-cOOkiE", "SEt-cOOkiE", "seT-cOOkiE", "SeT-cOOkiE", "sET-cOOkiE", "SET-cOOkiE", "set-COOkiE", "Set-COOkiE", "sEt-COOkiE", "SEt-COOkiE", "seT-COOkiE", "SeT-COOkiE", "sET-COOkiE", "SET-COOkiE", "set-cooKiE", "Set-cooKiE", "sEt-cooKiE", "SEt-cooKiE", "seT-cooKiE", "SeT-cooKiE", "sET-cooKiE", "SET-cooKiE", "set-CooKiE", "Set-CooKiE", "sEt-CooKiE", "SEt-CooKiE", "seT-CooKiE", "SeT-CooKiE", "sET-CooKiE", "SET-CooKiE", "set-cOoKiE", "Set-cOoKiE", "sEt-cOoKiE", "SEt-cOoKiE", "seT-cOoKiE", "SeT-cOoKiE", "sET-cOoKiE", "SET-cOoKiE", "set-COoKiE", "Set-COoKiE", "sEt-COoKiE", "SEt-COoKiE", "seT-COoKiE", "SeT-COoKiE", "sET-COoKiE", "SET-COoKiE", "set-coOKiE", "Set-coOKiE", "sEt-coOKiE", "SEt-coOKiE", "seT-coOKiE", "SeT-coOKiE", "sET-coOKiE", "SET-coOKiE", "set-CoOKiE", "Set-CoOKiE", "sEt-CoOKiE", "SEt-CoOKiE", "seT-CoOKiE", "SeT-CoOKiE", "sET-CoOKiE", "SET-CoOKiE", "set-cOOKiE", "Set-cOOKiE", "sEt-cOOKiE", "SEt-cOOKiE", "seT-cOOKiE", "SeT-cOOKiE", "sET-cOOKiE", "SET-cOOKiE", "set-COOKiE", "Set-COOKiE", "sEt-COOKiE", "SEt-COOKiE", "seT-COOKiE", "SeT-COOKiE", "sET-COOKiE", "SET-COOKiE", "set-cookIE", "Set-cookIE", "sEt-cookIE", "SEt-cookIE", "seT-cookIE", "SeT-cookIE", "sET-cookIE", "SET-cookIE", "set-CookIE", "Set-CookIE", "sEt-CookIE", "SEt-CookIE", "seT-CookIE", "SeT-CookIE", "sET-CookIE", "SET-CookIE", "set-cOokIE", "Set-cOokIE", "sEt-cOokIE", "SEt-cOokIE", "seT-cOokIE", "SeT-cOokIE", "sET-cOokIE", "SET-cOokIE", "set-COokIE", "Set-COokIE", "sEt-COokIE", "SEt-COokIE", "seT-COokIE", "SeT-COokIE", "sET-COokIE", "SET-COokIE", "set-coOkIE", "Set-coOkIE", "sEt-coOkIE", "SEt-coOkIE", "seT-coOkIE", "SeT-coOkIE", "sET-coOkIE", "SET-coOkIE", "set-CoOkIE", "Set-CoOkIE", "sEt-CoOkIE", "SEt-CoOkIE", "seT-CoOkIE", "SeT-CoOkIE", "sET-CoOkIE", "SET-CoOkIE", "set-cOOkIE", "Set-cOOkIE", "sEt-cOOkIE", "SEt-cOOkIE", "seT-cOOkIE", "SeT-cOOkIE", "sET-cOOkIE", "SET-cOOkIE", "set-COOkIE", "Set-COOkIE", "sEt-COOkIE", "SEt-COOkIE", "seT-COOkIE", "SeT-COOkIE", "sET-COOkIE", "SET-COOkIE", "set-cooKIE", "Set-cooKIE", "sEt-cooKIE", "SEt-cooKIE", "seT-cooKIE", "SeT-cooKIE", "sET-cooKIE", "SET-cooKIE", "set-CooKIE", "Set-CooKIE", "sEt-CooKIE", "SEt-CooKIE", "seT-CooKIE", "SeT-CooKIE", "sET-CooKIE", "SET-CooKIE", "set-cOoKIE", "Set-cOoKIE", "sEt-cOoKIE", "SEt-cOoKIE", "seT-cOoKIE", "SeT-cOoKIE", "sET-cOoKIE", "SET-cOoKIE", "set-COoKIE", "Set-COoKIE", "sEt-COoKIE", "SEt-COoKIE", "seT-COoKIE", "SeT-COoKIE", "sET-COoKIE", "SET-COoKIE", "set-coOKIE", "Set-coOKIE", "sEt-coOKIE", "SEt-coOKIE", "seT-coOKIE", "SeT-coOKIE", "sET-coOKIE", "SET-coOKIE", "set-CoOKIE", "Set-CoOKIE", "sEt-CoOKIE", "SEt-CoOKIE", "seT-CoOKIE", "SeT-CoOKIE", "sET-CoOKIE", "SET-CoOKIE", "set-cOOKIE", "Set-cOOKIE", "sEt-cOOKIE", "SEt-cOOKIE", "seT-cOOKIE", "SeT-cOOKIE", "sET-cOOKIE", "SET-cOOKIE", "set-COOKIE", "Set-COOKIE", "sEt-COOKIE", "SEt-COOKIE", "seT-COOKIE", "SeT-COOKIE", "sET-COOKIE", "SET-COOKIE"] };
  }
});

// node_modules/serverless-http/lib/provider/azure/sanitize-headers.js
var require_sanitize_headers2 = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/sanitize-headers.js"(exports, module2) {
    "use strict";
    var setCookieVariations = require_set_cookie().variations;
    module2.exports = function sanitizeHeaders(headers) {
      return Object.keys(headers).reduce((memo, key) => {
        const value = headers[key];
        if (Array.isArray(value)) {
          if (key.toLowerCase() === "set-cookie") {
            value.forEach((cookie, i) => {
              memo[setCookieVariations[i]] = cookie;
            });
          } else {
            memo[key] = value.join(", ");
          }
        } else {
          memo[key] = value == null ? "" : value.toString();
        }
        return memo;
      }, {});
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/format-response.js
var require_format_response2 = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/format-response.js"(exports, module2) {
    var isBinary = require_is_binary2();
    var Response = require_response();
    var sanitizeHeaders = require_sanitize_headers2();
    module2.exports = (response, options) => {
      const { statusCode } = response;
      const headers = sanitizeHeaders(Response.headers(response));
      if (headers["transfer-encoding"] === "chunked" || response.chunkedEncoding) {
        throw new Error("chunked encoding not supported");
      }
      const isBase64Encoded = isBinary(headers, options);
      const encoding = isBase64Encoded ? "base64" : "utf8";
      const body = Response.body(response).toString(encoding);
      return { status: statusCode, headers, isBase64Encoded, body };
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/index.js
var require_azure = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/index.js"(exports, module2) {
    var cleanupRequest = require_clean_up_request();
    var createRequest = require_create_request2();
    var formatResponse = require_format_response2();
    module2.exports = (options) => {
      return (getResponse) => async (context, req) => {
        const event = cleanupRequest(req, options);
        const request = createRequest(event, options);
        const response = await getResponse(request, context, event);
        context.log(response);
        return formatResponse(response, options);
      };
    };
  }
});

// node_modules/serverless-http/lib/provider/get-provider.js
var require_get_provider = __commonJS({
  "node_modules/serverless-http/lib/provider/get-provider.js"(exports, module2) {
    var aws = require_aws();
    var azure = require_azure();
    var providers = {
      aws,
      azure
    };
    module2.exports = function getProvider(options) {
      const { provider = "aws" } = options;
      if (provider in providers) {
        return providers[provider](options);
      }
      throw new Error(`Unsupported provider ${provider}`);
    };
  }
});

// node_modules/serverless-http/serverless-http.js
var require_serverless_http = __commonJS({
  "node_modules/serverless-http/serverless-http.js"(exports, module2) {
    "use strict";
    var finish = require_finish();
    var getFramework = require_get_framework();
    var getProvider = require_get_provider();
    var defaultOptions = {
      requestId: "x-request-id"
    };
    module2.exports = function(app, opts) {
      const options = Object.assign({}, defaultOptions, opts);
      const framework = getFramework(app);
      const provider = getProvider(options);
      return provider(async (request, ...context) => {
        await finish(request, options.request, ...context);
        const response = await framework(request);
        await finish(response, options.response, ...context);
        return response;
      });
    };
  }
});

// lib/index.ts
var lib_exports = {};
__export(lib_exports, {
  CdkUtils: () => CdkUtils,
  NextStandaloneStack: () => NextStandaloneStack,
  serverHandler: () => handler
});
module.exports = __toCommonJS(lib_exports);

// lib/server-handler/index.ts
var import_next_server = __toESM(require("next/dist/server/next-server"));
var import_serverless_http = __toESM(require_serverless_http());
var import_path = __toESM(require("path"));
process.chdir(__dirname);
process.env.NODE_ENV = "production";
var _a;
var nextConf = require(`${(_a = process.env.NEXT_CONFIG_FILE) != null ? _a : "./config.json"}`);
var config = {
  hostname: "localhost",
  port: Number(process.env.PORT) || 3e3,
  dir: import_path.default.join(__dirname),
  dev: false,
  customServer: false,
  conf: nextConf
};
var getErrMessage = (e) => ({ message: "Server failed to respond.", details: e });
var nextHandler = new import_next_server.default(config).getRequestHandler();
var server = (0, import_serverless_http.default)(
  async (req, res) => {
    await nextHandler(req, res).catch((e) => {
      console.error(`NextJS request failed due to:`);
      console.error(e);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(getErrMessage(e), null, 3));
    });
  },
  {
    binary: true,
    provider: "aws",
    basePath: process.env.NEXTJS_LAMBDA_BASE_PATH
  }
);
var handler = server;

// lib/cdk/stack.ts
var import_aws_cdk_lib9 = require("aws-cdk-lib");
var import_aws_certificatemanager2 = require("aws-cdk-lib/aws-certificatemanager");
var import_aws_cloudfront_origins2 = require("aws-cdk-lib/aws-cloudfront-origins");
var import_aws_route532 = require("aws-cdk-lib/aws-route53");

// lib/cdk/utils/apiGw.ts
var import_aws_apigatewayv2_alpha = require("@aws-cdk/aws-apigatewayv2-alpha");
var import_aws_apigatewayv2_integrations_alpha = require("@aws-cdk/aws-apigatewayv2-integrations-alpha");
var import_aws_cdk_lib = require("aws-cdk-lib");
var setupApiGateway = (scope, { imageLambda, imageBasePath, serverLambda, serverBasePath }) => {
  const apiGateway = new import_aws_apigatewayv2_alpha.HttpApi(scope, "ServerProxy");
  apiGateway.addRoutes({ path: `${serverBasePath}/{proxy+}`, integration: new import_aws_apigatewayv2_integrations_alpha.HttpLambdaIntegration("LambdaApigwIntegration", serverLambda) });
  apiGateway.addRoutes({ path: `${imageBasePath}/{proxy+}`, integration: new import_aws_apigatewayv2_integrations_alpha.HttpLambdaIntegration("ImagesApigwIntegration", imageLambda) });
  new import_aws_cdk_lib.CfnOutput(scope, "apiGwUrlServerUrl", { value: `${apiGateway.apiEndpoint}${serverBasePath}` });
  new import_aws_cdk_lib.CfnOutput(scope, "apiGwUrlImageUrl", { value: `${apiGateway.apiEndpoint}${imageBasePath}` });
  return apiGateway;
};

// lib/cdk/utils/cfnCertificate.ts
var import_aws_cdk_lib2 = require("aws-cdk-lib");
var import_aws_certificatemanager = require("aws-cdk-lib/aws-certificatemanager");
var setupCfnCertificate = (scope, { hostedZone, domainName }) => {
  const certificate = new import_aws_certificatemanager.DnsValidatedCertificate(scope, "Certificate", { domainName, hostedZone, region: "us-east-1" });
  new import_aws_cdk_lib2.CfnOutput(scope, "certificateArn", { value: certificate.certificateArn });
  return certificate;
};

// lib/cdk/utils/cfnDistro.ts
var import_aws_cdk_lib3 = require("aws-cdk-lib");
var import_aws_cloudfront = require("aws-cdk-lib/aws-cloudfront");
var import_aws_cloudfront_origins = require("aws-cdk-lib/aws-cloudfront-origins");
var setupCfnDistro = (scope, { apiGateway, imageBasePath, serverBasePath, assetsBucket, domainName, imageSettings, certificate, customApiOrigin }) => {
  var _a2;
  const apiGwDomainName = `${apiGateway.apiId}.execute-api.${scope.region}.amazonaws.com`;
  const serverOrigin = new import_aws_cloudfront_origins.HttpOrigin(apiGwDomainName, { originPath: serverBasePath });
  const imageOrigin = new import_aws_cloudfront_origins.HttpOrigin(apiGwDomainName, { originPath: imageBasePath });
  const assetsOrigin = new import_aws_cloudfront_origins.S3Origin(assetsBucket);
  const defaultOptions = {
    viewerProtocolPolicy: import_aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: import_aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS
  };
  const imagesCachePolicy = import_aws_cloudfront.CachePolicy.fromCachePolicyId(scope, "NextImageCachePolicy", "b0b8475c-e5ad-48ec-a9aa-ab4edce43324");
  const serverCachePolicy = import_aws_cloudfront.CachePolicy.fromCachePolicyId(scope, "NextServerCachePolicy", "dde765f7-44f6-4582-a848-865995f4d089");
  const apiCachePolicy = import_aws_cloudfront.CachePolicy.fromCachePolicyId(scope, "NextApiCachePolicy", "9aec2d57-3eb2-4ee6-8368-140faf94e0ba");
  const assetsCachePolicy = import_aws_cloudfront.CachePolicy.fromCachePolicyId(scope, "NextPublicCachePolicy", "f5792294-8244-4334-bb16-a9d8a4b26ed3");
  const cfnDistro = new import_aws_cloudfront.Distribution(scope, "CfnDistro", {
    defaultRootObject: "",
    comment: `CloudFront distribution for ${scope.stackName}`,
    enableIpv6: true,
    priceClass: import_aws_cloudfront.PriceClass.PRICE_CLASS_100,
    domainNames: domainName ? [domainName] : void 0,
    certificate,
    defaultBehavior: {
      origin: serverOrigin,
      allowedMethods: import_aws_cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: serverCachePolicy,
      viewerProtocolPolicy: import_aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
    },
    additionalBehaviors: {
      "/api*": {
        ...defaultOptions,
        origin: customApiOrigin != null ? customApiOrigin : serverOrigin,
        allowedMethods: import_aws_cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: apiCachePolicy
      },
      "_next/data/*": {
        ...defaultOptions,
        origin: serverOrigin
      },
      "_next/image*": {
        ...defaultOptions,
        origin: imageOrigin,
        cachePolicy: imagesCachePolicy,
        compress: true
      },
      "_next/*": {
        ...defaultOptions,
        origin: assetsOrigin
      },
      "assets/*": {
        ...defaultOptions,
        origin: assetsOrigin,
        cachePolicy: assetsCachePolicy
      },
      ...(_a2 = imageSettings == null ? void 0 : imageSettings.publicFilePaths) == null ? void 0 : _a2.reduce((acc, pathPattern) => {
        if (["assets/*", "_next/*"].includes(pathPattern)) {
          return acc;
        }
        return {
          ...acc,
          [pathPattern]: {
            ...defaultOptions,
            origin: assetsOrigin,
            cachePolicy: assetsCachePolicy
          }
        };
      }, {})
    }
  });
  new import_aws_cdk_lib3.CfnOutput(scope, "cfnDistroUrl", { value: cfnDistro.distributionDomainName });
  new import_aws_cdk_lib3.CfnOutput(scope, "cfnDistroId", { value: cfnDistro.distributionId });
  new import_aws_cdk_lib3.CfnOutput(scope, "domainName", { value: domainName || "<empty>" });
  return cfnDistro;
};

// lib/cdk/utils/dnsRecords.ts
var import_aws_cdk_lib4 = require("aws-cdk-lib");
var import_aws_route53 = require("aws-cdk-lib/aws-route53");
var import_aws_route53_targets = require("aws-cdk-lib/aws-route53-targets");
var setupDnsRecords = (scope, { dnsPrefix: recordName, hostedZone: zone, cfnDistro }) => {
  const target = import_aws_route53.RecordTarget.fromAlias(new import_aws_route53_targets.CloudFrontTarget(cfnDistro));
  const dnsARecord = new import_aws_route53.ARecord(scope, "AAliasRecord", { recordName, target, zone });
  const dnsAaaaRecord = new import_aws_route53.AaaaRecord(scope, "AaaaAliasRecord", { recordName, target, zone });
  new import_aws_cdk_lib4.CfnOutput(scope, "dns_A_Record", { value: dnsARecord.domainName });
  new import_aws_cdk_lib4.CfnOutput(scope, "dns_AAAA_Record", { value: dnsAaaaRecord.domainName });
};

// lib/cdk/utils/imageLambda.ts
var import_aws_cdk_lib5 = require("aws-cdk-lib");
var import_aws_lambda = require("aws-cdk-lib/aws-lambda");
var DEFAULT_MEMORY = 512;
var DEFAULT_TIMEOUT = 10;
var setupImageLambda = (scope, { assetsBucket, codePath, handler: handler2, layerPath, lambdaHash, memory = DEFAULT_MEMORY, timeout = DEFAULT_TIMEOUT }) => {
  const depsLayer = new import_aws_lambda.LayerVersion(scope, "ImageOptimizationLayer", {
    code: import_aws_lambda.Code.fromAsset(layerPath, {
      assetHash: lambdaHash + "_layer",
      assetHashType: import_aws_cdk_lib5.AssetHashType.CUSTOM
    })
  });
  const imageLambda = new import_aws_lambda.Function(scope, "ImageOptimizationNextJs", {
    code: import_aws_lambda.Code.fromAsset(codePath, {
      assetHash: lambdaHash + "_code",
      assetHashType: import_aws_cdk_lib5.AssetHashType.CUSTOM
    }),
    runtime: import_aws_lambda.Runtime.PYTHON_3_8,
    handler: handler2,
    memorySize: memory,
    timeout: import_aws_cdk_lib5.Duration.seconds(timeout),
    layers: [depsLayer],
    environment: {
      S3_BUCKET_NAME: assetsBucket.bucketName
    }
  });
  assetsBucket.grantRead(imageLambda);
  new import_aws_cdk_lib5.CfnOutput(scope, "imageLambdaArn", { value: imageLambda.functionArn });
  return imageLambda;
};

// lib/cdk/utils/redirect.ts
var import_aws_cdk_lib6 = require("aws-cdk-lib");
var import_aws_route53_patterns = require("aws-cdk-lib/aws-route53-patterns");
var setupApexRedirect = (scope, { sourceHostedZone, targetDomain }) => {
  new import_aws_route53_patterns.HttpsRedirect(scope, `ApexRedirect`, {
    zone: sourceHostedZone,
    targetDomain
  });
  new import_aws_cdk_lib6.CfnOutput(scope, "RedirectFrom", { value: sourceHostedZone.zoneName });
};

// lib/cdk/utils/s3.ts
var import_aws_cdk_lib7 = require("aws-cdk-lib");
var import_aws_s3 = require("aws-cdk-lib/aws-s3");
var import_aws_s3_deployment = require("aws-cdk-lib/aws-s3-deployment");
var setupAssetsBucket = (scope) => {
  const assetsBucket = new import_aws_s3.Bucket(scope, "NextAssetsBucket", {
    removalPolicy: import_aws_cdk_lib7.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    publicReadAccess: false
  });
  new import_aws_cdk_lib7.CfnOutput(scope, "assetsBucketUrl", { value: assetsBucket.bucketDomainName });
  new import_aws_cdk_lib7.CfnOutput(scope, "assetsBucketName", { value: assetsBucket.bucketName });
  return assetsBucket;
};
var uploadStaticAssets = (scope, { assetsBucket, assetsPath, cfnDistribution }) => {
  new import_aws_s3_deployment.BucketDeployment(scope, "PublicFilesDeployment", {
    destinationBucket: assetsBucket,
    sources: [import_aws_s3_deployment.Source.asset(assetsPath)],
    distribution: cfnDistribution,
    distributionPaths: ["/*"]
  });
};

// lib/cdk/utils/serverLambda.ts
var import_aws_cdk_lib8 = require("aws-cdk-lib");
var import_aws_lambda2 = require("aws-cdk-lib/aws-lambda");
var DEFAULT_MEMORY2 = 1024;
var DEFAULT_TIMEOUT2 = 20;
var setupServerLambda = (scope, { basePath, codePath, dependenciesPath, handler: handler2, memory = DEFAULT_MEMORY2, timeout = DEFAULT_TIMEOUT2 }) => {
  const depsLayer = new import_aws_lambda2.LayerVersion(scope, "DepsLayer", {
    code: import_aws_lambda2.Code.fromAsset(dependenciesPath)
  });
  const serverLambda = new import_aws_lambda2.Function(scope, "DefaultNextJs", {
    code: import_aws_lambda2.Code.fromAsset(codePath),
    runtime: import_aws_lambda2.Runtime.NODEJS_16_X,
    handler: handler2,
    layers: [depsLayer],
    memorySize: memory,
    timeout: import_aws_cdk_lib8.Duration.seconds(timeout),
    environment: {
      ...Object.entries(process.env).filter(([key]) => key.startsWith("NEXT_")).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      NEXTJS_LAMBDA_BASE_PATH: basePath
    }
  });
  new import_aws_cdk_lib8.CfnOutput(scope, "serverLambdaArn", { value: serverLambda.functionArn });
  return serverLambda;
};

// lib/cdk/stack.ts
var NextStandaloneStack = class extends import_aws_cdk_lib9.Stack {
  constructor(scope, id, config2) {
    var _a2, _b;
    super(scope, id, config2);
    console.log("CDK's config:", config2);
    const enabledRoute53 = (_a2 = config2.hostedZone) == null ? void 0 : _a2.endsWith(".ch");
    if (config2.hostedZone) {
      this.hostedZone = import_aws_route532.HostedZone.fromLookup(this, "HostedZone_certificate", { domainName: config2.hostedZone });
      this.domainName = config2.dnsPrefix ? `${config2.dnsPrefix}.${config2.hostedZone}` : config2.hostedZone;
    }
    console.log("Hosted zone:", this.hostedZone);
    console.log("Normalized domain name:", this.domainName);
    this.assetsBucket = this.setupAssetsBucket();
    this.imageSettings = config2.imageSettings;
    this.imageLambda = this.setupImageLambda({
      codePath: config2.imageHandlerZipPath,
      handler: config2.customImageHandler,
      assetsBucket: this.assetsBucket,
      lambdaHash: config2.imageLambdaHash,
      layerPath: config2.imageLayerZipPath,
      timeout: config2.imageLambdaTimeout,
      memory: config2.imageLambdaMemory
    });
    this.serverLambda = this.setupServerLambda({
      basePath: config2.apigwServerPath,
      codePath: config2.codeZipPath,
      handler: config2.customServerHandler,
      dependenciesPath: config2.dependenciesZipPath,
      timeout: config2.lambdaTimeout,
      memory: config2.lambdaMemory
    });
    this.apiGateway = this.setupApiGateway({
      imageLambda: this.imageLambda,
      serverLambda: this.serverLambda,
      imageBasePath: config2.apigwImagePath,
      serverBasePath: config2.apigwServerPath
    });
    if (!!config2.certificateArn) {
      this.cfnCertificate = import_aws_certificatemanager2.Certificate.fromCertificateArn(this, (_b = config2.certificateArn.split("/")) == null ? void 0 : _b[1], config2.certificateArn);
    } else if (!!this.hostedZone && !!this.domainName) {
      this.cfnCertificate = this.setupCfnCertificate({
        hostedZone: this.hostedZone,
        domainName: this.domainName
      });
    }
    this.cfnDistro = this.setupCfnDistro({
      assetsBucket: this.assetsBucket,
      apiGateway: this.apiGateway,
      imageBasePath: config2.apigwImagePath,
      serverBasePath: config2.apigwServerPath,
      domainName: this.domainName,
      certificate: this.cfnCertificate,
      customApiOrigin: config2.customApiDomain ? new import_aws_cloudfront_origins2.HttpOrigin(config2.customApiDomain) : void 0,
      imageSettings: this.imageSettings
    });
    this.uploadStaticAssets({
      assetsBucket: this.assetsBucket,
      assetsPath: config2.assetsZipPath,
      cfnDistribution: this.cfnDistro
    });
    if (enabledRoute53 && !!this.hostedZone && !!this.domainName) {
      this.setupDnsRecords({
        cfnDistro: this.cfnDistro,
        hostedZone: this.hostedZone,
        dnsPrefix: config2.dnsPrefix
      });
      if (!!config2.redirectFromApex) {
        this.setupApexRedirect({
          sourceHostedZone: this.hostedZone,
          targetDomain: this.domainName
        });
      }
    }
  }
  setupAssetsBucket() {
    return setupAssetsBucket(this);
  }
  setupApiGateway(props) {
    return setupApiGateway(this, props);
  }
  setupServerLambda(props) {
    return setupServerLambda(this, props);
  }
  setupImageLambda(props) {
    return setupImageLambda(this, props);
  }
  setupCfnDistro(props) {
    return setupCfnDistro(this, props);
  }
  setupCfnCertificate(props) {
    return setupCfnCertificate(this, props);
  }
  setupDnsRecords(props) {
    return setupDnsRecords(this, props);
  }
  setupApexRedirect(props) {
    return setupApexRedirect(this, props);
  }
  uploadStaticAssets(props) {
    return uploadStaticAssets(this, props);
  }
};

// lib/index.ts
var CdkUtils = {
  setupApiGateway,
  setupCfnCertificate,
  setupAssetsBucket,
  setupCfnDistro,
  setupDnsRecords,
  setupImageLambda,
  setupServerLambda,
  uploadStaticAssets
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CdkUtils,
  NextStandaloneStack,
  serverHandler
});
