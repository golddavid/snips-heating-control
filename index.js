var mqtt = require('mqtt');
var mqtt_client = mqtt.connect('mqtt://localhost:9898');

var fhem_user = '';
var fhem_pwd = '';

// Subscribe to the important messages
mqtt_client.on('connect', function () {
    mqtt_client.subscribe('hermes/intent/user_MomG26m3034__HeatingControl');
    say('I am listening...');
});

mqtt_client.on('message', function (topic, message) {
    if (topic == 'hermes/intent/user_MomG26m3034__HeatingControl') {
        var slots = parseSlots(message.toString());
        if (!('room' in slots)) {
            say('I don\'t know in which room I should change the temperature!');
        } else if (!('temperature' in slots)) {
            say('I do not know which temperature I should set!');
        } else {
            var room = slots['room'];
            var temperature = slots['temperature'];
            // https://fhem_user:fhem_pwd@127.0.0.1:8088/fhem?cmd=set%20Thermostat_Bad_Clima%20desired-temp%2010
            say('Setting temperature to ' + temperature + ' in the ' + room);
        }
    }
});

function parseSlots(message) {
    var data = JSON.parse(message);
    return data.slots.reduce((acc, {slotName, rawValue}) => {
      acc[slotName] =  rawValue
      return acc
    }, {});
}

function say(text) {
    console.log(text);
    mqtt_client.publish('hermes/tts/say', JSON.stringify({'text': text}));
}
