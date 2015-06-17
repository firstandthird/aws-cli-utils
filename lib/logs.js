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


// Sort of the 'controller' isn't it.
module.exports = function(aws, region, argv) {

  var cwlogs = new aws.CloudWatchLogs({ region: region });

  getGroups(cwlogs);

}
