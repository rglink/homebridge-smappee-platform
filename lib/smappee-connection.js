/**
 * Created by rglink on 23/10/17.
 * Used homebridge-nest by KraigM as baseline
 */

var Promise = require('bluebird');
var rp = require('request-promise');

'use strict';

module.exports = Connection;

var logPrefix = "[SmappeeConnect] ";

function Connection(config, log) {
	this.config = config;
	this.url = 'http://' + config['ip'] + '/gateway/apipublic/';
	this.log = function(info) {
		log(logPrefix + info);
	};
	this.debug = function(info) {
		log.debug(logPrefix + info);
	};
	this.error = function(info) {
		log.error(logPrefix + info);
	};
}

Connection.prototype.auth = function(password) {
	return rp({
		method: 'POST',
		uri: this.url + 'logon',
		body: password
	})
	.then(function (parsedBody) {
		var body = JSON.parse(parsedBody);
		return body;
	}.bind(this));
};

Connection.prototype.getPlugs = function() {
	return rp({
		method: 'POST',
		uri: this.url + 'commandControlPublic',
		body: 'load'
	})
	.then(function (parsedBody) {
		var body = JSON.parse(parsedBody);
		return body;
	}.bind(this));
};

Connection.prototype.setPlug = function(log, password, id, state) {
	var auth = rp({
		method: 'POST',
		uri: this.url + 'logon',
		body: password
	})
	.then(function (parsedBody) {
		var body = JSON.parse(parsedBody);
		return body;
	}.bind(this));

	var post = rp({
		method: 'POST',
		uri: this.url + 'commandControlPublic',
		body: 'control,controlId=' + state + '|' + id
	})
	.then(function (parsedBody) {
		var body = JSON.parse(parsedBody);
		return body;
	}.bind(this));

	return Promise.all([auth, post]).then(function([auth, plugData]) {
		if ('error' in auth) {
			if (log) log.warn(response.error);
		}
		if (plugData) {
			return plugData;
		}else{
			return false;
		}
	});
};