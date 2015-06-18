var Table = require('cli-table');
var moment = require('moment');
var filesize = require('filesize');

var async = require('async');

var getGroups = function(cwlogs, showStreams) {
  cwlogs.describeLogGroups({}, function(err, data) {
    if (err) throw err; // an error occurred

    if(showStreams) {
      var groups = [];
      data.logGroups.forEach(function(group) {
        groups.push(group.logGroupName);
      });

      return getStreams(cwlogs, groups);
    }

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

var getStreams = function(cwlogs, groups) {

  if(!Array.isArray(groups)) {
    groups = [groups];
  }

  var table = new Table({
    head: ['No', 'Group Name', 'Name', 'Created', 'Size']
  });

  var count = 1;

  async.eachSeries(groups, function(group, next) {
    cwlogs.describeLogStreams({logGroupName: group}, function(err, data) {
      if(err) {
        return next(err);
      }

      data.logStreams.forEach(function(stream) {
        var name = stream.logStreamName;
        var created = moment(stream.creationTime);
        var size = filesize(stream.storedBytes);

        table.push([count, group, name, created.format('YYYY-MM-DD HH:MM:SS'), size]);

        count = count + 1;
      });

      next();
    });
  }, function(err) {
    if(err) throw err;

    console.log( table.toString() );
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

  var cwlogs = new aws.CloudWatchLogs({ region: region });

  if(argv.groupName && argv.streamName) {
    var params = {
      logGroupName: argv.groupName,
      logStreamName: argv.streamName
    };

    return getLogs(cwlogs, params, null);
  }

  if(argv.streams && argv.groupName) {
    return getStreams(cwlogs, [argv.groupName]);
  }

  getGroups(cwlogs, argv.streams);

}
