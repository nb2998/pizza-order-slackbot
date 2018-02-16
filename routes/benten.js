var express = require('express');
var router = express.Router();

var moment = require('moment');
var fs = require('fs');
var path = require('path');
var logger = require("./logging/logger");
var request = require('request');
var config = require('config');
var apiaitoken = config.get('apiai').token;

var https = require('https');

var apiai = require('apiai');
var apiaiservice = apiai(apiaitoken);
var slack_bot_token = config.get('slackBot').token;

var Client = require('node-rest-client').Client;

var RTMClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var rtm=new RTMClient(slack_bot_token);

var postheaders = {
    'Content-Type' : 'application/x-www-form-urlencoded',
    // 'Content-Length' : Buffer.byteLength(jsonObject, 'utf8')
};

// the post options


router.get('/health', function (req, res) {
    res.send("Health check ok nb2998");
    console.log(apiaitoken);
});

router.post('/act', function (req, res) {
    res.send("Coming soon");
});

//making request to api.ai,sending hi
router.get('/apiai', function (req, res) {
    var sessionId = Math.floor(Math.random() * 99999999) + 1 ;
    var request = apiaiservice.textRequest("Book a ticket from Delhi to Paris", {
        sessionId: sessionId
    });

    request.on('response', function(response) {
        res.send(response);
    });

    request.end();

});
rtm.start();
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
    // console.log(rtmStartData);
});
// rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(data){
//     if(data.type == "message" && data.user != undefined) {
//         console.log(data);
//         console.log("*****************");
//         console.log(data.text);
//
//         if(data.type == "message" && data.user == undefined) return;
//
//         if(data.username !=undefined)
//             if(data.username.includes("test-bot" ))
//                 return;
//
//          rtm.sendMessage("You typed "+ data.text,data.channel);
//
// // sending same to api.ai now : Open dialog flow
//          var request = apiaiservice.textRequest(data.text, {
//             sessionId: data.user,
//           });
//
//          request.end();
//     }
// });
// rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(data){
//     if(data.type == "message" && data.user != undefined) {
//         console.log(data);
//         console.log("*****************");
//         console.log(data.text);
//
//         if(data.type == "message" && data.user == undefined) return;
//
//         if(data.username !=undefined)
//             if(data.username.includes("test-bot" ))
//                 return;
//
//         var resetContexts = false;
//         if(data.text.includes("reset") || data.text.includes("stop")){
//             resetContexts = true;
//         }
//
//         var request = apiaiservice.textRequest(data.text, {
//             sessionId: data.user,
//             resetContexts : resetContexts
//         });
//
//         request.on('response', function(response) { // when api.ai sends response
//
//             if(data.text.includes("reset") || data.text.includes("stop")){
//                 rtm.sendMessage("Done. You can start a new conversation.",data.channel);
//                 return;
//             }
//
//             console.log("###### api.ai response#########");
//             console.log(response);
//             if(response.result.action.includes("smalltalk")
//                 || response.result.action.includes("input.unknown")
//                 || response.result.action.includes("input.welcome"))
//             {
//                 if(response.result.fulfillment.speech==""){
//                     response.result.fulfillment.speech="can't respond to that";
//                 }
//
//                 rtm.sendMessage(response.result.fulfillment.speech,data.channel);
//
//             }
//             else if(response.result.actionIncomplete){
//                 rtm.sendMessage(response.result.fulfillment.speech,data.channel);
//             }
//             // to act ton message when complete
//             else {
//               actOnMessage(response,data.channel);
//             }
//
//         });
//         request.end();
//     }
// });
rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(data){
    if(data.type == "message" && data.user != undefined) {
        // console.log(data);
        // console.log("*****************");
        // console.log(data.text);

        if(data.type == "message" && data.user == undefined) return;

        if(data.username !=undefined)
            if(data.username.includes("test-bot" ))
                return;

        var resetContexts = false;
        if(data.text.includes("reset") || data.text.includes("stop")){
            resetContexts = true;
        }

        var request = apiaiservice.textRequest(data.text, {
            sessionId: data.user,
            resetContexts : resetContexts
        });

        request.on('response', function(response) {

            if(data.text.includes("reset") || data.text.includes("stop")){
                rtm.sendMessage("Done. You can start a new conversation.",data.channel);
                return;
            }

            //console.log("###### api.ai response#########");
            //console.log(response);
            if(response.result.action.includes("smalltalk")
                || response.result.action.includes("input.unknown")
                || response.result.action.includes("input.welcome")){
                if(response.result.fulfillment.speech==""){
                    response.result.fulfillment.speech="can't respond to that";
                }

                rtm.sendMessage(response.result.fulfillment.speech,data.channel);

            }
            else if(response.result.actionIncomplete){
                rtm.sendMessage(response.result.fulfillment.speech,data.channel);
            }

            else{
                // actOnMessage(response,data.channel);
                apiCall(response,data.channel);
            }

        });
        request.end();
    }
});

var apiCall = function(response,channel){
  var client = new Client();

  // set content-type header and data as json in args parameter
  var array = response.result.parameters.extraToppings;
  var toppings;
  for (var i = 0; i < array.length; i++) {
    toppings+=array[i];
    toppings+=(i!=array.length-1)?"&":"";
  }
  var args = {
      data: { name: response.result.parameters.name, crust : response.result.parameters.crust, type: response.result.parameters.type, size: response.result.parameters.size, extraToppings:toppings },
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
  };

  client.post("http://ec2-35-163-216-254.us-west-2.compute.amazonaws.com:8080/api/pizza/order", args, function (data1, response) {
      // parsed response body as js object
      //console.log(data1);
      // raw response
      //console.log(response);
  });

  // registering remote methods
  client.registerMethod("postMethod", "http://ec2-35-163-216-254.us-west-2.compute.amazonaws.com:8080/api/pizza/order", "POST");

  client.methods.postMethod(args, function (data1, response1) {
      // parsed response body as js object
      console.log('**********************************************');
      // console.log(data1);
      // raw response
     console.log(response);
     actOnMessage(response, channel)
  });
}

var actOnMessage = function(ai,channel){
  var array = ai.result.parameters.extraToppings;
  var slacktext= "Congratulations! you have successfully placed an order for "+ "`" +ai.result.parameters.size +"`" +" "+ "`"+ai.result.parameters.type+ "`"+" pizza having "
      + "`"+ ai.result.parameters.crust + "`"+ " crust "+ " with extra toppings " +"`" ;
  for (var i = 0; i < array.length; i++) {
    slacktext+=array[i];
    slacktext+=(i!=array.length-1)?", ":"."+"`";
  }
  console.log(ai.result.parameters.extraToppings);
  rtm.sendMessage(slacktext,channel);
  return;
}
module.exports = router;
