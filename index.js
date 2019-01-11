var Service, Characteristic;

var debug = require('debug')('Stub');
var os = require("os");
var hostname = os.hostname();

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-sensor-stub", "Stub", StubAccessory);
};

function StubAccessory(log, config) {
  this.log = log;
  this.config = config;
  this.name = config.name;
  this.refresh = config.refresh || "60"; // Every minute
}

StubAccessory.prototype = {

  getDHTTemperature: function(callback) {
    exec(dhtExec, ['-g', this.gpio], function(error, responseBody, stderr) {
      if (error !== null) {
        this.log('dhtExec function failed: ' + error);
        callback(error);
      } else {
        // dht22 output format - gives a 3 in the first column when it has troubles
        // 0 24.8 C 50.3 %
        var result = responseBody.toString().split(/[ \t]+/);
        var temperature = parseFloat(result[1]);
        var humidity = parseFloat(result[3]);

        //                this.humidity = humidity;
        this.log("DHT Status: %s, Temperature: %s, Humidity: %s", result[0], temperature, humidity);


        this.log_event_counter = this.log_event_counter + 1;
        if (this.log_event_counter > 59) {
          if (this.spreadsheetId) {
            this.logger.storeDHT(this.name, result[0], temperature, humidity);
          }
          this.log_event_counter = 0;
        }

        var err;
        if (parseInt(result[0]) !== 0) {
          this.log.error("Error: dht22 read failed with status %s", result[0]);
          err = new Error("dht22 read failed");
          humidity = err;
        } else {

          this.loggingService.addEntry({
            time: moment().unix(),
            temp: temperature,
            humidity: humidity
          });

        }
        this.humidityService
          .getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(humidity);
        callback(err, temperature);
      }
    }.bind(this));
  },

  getTemperature: function(callback) {
    exec(cputemp, function(error, responseBody, stderr) {
      if (error !== null) {
        this.log('cputemp function failed: ' + error);
        callback(error);
      } else {
        var binaryState = parseFloat(responseBody);
        this.log("Got Temperature of %s", binaryState);

        callback(null, binaryState);
      }
    }.bind(this));
  },


  identify: function(callback) {
    this.log("Identify requested!");
    callback(); // success
  },

  getServices: function() {

    // you can OPTIONALLY create an information service if you wish to override
    // the default values for things like serial number, model, etc.
    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, "sensor-stub")
      .setCharacteristic(Characteristic.Model, this.service)
      .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name)
      .setCharacteristic(Characteristic.FirmwareRevision, require('./package.json').version);

    switch (this.service) {

      case "Temperature":
        this.temperatureService = new Service.TemperatureSensor(this.name);
        this.temperatureService
          .getCharacteristic(Characteristic.CurrentTemperature)
          .setProps({
            minValue: -100,
            maxValue: 100
          })
          .on('get', this.getTemperature.bind(this));

        setInterval(function() {
          this.getTemperature(function(err, temp) {
            if (err)
              temp = err;
            this.temperatureService
              .getCharacteristic(Characteristic.CurrentTemperature).updateValue(temp);
          }.bind(this));

        }.bind(this), this.refresh * 1000);

        return [informationService, this.temperatureService];
      case "dht22":
        this.dhtService = new Service.TemperatureSensor(this.name_temperature);
        this.dhtService
          .getCharacteristic(Characteristic.CurrentTemperature)
          .setProps({
            minValue: -100,
            maxValue: 100
          });

        this.humidityService = new Service.HumiditySensor(this.name_humidity);

        this.dhtService.log = this.log;
        this.loggingService = new FakeGatoHistoryService("weather", this.dhtService, {
          storage: this.storage,
          minutes: this.refresh * 10 / 60
        });

        setInterval(function() {
          this.getDHTTemperature(function(err, temp) {
            if (err)
              temp = err;
            this.dhtService
              .getCharacteristic(Characteristic.CurrentTemperature).updateValue(temp);
          }.bind(this));

        }.bind(this), this.refresh * 1000);

        this.getDHTTemperature(function(err, temp) {
          this.dhtService
            .setCharacteristic(Characteristic.CurrentTemperature, temp);
        }.bind(this));
        return [this.dhtService, informationService, this.humidityService, this.loggingService];

    }
  }
};
