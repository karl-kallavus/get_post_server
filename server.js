'use strict';

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const config = require('config');
const mime = require('mime');


const server = new http.Server();


server.on('request', (req, res) => {

  let urlParsed = url.parse(req.url);
  let filename = decodeURI(urlParsed.pathname.slice(1));

  try {
    filename = decodeURIComponent(filename); // %D1%8F
  } catch (e) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  if (~filename.indexOf('\0')) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  if (filename.includes('/') || filename.includes('..')) {
    res.statusCode = 400;
    res.end('Nested paths are not allowed');
  }

  let filepath = path.join(config.get('publicRoot'), filename);

  if (req.method == 'GET') {
    sendFileSafe(filepath, res);
  }
  if (req.method == 'POST') {
    uploadFile(filepath, req, res);
  }
});


function uploadFile(filePath, req, res) {
  let fileStream = new fs.createWriteStream(filePath, {
    flags: 'wx'
  });
  req.pipe(fileStream);

  let hadErrors = false;


  fileStream.on('error', (err) => {
    if (err.code == 'EEXIST') {
      res.statusCode = 409;
      res.end('File already exists');
    } else {
      res.statusCode = 500;
      res.end('Server Error');
      console.error(err);
      hadErrors = true;
      fs.unlink(filePath, err => { /* удалить недокачанный файл */ });
    }
  });
  fileStream.on('finish', () => {
    if (!hadErrors) {
      res.end('Ok');
    }
  });

  req.on('close', () => {
    hadErrors = true;
    fileStream.destroy();
    fs.unlink(filePath, err => { /* удалить недокачанный файл */ });
  });

}

function sendFileSafe(filePath, res) {
  if (filePath.indexOf(config.get('publicRoot')) != 0) {
    res.statusCode = 404;
    res.end('File not found');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.end('File not found');
      return;
    }

    sendFile(filePath, res);
  });
}

function sendFile(filePath, res) {
  let file = new fs.ReadStream(filePath);

  let mime_field = mime.lookup(filePath); // npm install mime
  res.setHeader('Content-Type', mime_field + '; charset=utf-8'); // text/html image/jpeg

  file.pipe(res);

  file.on('error', (err) => {
    res.statusCode = 500;
    res.end('Server Error');
  });

  res.on('close', () => {
    file.destroy();
  });
}

module.exports = server;
