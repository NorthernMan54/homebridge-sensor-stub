/*

Sample config.json

"accessories": [
{
 "accessory": "Stub",
 "name": "Contact-Fault",
 "service": "Contact-fault",
 "interval": 10
},
{
 "accessory": "Stub",
 "name": "Contact-battery",
 "service": "Contact-battery",
 "interval": 10
},
{
 "accessory": "Stub",
 "name": "Contact-error",
 "service": "Contact-error",
 "interval": 10
},
{
 "accessory": "Stub",
 "name": "Contact-tamper",
 "service": "Contact-tamper",
 "interval": 10
},
{
 "accessory": "Stub",
 "name": "Contact-Reach",
 "service": "Contact-reach",
 "interval": 10
}]

*/

/* Contact Sensor Available Stateless

this.addOptionalCharacteristic(Characteristic.StatusActive);
this.addOptionalCharacteristic(Characteristic.StatusFault);
this.addOptionalCharacteristic(Characteristic.StatusTampered);
this.addOptionalCharacteristic(Characteristic.StatusLowBattery);

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
    this.sendValue = this.toggle.true;
  } else {
    this.value = true;
    this.sendValue = this.toggle.false;
  }
  debug("Sending event", this.name, this.value, this.sendValue);
  if (this.service.toLowerCase() === "contact-reach") {
    // this.updateReachability(this.value);
  } else {
    this.sensor.getCharacteristic(this.characteristic).updateValue(this.sendValue);
  }
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
        this.toggle = {
          "true": true,
          "false": false
        };
        break;
      case "contact":
        this.sensor = new Service.ContactSensor(this.name);
        this.characteristic = Characteristic.ContactSensorState;
        this.toggle = {
          "true": true,
          "false": false
        };
        break;
      case "contact-fault":
        this.sensor = new Service.ContactSensor(this.name);
        this.characteristic = Characteristic.StatusFault;
        this.toggle = {
          "true": Characteristic.StatusFault.NO_FAULT,
          "false": Characteristic.StatusFault.GENERAL_FAULT
        };
        break;
      case "contact-battery":
        this.sensor = new Service.ContactSensor(this.name);
        this.characteristic = Characteristic.StatusLowBattery;
        this.toggle = {
          "true": Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
          "false": Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
        };
        break;
      case "contact-tamper":
        this.sensor = new Service.ContactSensor(this.name);
        this.characteristic = Characteristic.StatusTampered;
        this.toggle = {
          "true": Characteristic.StatusTampered.NOT_TAMPERED,
          "false": Characteristic.StatusTampered.TAMPERED
        };
        break;
      case "contact-error":
        this.sensor = new Service.ContactSensor(this.name);
        this.characteristic = Characteristic.ContactSensorState;
        this.toggle = {
          "true": new Error("Error"),
          "false": 0
        };
        break;
      case "contact-reach":
        this.sensor = new Service.ContactSensor(this.name);
        this.characteristic = Characteristic.StatusFault;
        this.toggle = {
          "true": true,
          "false": false
        };
        break;
    }
    setInterval(sendEvent.bind(this), this.interval * 1000);

    this.log("Setting up", this.name, this.value, this.toggle);

    return [this.sensor, informationService];
  }
};
