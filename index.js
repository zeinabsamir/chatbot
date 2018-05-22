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
                  "title":"Breaking News: Record Thunderstorms",
                  "subtitle":"The local area is due for record thunderstorms over the weekend.",
                  "image_url":"https://thechangreport.com/img/lightning.png",
                  "buttons": [
                    {
                      "type": "element_share",
                      "share_contents": { 
                        "attachment": {
                          "type": "template",
                          "payload": {
                            "template_type": "generic",
                            "elements": [
                              {
                                "title": "I took the hat quiz",
                                "subtitle": "My result: Fez",
                                "image_url": "https://bot.peters-hats.com/img/hats/fez.jpg",
                                "default_action": {
                                  "type": "web_url",
                                  "url": "http://m.me/petershats?ref=invited_by_24601"
                                },
                                "buttons": [
                                  {
                                    "type": "web_url",
                                    "url": "http://m.me/petershats?ref=invited_by_24601", 
                                    "title": "Take Quiz"
                                  }
                                ]
                              }
                            ]
                          }
                        }
                      }
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
