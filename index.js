/*

Sample config.json

"accessories": [{
  "accessory": "Stub",
  "name": "Motion",
  "service": "motion",
  "interval": 10,
  "value": true
}, {
  "accessory": "Stub",
  "name": "Contact",
  "service": "Contact",
  "interval": 10
}]

*/

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
  this.service = config.service || "contact";
  this.value = config.value || false;
  this.interval = config.interval || "30"; // Every minute
}

function sendEvent() {
  if (this.value) {
    this.value = false;
  } else {
    this.value = true;
  }
  debug("Sending event", this.name, this.value);
  this.sensor.getCharacteristic(this.characteristic).updateValue(this.value);
}

StubAccessory.prototype = {
  getServices: function() {
    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, "sensor-stub")
      .setCharacteristic(Characteristic.Model, this.service)
      .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name)
      .setCharacteristic(Characteristic.FirmwareRevision, require('./package.json').version);

    switch (this.service.toLowerCase()) {
      case "motion":
        this.sensor = new Service.MotionSensor(this.name);
        this.characteristic = Characteristic.MotionDetected;
        // this.addCharacteristic(Characteristic.MotionDetected);

        break;
      case "contact":
        this.sensor = new Service.ContactSensor(this.name);
        this.characteristic = Characteristic.ContactSensorState;
        // this.addCharacteristic(Characteristic.ContactSensorState);
    }
    setInterval(sendEvent.bind(this), this.interval * 1000);

    return [this.sensor, informationService];
  }
};
