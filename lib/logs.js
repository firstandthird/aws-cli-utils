var Table = require('cli-table');
var moment = require('moment');
var filesize = require('filesize');

var getGroups = function(cwlogs) {
  cwlogs.describeLogGroups({}, function(err, data) {
    if (err) throw err; // an error occurred

    var table = new Table({
      head: ['Name', 'Created', 'Size']
    });

    data.logGroups.forEach(function(group) {
      var name = group.logGroupName;
      var created = moment(group.creationTime);
      var size = filesize(group.storedBytes);
      table.push([name, created.format('YYYY-MM-DD HH:MM:SS'), size]);
    });

    console.log(table.toString());

  });
}

var getStreams = function(cwlogs, params) {
  cwlogs.describeLogStreams(params, function(err, data) {
    if (err) throw err; // an error occurred

    var table = new Table({
      head: ['Name', 'Created', 'Size']
    });

    data.logStreams.forEach(function(stream) {
      var name = stream.logStreamName;
      var created = moment(stream.creationTime);
      var size = filesize(stream.storedBytes);

      table.push([name, created.format('YYYY-MM-DD HH:MM:SS'), size]);
    });

    console.log(table.toString());
  });
}

var getLogs = function(cwlogs, params, nextToken) {
  cwlogs.getLogEvents(params, function(err, data) {
    if (err) throw err; // an error occurred

    console.log(data);
  });
}


// Sort of the 'controller' isn't it.
module.exports = function(aws, region, argv) {

  console.log(argv);

  var cwlogs = new aws.CloudWatchLogs({ region: region });

  if(argv.streams && argv.groupName) {
    var params = {
      logGroupName: argv.groupName
    };
    return getStreams(cwlogs, params);
  }

  if(argv.groupName && argv.streamName) {
    var params = {
      logGroupName: argv.groupName,
      logStreamName: argv.streamName
    };

    return getLogs(cwlogs, params, null);
  }

  getGroups(cwlogs);

}
