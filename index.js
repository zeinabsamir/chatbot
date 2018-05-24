const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});




const access = "EAAD6aXQZAl8MBAFYn9TBVFFto7Sxhkg2BIV5d1ioyiLWAvjsmLZCokZBqKKV7X4XVFg4QsAlrr2EsNVaaMjUP6hcA9KFsyYAUXwHgIcWWvEqS7WPUjUlVqd7iHBL7EtFbEKqXtJWkpSPfEoR9lbOfJ9iwjeLg4JRDLIlzs3RQZDZD";

app.set('port', (process.env.PORT || 8080));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
     res.send('hello this is a chatbot')
})


app.get('/webhook/', function(req, res) {
    if(req.query['hub.verify_token'] === 'zeinab123') {
        res.send(req.query['hub.challenge'])
    } else {
        res.send('No entry');
    }
      
})
app.post('/create', (req, res) => {
  request({
    "uri": "https://graph.facebook.com/v2.11/me/message_creatives",
    "qs": { "access_token": access },
    "method": "POST",
    "json": {  
         "message": "heoooo"           
      }      
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.log(res);
       console.error("Unable to send message:" + err);
    }
  });

})

app.get('/setup',function(req,res){

  setupGetStartedButton(res);
  setupPersistentMenu(res);
  setupGreetingText(res);
});

function setupGreetingText(res){
  let messageData = {
      "greeting":[
          {
          "locale":"default",
          "text":"hello !"
          }, {
          "locale":"en_US",
          "text":"Hi there how can i help you !"
          }
      ]};
  request({
      url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ access,
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      form: messageData
  },
  function (error, response, body) {
      if (!error && response.statusCode == 200) {
          res.send(body);
  
      } else { 
        console.error("Unable to send message:" + error);
      }
  });
  
}
function setupPersistentMenu(res){
  let messageData = {
        "persistent_menu":[
          {
          "locale":"default",
          "composer_input_disabled":false,
          "call_to_actions":[
              {
              "title":"Info",
              "type":"nested",
              "call_to_actions":[
                  {
                  "title":"Help",
                  "type":"postback",
                  "payload":"HELP_PAYLOAD"
                  },
                  {
                  "title":"Contact Me",
                  "type":"postback",
                  "payload":"CONTACT_INFO_PAYLOAD"
                  }
              ]
             },
            {
            "type":"web_url",
            "title":"Visit website ",
            "url":"http://www.techiediaries.com",
            "webview_height_ratio":"full"
            }
        ]
        }
    ]};  
    request({
      url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ access,
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      form: messageData
  },
  function (error, response, body) {
      if (!error && response.statusCode == 200) {
          res.send(body);
  
      } else { 
        console.error("Unable to send message:" + error);
      }
  });

}

function setupGetStartedButton(res){
  let messageData = {
          "get_started":{
              "payload":"getstarted"
          }
  };
  request({
    url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ access,
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    form: messageData
},
function (error, response, body) {
    if (!error && response.statusCode == 200) {
        res.send(body);

    } else { 
      console.error("Unable to send message:" + error);
    }
  });
}

app.post('/webhook', async (req, res) => {  
  
  let messaging_events = req.body.entry[0].messaging
  for(let i = 0; i < messaging_events.length; i++ ) {
      let event = messaging_events[i];
      let sender = event.sender.id;
      if(event.message && event.message.text) {
          let text = event.message.text
          const ms = 'INSERT INTO messages(content, sender_id) VALUES($1, $2) RETURNING *';
          const values = [text, sender];
          try {
              const client = await pool.connect()
              const res = await client.query(ms, values);
              console.log(res.rows[0])
             client.release();
          } catch (err) {
             console.error(err);
            }
        // sendText(sender, "Text echo: " + text)
        decideMessage(sender, text)
         
    }
      if (event.postback) {
        let text = JSON.stringify(event.postback);
        decideMessage(sender, text)
        
      }
  }
  res.sendStatus(200);
})
function decideMessage(sender, text1) {
  let text = text1.toLowerCase();
   if (text.includes('coffee')) {
      sendImage(sender);
  } else if (text.includes('tea')) {
        genericMassge(sender);
  } else {
       sendText(sender, "hello there")
       sendButtonMessage(sender, "what do you like to drink?")
  }

}

function sendText(sender, text) {
  let messageData = {text: text}
  sendRequest(sender, messageData) 

}
function sendButtonMessage(sender, text) {
  let messageData = { 
    "attachment":{
    "type":"template",
    "payload":{
      "template_type":"button",
      "text": text,
      "buttons":[
        {
          "type":"postback",
          "title":"Coffee",
          "payload":"Coffee"
        },
        {
          "type":"postback",
          "title":"Tea",
          "payload":"Tea"
        }
      ]
    }
  }
 }
 sendRequest(sender, messageData)
}

function sendImage(sender) {
  let messageData = {
    "attachment":{
      "type":"image", 
      "payload":{
        "url": "https://static.parade.com/wp-content/uploads/2015/09/national-coffee-day-2015-ftr.jpg", 
        "is_reusable":true,
      }
    }

  }
  sendRequest(sender, messageData)
}
function genericMassge(sender) {
  let messageData = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"Tea",
            "image_url":"http://s3.amazonaws.com/etntmedia/media/images/ext/497199886/red-tea-steeping.jpg",
            "subtitle":"I like Tea",
            "buttons":[
              {
                "type":"web_url",
                "url":"https://en.wikipedia.org/wiki/Tea",
                "title":"Read More"
              }             
            ]      
          }
        ]
      }
    

  }
 } 
 sendRequest(sender, messageData);
}
function sendRequest(sender, messageData) {

  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": access },
    "method": "POST",
    "json": {  
        "recipient": {"id": sender},
         "message": messageData           
      }      
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
       console.error("Unable to send message:" + err);
    }
  });
}
app.get('/messages', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM messages');
      res.send(result.rows);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  });
app.listen(app.get('port'), function() {
    console.log('running on port')
})
