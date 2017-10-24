/**
 * Created by rglink on 23/10/17.
 * Used homebridge-nest by KraigM as baseline
 */

var inherits = require('util').inherits;
var Promise = require('bluebird');
var Accessory, Service, Characteristic, Away, uuid;

'use strict';

module.exports = function(exportedTypes) {
    if (exportedTypes && !Accessory) {
        Accessory = exportedTypes.Accessory;
        Service = exportedTypes.Service;
        Characteristic = exportedTypes.Characteristic;
        uuid = exportedTypes.uuid;

        var acc = SmappeeDeviceAccessory.prototype;
        inherits(SmappeeDeviceAccessory, Accessory);
        SmappeeDeviceAccessory.prototype.parent = Accessory.prototype;
        for (var mn in acc) {
            SmappeeDeviceAccessory.prototype[mn] = acc[mn];
        }
    }
    return SmappeeDeviceAccessory;
};

// Base type for Smappee devices
function SmappeeDeviceAccessory(log, device) {

    // device info
    this.name = device.name;
    this.deviceId = device.id;
    this.log = log;
    this.device = device;

    var id = uuid.generate('smappee.' + this.deviceType + '.' + this.deviceId);
    Accessory.call(this, this.name, id);
    this.uuid_base = id;

    var infoSvc = this.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Model, "Smappee " + this.deviceType)
        .setCharacteristic(Characteristic.SerialNumber, " ")
        .setCharacteristic(Characteristic.Manufacturer, "Smappee");

    this.boundCharacteristics = [];

    this.updateData();
}

SmappeeDeviceAccessory.prototype.getServices = function () {
    return this.services;
};

SmappeeDeviceAccessory.prototype.bindCharacteristic = function (service, characteristic, desc, getFunc, setFunc, format) {
    var actual = service.getCharacteristic(characteristic)
        .on('get', function (callback) {
            var val = getFunc.bind(this)();
            if (callback) callback(null, val);
        }.bind(this))
        .on('change', function (change) {
            var disp = change.newValue;
            if (format && disp != null) {
                disp = format(disp);
            }
            this.log(desc + " for " + this.name + " is: " + disp);
        }.bind(this));
    if (setFunc) {
        actual.on('set', function (value, callback) {
            this.plugSetValue = value;
            var val = setFunc.bind(this)();
            if (callback) callback(null, val);
        }.bind(this));
    }
    this.boundCharacteristics.push([service, characteristic]);
};

SmappeeDeviceAccessory.prototype.updateData = function (device) {
    if (device) {
        this.device = device;
    }
    this.boundCharacteristics.map(function (c) {
        c[0].getCharacteristic(c[1]).getValue();
    });
};

SmappeeDeviceAccessory.prototype.updateDevicePropertyAsync = function(property, value, propertyDescription, valueDescription) {
    propertyDescription = propertyDescription || property;
    valueDescription = valueDescription || value;
    this.log("Setting " + propertyDescription + " for " + this.name + " to: " + valueDescription);
    return this.conn.update(this.getDevicePropertyPath(property), value)
        .return(value);
};
