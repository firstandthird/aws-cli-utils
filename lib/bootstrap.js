var AWS = require('aws-sdk');

var argv = require('yargs')
  .alias('p', 'profile')
  .default('environment', 'default')
  .alias('r', 'region')
  .default('region', 'us-east-1')
  .alias('g', 'group-name')
  .alias('s', 'stream-name')
  .default('streams', false)
  .argv;

var action = argv._.shift();
var profile = argv.profile;
var region = argv.region;
var key = argv.key;
var secret = argv.secret;

var configObj = null;

if(key && secret && profile === 'default') {
  AWS.config.update({accessKeyId: key, secretAccessKey: secret});
} else {
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: profile });
}

module.exports = {
  action: action,
  aws: AWS,
  region: region,
  argv: argv
};
