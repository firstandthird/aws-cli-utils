var Table = require('cli-table');

module.exports = function(aws, region, argv) {

  var ec2 = new aws.EC2({ region: region });

  ec2.describeInstances({}, function(err, data) {
    if (err) {
      throw err;
    }

    var table = new Table({
      head: ['Name', 'State', 'Public DNS', 'Public IP']
    });

    data.Reservations.forEach(function(reservation) {

      reservation.Instances.forEach(function(instance) {
        // console.log(instance);
        var name = instance.Tags.filter(function(tag) {
          return tag.Key == 'Name';
        })[0].Value;

        var dns = instance.PublicDnsName;
        var ip = instance.PublicIpAddress;

        table.push([name, instance.State.Name, dns, ip]);

      });

    });

    console.log(table.toString());
  });
}
