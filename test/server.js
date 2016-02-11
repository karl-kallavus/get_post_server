'use strict';

require('should');
require('trace');
const path = require('path');
const request = require('request');

const server = require('../server');
const config = require('config');

const fs = require("fs");
const mock = require('mock-fs');

describe("GET/POST server", () => {

  before(done => {
    server.listen(3000, done);
  });

  after(done => {
    server.close(done);
  });

  beforeEach(() => {
    mock({
      [`${config.get('publicRoot')}`]: {
        'index.html': '<html></html>',
        'test.png': new Buffer([8, 6, 7, 5, 3, 0, 9])
      },
      '/test_upload.png': new Buffer([8, 6, 7, 5, 3, 0, 9])
    });
  });

  afterEach(() => {
    mock.restore();
  });


  describe("GET", () => {

    let url = 'http://localhost:3000/index.html';
    let nestedUrl = 'http://localhost:3000/nested/index.html';

    it("if /file exists then GET /file returns it", function(done) {
      request(url, function(error, response, body) {
        if (error) return done(error);
        response.statusCode.should.be.equal(200);
        body.should.not.be.empty;
        done();
      });
    });

    let url_image = 'http://localhost:3000/test.png';

    it("if /test.png exists then GET /test.png returns it with correct mime", function(done) {
      request(url_image, function(error, response, body) {
        if (error) return done(error);
        response.statusCode.should.be.equal(200);
        response.should.be.image;
        done();
      });
    });

    it("if /path/is/nested returns 400", function(done) {
      request(nestedUrl, function(error, response, body) {
        if (error) return done(error);
        response.statusCode.should.be.equal(400);
        done();
      });
    });

    it("if files does not exist returns status 404", function(done) {
      request('http://localhost:3000/no-such-file.html', function(error, response, body) {
        if (error) return done(error);
        response.statusCode.should.be.equal(404);
        done();
      });
    });
  });

  describe("POST", () => {
    it("when POST /new-file, saves it and returns 200", (done) => {
      let url = 'http://localhost:3000/test_upload.png';

      let fstream = fs.createReadStream('/test_upload.png');

      let req = request.post(url, function(error, response, body) {
        if (error) return done(error);
        response.statusCode.should.be.equal(200);
        done();
      });

      fstream
        .pipe(req);
    });

    it("when POST /existing-file, returns 409", (done) => {
      let url = 'http://localhost:3000/test.png';

      let fstream = fs.createReadStream('/test_upload.png');

      let req = request.post(url, function(error, response, body) {
        if (error) return done(error);
        response.statusCode.should.be.equal(409);
        done();
      });

      fstream
        .pipe(req);
    });


  });
});
