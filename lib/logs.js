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

var getLogs = function(cwlogs, groupName, argv, nextToken) {

  if(argv.limit === 0 ) {
    return console.log('Limit reached');
  }

  var params = {
    logGroupName: groupName,
    interleaved: true
  };

  if(argv.limit != '*') {
    var limit = parseInt(argv.limit);

    if(limit <= 10000 && nextToken !== null) {
      argv.limit = 0;
    }

    if(limit > 10000) {
      argv.limit = (limit - 10000);
      limit = 10000;
    }

    params.limit = limit;
  }

  if(argv.since) {
    params.startTime = moment(argv.since).unix();
  }

  if(argv.filterStatus) {
    params.filterPattern = '[..., status='+argv.filterStatus+', size, referrer, agent]';
  }

  if(nextToken) {
    params.nextToken = nextToken;
  }

  cwlogs.filterLogEvents(params, function(err, data) {
    if(err) throw err;
    data.events.forEach(function(event) {
      console.log(event.message);
    });

    if(data.nextToken) {
      getLogs(cwlogs, groupName, argv, data.nextToken);
    }
  });
}


// Sort of the 'controller' isn't it.
module.exports = function(aws, region, argv) {

  var cwlogs = new aws.CloudWatchLogs({ region: region });

  if(argv.streams && argv.groupName) {
    return getStreams(cwlogs, [argv.groupName]);
  }

  if(argv.groupName) {
    return getLogs(cwlogs, argv.groupName, argv);
  }

  getGroups(cwlogs, argv.streams);

}
