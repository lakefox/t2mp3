#!/usr/bin/env node

const url = require('./url.js');
const ssml = require('./ssml.js');
const text = require('./text.js');

let version = process.argv[2];

if (version == "url") {
  url();
} else if (version == "ssml") {
  ssml();
} else if (version == "text") {
  text();
}
