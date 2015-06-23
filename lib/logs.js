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

var getLogs = function(cwlogs, groupName, argv, nextToken, runningCount) {

  if(argv.limit === 0 ) {
    console.log('Limit reached');
    return console.log('Retrieved ' + runningCount + ' log entries');
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

  var dateFormat = argv.format;

  if(argv.since) {
    var sinceTime = moment(argv.since, dateFormat).valueOf();
    if(sinceTime > 0) {
      params.startTime = sinceTime;
    } else {
      console.log('WARNING: Error parsing --since "' + argv.since + '" against format ' + dateFormat);
    }

  }

  if(argv.until) {
    var endTime = moment(argv.until, dateFormat).valueOf();
    if(endTime > 0) {
      params.endTime = end;
    } else {
      console.log('WARNING: Error parsing --until "' + argv.until + '" against format ' + dateFormat);
    }
  }

  if(argv.filterStatus) {
    params.filterPattern = '[..., status='+argv.filterStatus+', size, referrer, agent]';
  }

  if(nextToken) {
    params.nextToken = nextToken;
  }

  if(!runningCount) {
    runningCount = 0;
  }

  cwlogs.filterLogEvents(params, function(err, data) {
    if(err) throw err;
    data.events.forEach(function(event) {
      console.log(event.message);
    });

    runningCount = runningCount + data.events.length;

    if(data.nextToken) {
      return getLogs(cwlogs, groupName, argv, data.nextToken, runningCount);
    }

    console.log('');
    console.log('Retrieved ' + runningCount + ' log entries');
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
