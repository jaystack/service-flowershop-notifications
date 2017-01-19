const main = require('./lib/index').default;
const express = require('express');
const app = express();

app.listen(3005, () => {
  console.log('Email app listening on port 3005!');
  main();
})