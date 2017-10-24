/**
 * Created by rglink on 23/10/17.
 * Used homebridge-nest by KraigM as baseline
 */

var inherits = require('util').inherits;
var Accessory, Service, Characteristic, Away, uuid;
var SmappeeDeviceAccessory = require('./smappee-device-accessory')();

'use strict';

module.exports = function(exportedTypes) {
	if (exportedTypes && !Accessory) {
		Accessory = exportedTypes.Accessory;
		Service = exportedTypes.Service;
		Characteristic = exportedTypes.Characteristic;
		uuid = exportedTypes.uuid;

		var acc = SmappeePlugAccessory.prototype;
		inherits(SmappeePlugAccessory, SmappeeDeviceAccessory);
		SmappeePlugAccessory.prototype.parent = SmappeeDeviceAccessory.prototype;
		for (var mn in acc) {
			SmappeePlugAccessory.prototype[mn] = acc[mn];
		}

		SmappeePlugAccessory.deviceType = 'comfortplug';
		SmappeePlugAccessory.deviceGroup = 'switches';
		SmappeePlugAccessory.prototype.deviceType = SmappeePlugAccessory.deviceType;
		SmappeePlugAccessory.prototype.deviceGroup = SmappeePlugAccessory.deviceGroup;
	}
	return SmappeePlugAccessory;
};

function SmappeePlugAccessory(config, log, device) {
	this.smappeeconfig = config;
	this.log = log;
    SmappeeDeviceAccessory.call(this, log, device);

    var switchSvc = this.addService(Service.Switch);
    this.switchSvc = switchSvc;

    this.bindCharacteristic(switchSvc, Characteristic.On, "State",
        getPlugState.bind(this), setPlugState.bind(this));
    this.bindCharacteristic(switchSvc, Characteristic.Name, "Name",
        function() {
        	return "Plug " + device.name; });

    this.updateData();

    //console.log(this.services);
}

/* Get current switch state */

var getPlugState = function() {
    return this.device.state;
};

/* Set current switch state */

var setPlugState = function() {
	that = this;
	state = (that.plugSetValue ? 1 : 0);
	that.log('Setting state for Plug ' + that.device.name + ' to: ' + (that.plugSetValue ? 'on' : 'off'));

	// Re-establish connection and logon to make sure changes can be made
	// No need fo re-check on config file, should otherwise have failed by now
	var SmappeeConnection = require('./smappee-connection.js');
	var conn = new SmappeeConnection(that.smappeeconfig, that.log);
	conn.setPlug(that.log, that.smappeeconfig.password, that.device.id, state)
		.then(function(response){
			that.device.state = that.plugSetValue;
			that.updateData();
		})
		.catch(function(err){
			console.log('Err: \n' + err);
		})
};