const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const pgp = require('pg-promise');
const cn = {
    host: 'localhost',
    port: 5432,
    database: 'chatbot',
    user: 'postgres',
    password: ''
};
const db = pgp(cn);


const access = process.env.FB_ACCESS_TOKEN;

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
app.post('/webhook', (req, res) => {  
   let messaging_events = req.body.entry[0].messaging
   for(let i = 0; i < messaging_events.length; i++ ) {
       let event = messaging_events[i];
       let sender = event.sender.id;
       if(event.message && event.message.text) {
           let text = event.message.text
           db.one('INSERT INTO messages(content, sender_id) VALUES($1, $2)', [text, sender])
               .then(data => {
                  console.log(data); // print new user id;
                })
               .catch(error => {
                  console.log('ERROR:', error); // print error;
                });
           sendText(sender, "Text echo: " + text)
       }
   }
   res.sendStatus(200);
})

function sendText(sender, text) {
  let messageData = {text: text}
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
app.listen(app.get('port'), function() {
    console.log('running on port')
})