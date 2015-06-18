#!/usr/bin/env node

var conf = require('./lib/bootstrap');

var action = conf.action;
var aws = conf.aws;
var region = conf.region;
var argv = conf.argv;


switch(action) {
  case 'ec2':
    var act = require('./lib/ec2');
  break;
  case 'log':
    var act = require('./lib/logs');
  break;
  default:
   var act = require('./lib/help');
}



act(aws, region, argv);


// try {
//  act(aws, region, argv);
// } catch(e) {
//   console.log(e);
// }
