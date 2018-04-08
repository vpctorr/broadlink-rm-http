# broadlink-rm-http
A Web server to control IR & RF devices using Broadlink RM. Can be used for custom applications or with IFTTT to add Google Home, Alexa & HomeKit support (tutorial below).

# Getting started example

## Git + example:

Clone this repository
```
git clone https://github.com/TheAslera/broadlink-rm-http.git
```

Move ```index.js``` and ```commands.js``` from ```/example``` to the main directory

## NPM:

Install this package
```
npm install broadlink-rm-http
```

Create a file named ```index.js``` and add the following code:
```js
"use stict";
const PORT = process.env.PORT || 1880;
const BroadlinkServer = require('broadlink-rm-server');
const commands = require('./commands');

const key = "YOUR_SECRET";

var rooms = [];
rooms["ROOM_NAME"] = {host:"MAC_OR_IP",groups:["GROUP_A", "GROUP_B"]};

let app = BroadlinkServer(commands, key, rooms);
    app.listen(PORT);

console.log('Server running, go to http://localhost:' + PORT);
```

Create a file named ```commands.js``` and add:
```js
module.exports = [
{"command":"COMMAND_A","group":"GROUP_NAME","data":"IR_OR_RF_CODE"},
{"command":"COMMAND_B","group":"GROUP_NAME","data":"IR_OR_RF_CODE"}
];
```

# Adding devices

- Add your Broadlink RM devices to the Broadlink e-Control app
- Write down their MAC addresses (or copy them by running ```node index```) and create rooms in the ```index.js``` file using these informations
- Additionally, set a key to prevent unwanted command executions (especially if you open this to the Internet), but don't leave it blank

# Learning codes & making commands

- If not done already, start the server with ```node index``` and visit ```http://localhost:1880/learn/YOUR_SECRET/HOST``` replacing ```HOST``` with the MAC or IP address (not room !) of the device that will be used for learning codes
- Now, you have 15 seconds to press the desired button on your infrared or radio remote controller ; if you run out of time just refresh the page
- Once done add the result to your ```commands.js``` file and fill the placeholders accordingly

# Creating groups

- Groups allow you to restrict a set of commands to one or multiple rooms
- This is particulary useful if you have different sets of remotes used across multiple rooms
- The ```commands.js``` allows you to add commands to a group while the ```index.js``` allows you to bind rooms to one or more groups
- You can bypass this feature by setting groups according to room names or by making one single group (less recommended as you are more likely to make mistakes)

# Commands & IFTTT

## Executing commands
To run commands simply visit:
```http://localhost:1880/execute/YOUR_SECRET/ROOM/COMMAND```

## Using IFTTT
Coming soon...