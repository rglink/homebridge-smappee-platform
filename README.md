# homebridge-smappee
Smappee platform plugin for [HomeBridge](https://github.com/nfarina/homebridge)

The plug-in currently loads the Smappee Comfort Plugs from the Smappee Energy Monitor and adds them as switches to HomeBridge/HomeKit. Each Comfort Plug can be assigned as being a switch, fan or lightbulb and will default to being a switch.

# Installation


1. Install homebridge using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-smappee-platform
3. Update your configuration file. See sample-config.json snippet below. 


# Configuration

Configuration sample:

 ```
"platforms": [
		{
			"platform": "Smappee",
			
			"ip" : "127.0.0.1",
			"password" : "admin"
		}
	],

```

Fields: 

* "platform": Must always be "Smappee" (required)

* "ip": The ip address of your Smappee. This can be found in your Smappee app >> More >> Smappee Energy >> Bottom line states web address, including ip address, for expert mode. (required)
* "password": Password used to login to Smappee expert mode, default: admin.
