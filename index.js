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
         "message": {
          "attachment":{
            "type":"template",
            "payload": {
              "template_type":"generic",
              "elements":[
                 {
                  "title":"Welcome!",
                  "image_url":"https://petersfancybrownhats.com/company_image.png",
                  "subtitle":"We have the right hat for everyone.",
                  "default_action": {
                    "type": "web_url",
                    "url": "https://petersfancybrownhats.com/view?item=103",
                    "messenger_extensions": false,
                    "webview_height_ratio": "tall",
                    "fallback_url": "https://petersfancybrownhats.com/"
                  },
                  "buttons":[
                    {
                      "type":"web_url",
                      "url":"https://petersfancybrownhats.com",
                      "title":"View Website"
                    },{
                      "type":"postback",
                      "title":"Start Chatting",
                      "payload":"DEVELOPER_DEFINED_PAYLOAD"
                    }              
                  ]      
                }
              ]
            }
          }  
        }
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
