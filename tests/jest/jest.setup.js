// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

const { Response, Headers, Request } = require('whatwg-fetch');

global.Response = Response;
global.Headers = Headers;
global.Request = Request;