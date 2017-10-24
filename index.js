/**
 * Created by rglink on 23/10/17.
 * Used homebridge-nest by KraigM as baseline
 */

var SmappeeConnection = require('./lib/smappee-connection.js');
var crypto = require('crypto'),
    algorithm = 'aes192',
    password = 'Smappee';

var Service, Characteristic, Accessory, uuid, Away;
var DeviceAccessory, ThermostatAccessory, ProtectAccessory, CamAccessory;

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	Accessory = homebridge.hap.Accessory;
	uuid = homebridge.hap.uuid;

	var exportedTypes = {
		Accessory: Accessory,
		Service: Service,
		Characteristic: Characteristic,
		uuid: uuid
	}

	DeviceAccessory = require('./lib/smappee-device-accessory.js')(exportedTypes);
	PlugAccessory = require('./lib/smappee-comfortplugs.js')(exportedTypes);

	homebridge.registerPlatform("homebridge-smappee-platform", "Smappee", SmappeePlatform);
}

function SmappeePlatform(log, config) {
	// auth info
	if (config.hasOwnProperty("password")) {
	  this.password = config["password"];
	} else {
	  this.password = "admin";
	}
	
	this.url = 'http://' + config["ip"] + '/gateway/apipublic/';
	this.config = config;
	this.plugSetValue = false;

	this.log = log;
	this.accessoryLookup = {};
	this.accessoryLookupByStructureId = {};
}

var setupConnection = function(config, log) {
	return new Promise(function (resolve, reject) {
		var ip = config["ip"];
		var password = config["password"];
		var loggedOn = false;

		var err;
		if (!ip && !password) {
			err = "You did not specify {'ip','password'}, which are required to connect to smappee";
		} else if (!ip) {
			err = "You did not specify your smappee IP address";
		} else if (!password) {
			err = "You did not supply your smappee password";
		}
		if (err) {
			reject(new Error(err));
			return;
		}

		if(ip && password) {
			var conn = new SmappeeConnection(config, log);

			conn.auth(password)
				.then(function(response) {
					if ('error' in response) {
						if (log) log.warn(response.error);
					} else {
						if (log) log.warn(response.success);
						this.loggedOn = true;
					}
					resolve(conn);
				})
				.catch(function(err){
					reject(err);
					that.log.error(err);
				});
		}
	});
};

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function correctPlugData(plugs) {
	var correctPlugs = {};
	plugs.forEach(function(product, index) {
		deviceID = encrypt('plug' + product.key);
		correctPlugs[deviceID] = {
			'device_id': deviceID,
			'id': product.key,
			'name': product.value.trim(),
			'state': false,
			'DeviceType': 'comfortplug'};
	});

	return correctPlugs;
}

SmappeePlatform.prototype = {
	accessories: function (callback) {
		this.log("Fetching Smappee devices.");

		var that = this;

		var generateAccessories = function(data) {
			var foundAccessories = [];

			var loadDevices = function(DeviceType) {
				var list = data.devices && data.devices[DeviceType.deviceGroup];
				for (var deviceId in list) {
					if (list.hasOwnProperty(deviceId)) {
						var device = list[deviceId];
						var accessory = new DeviceType(this.config, this.log, device);
						that.accessoryLookup[deviceId] = accessory;
						foundAccessories.push(accessory);
					}
				}
			}.bind(this);

			loadDevices(PlugAccessory);

			return foundAccessories;
		}.bind(this);

		var updateAccessories = function(data, accList) {
			accList.map(function(acc) {
				var device = data.devices[acc.deviceGroup][acc.deviceId];
				acc.updateData(device);
			}.bind(this));
		};

		var handleUpdates = function(data){
			updateAccessories(data, that.accessoryLookup);
		};

		setupConnection(this.config, this.log)
			.then(function(conn){
				that.conn = conn;
			})
			.then(function(){
				if(loggedOn) {
					var getPlugs = that.conn.getPlugs()
							.then(function(response) {
								return correctPlugData(response);
							})
							.catch(function(err){
								that.log.error(err);
								return false;
							});

					// When additional data needs to be added, add promise for other items both var (getPlugs) and result (plugData)
					return Promise.all([getPlugs]).then(function([plugData]) {
						data = {};
				    	data['switches'] = plugData;

				    	data = {'devices': data};

				    	that.accessoryLookup = generateAccessories(data);
				    	if (callback) {
							var copy = that.accessoryLookup.map(function (a) { return a; });
							callback(copy);
						}
				    });
				}
			})
			.catch(function(err) {
				that.log.error(err);
			});
	}
}