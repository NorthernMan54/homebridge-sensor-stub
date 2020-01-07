This is regression test package I created to simulate a contact and motion sensor for use in testing events with homebridge-alexa


## Config.JSON


```
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
```

### options

* name - device name for the Home app
* service - Sensor type to create, only supports `motion` or `contact`
* interval - in seconds of state changes, defaults to 30 seconds
* value - initial state of sensor, defaults to false
