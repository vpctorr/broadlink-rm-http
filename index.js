"use strict";

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const macRegExp = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const Broadlink = require('./device');

function sendData(device = false, hexData = false) {
    if (device === false || hexData === false) {
        return console.log('Missing params, sendData failed', typeof device, typeof hexData);
    }
    const hexDataBuffer = new Buffer(hexData, 'hex');
    device.sendData(hexDataBuffer);
}

module.exports = (commands, key, rooms) => {

    let app = express();

    app.use(helmet());
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.get('/learn/:key/:host', (req, res) => { // learn utility
		
		if (req.params.key !== key) {
            return res.json({error: `Key "${req.params.key}" not found`});
        }
			
        let host = req.params.host.toLowerCase();
        let device = Broadlink({ host, learnOnly: true });

        if(!device) {
            return res.json({error: `No device found at ${host}`});
        }

        if (!device.enterLearning) {
            return res.json({error:`The device at ${host} doesn't support learning IR codes`});
        }

        if (!device.enterLearning && !device.enterRFSweep) {
            return res.json({error:`The device at ${host} doesn't support learning RF codes`});
        }

        // do this part

            (device.cancelRFSweep && device.cancelRFSweep());

            let cancelLearning = () => {
                (device.cancelRFSweep && device.cancelRFSweep());
                device.removeListener('rawData', onRawData);

                clearTimeout(getTimeout);
                clearTimeout(getDataTimeout);
            };

            let getTimeout = setTimeout(() => {
                cancelLearning();
                res.json({error: 'Timeout.'});
            }, 20000);

            let getDataTimeout = setTimeout(() => {
                getData(device);
            }, 1000);

            const getData = (device) => {
                if (getDataTimeout) clearTimeout(getDataTimeout);
              
                device.checkData()
              
                getDataTimeout = setTimeout(() => {
                  getData(device);
                }, 1000);
            }

            let onRawData = (message) => {
                cancelLearning();

                return res.json({
                    command: "command_name",
                    group: "group_id",
                    data: message.toString('hex')
                });
            };

            device.on('rawData', onRawData);

            // Start learning:
            (device.enterLearning ? device.enterLearning() : device.enterRFSweep());
		
    });

    app.get('/execute/:key/:room/:name', (req, res) => { // execute command
        
        if (req.params.key !== key) {
            console.log(`Error while performing command "${req.params.name}": Key "${req.params.key}" not found`);
            return res.sendStatus(403);
        }
        
        if (!rooms[req.params.room]) {
            console.log(`Error while performing command "${req.params.name}": Room "${req.params.room}" not found`);
            return res.sendStatus(404);
        }
		
		let command = commands.find(o => o.command === req.params.name && rooms[req.params.room]["groups"].indexOf(o.group) > -1);
		
        if (!command) {
            console.log(`Error while performing command "${req.params.name}": Command not found`);
            return res.sendStatus(404);
        }
		
		let host = rooms[req.params.room]["host"].toLowerCase();
        let device = Broadlink({ host });

        if (!device) {
            console.log(`Error while performing command "${req.params.name}": No device found at ${host}`);
			return res.sendStatus(404);
        }

        if (!device.sendData) {
            console.log(`Error while performing command "${req.params.name}": The device at ${host} doesn't support sending IR or RF codes`);
            return res.sendStatus(501);
        }

        if (command.data && command.data.includes('5aa5aa555')) {
            console.log(`Error while performing command "${req.params.name}": Outdated code type, please use the Learn utility to get a new code`);
            return res.sendStatus(501);
        }
            
        if ('sequence' in command) {
            for (var i in command.sequence) {
                let find = command.sequence[i];
                let send = commands.find((e) => { return e.command === find; });
                if (send) {
                    setTimeout(() => {
                        console.log(`Sequence "${req.params.name}": Sending command "${send.command}"...`)
                        sendData(device, send.data);
                    }, 1000 * i);
                } else {
                    console.log(`Error while performing sequence "${req.params.name}": No command found`);
                    return res.sendStatus(404);
                }
            }
        } else {
            console.log(`Command "${req.params.name}": Sending command...`)
            sendData(device, command.data);
        }

        return res.sendStatus(200);
		
    });

    return app;

}