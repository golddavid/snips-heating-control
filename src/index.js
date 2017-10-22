const mqtt = require("mqtt");
const https = require("https");
const globalLog = require("global-request-logger");
const mqtt_client = mqtt.connect("mqtt://localhost:9898");

const args = process.argv;

if (args[2] !== "-u") {
    console.log("Missing FHEM user -u parameter");
    process.exit(1);
}

if (args[4] !== "-p") {
    console.log("Missing FHEM password -p parameter");
    process.exit(1);
}

const fhemUser = args[3];
const fhemPwd = args[5];

const topicName = "hermes/intent/user_MomG26m3034__HeatingControl";

globalLog.initialize();

globalLog.on('success', function(request, response) {
    console.log('SUCCESS');
    console.log('Request', request);
    console.log('Response', response);
});

globalLog.on('error', function(request, response) {
    console.log('ERROR');
    console.log('Request', request);
    console.log('Response', response);
});

// Subscribe to the important messages
mqtt_client.on("connect", function () {
    say("Start listening...");
    mqtt_client.subscribe("hermes/intent/user_MomG26m3034__HeatingControl");
    say("I am listening...");
});

mqtt_client.on("message", function (topic, message) {
    console.log("Received a message for topic: " + topic);

    if (topic === topicName) {
        const slots = parseSlots(message.toString());

        if (!("room" in slots)) {
            say("I don't know in which room I should change the temperature!");
        } else if (!("temperature" in slots)) {
            say("I do not know which temperature I should set!");
        } else {
            const room = slots["room"];
            const temperature = slots["temperature"];

            const fhemEntity = mapRoomToFhemEntity(room);

            if (fhemEntity === undefined) {
                say("I can not map the room to an FHEM entity");
            }

            const options = {
                host: `127.0.0.1`,
                port: "8088",
                auth: `${fhemUser}:${fhemPwd}`,
                path: `/fhem?cmd=set%20${fhemEntity}%20desired-temp%2010`
            };

            callback = function(response) {
                let str = '';

                //another chunk of data has been recieved, so append it to `str`
                response.on('data', function (chunk) {
                    str += chunk;
                });

                //the whole response has been recieved, so we just print it out here
                response.on('end', function () {
                    console.log("On end of resonse: " + str);
                });
            }

            const request = https.get(options, callback);

            request.on('error', function (err) {
                console.log("On error of request: " + err);
            });

            request.end();

            say(`Setting the temperature to ${temperature} in the ${room}`);
        }
    }
});

function mapRoomToFhemEntity(room) {
    switch (room) {
        case "living room":
            return "Thermostat_Wohnzimmer_Clima";
            break;
        case "bath room":
            return "Thermostat_Bad_Clima";
            break;
        case "dining room":
            return "Thermostat_Esszimmer_Clima";
            break;
        case "sleeping room":
            return "Thermostat_Schlafzimmer_Clima";
            break;
        default:
            return undefined;
    }
}

function parseSlots(message) {
    const data = JSON.parse(message);
    return data.slots.reduce((acc, {slotName, rawValue}) => {
      acc[slotName] =  rawValue;
      return acc;
    }, {});
}

function say(text) {
    console.log(text);
    mqtt_client.publish("hermes/tts/say", JSON.stringify({"text": text}));
}
