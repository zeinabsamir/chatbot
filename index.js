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
              "template_type": "airline_boardingpass",
              "intro_message": "You are checked in.",
              "locale": "en_US",
              "boarding_pass": [
                {
                  "passenger_name": "SMITH\/NICOLAS",
                  "pnr_number": "CG4X7U",
                  "seat": "74J",            
                  "logo_image_url": "https:\/\/www.example.com\/en\/logo.png",
                  "header_image_url": "https:\/\/www.example.com\/en\/fb\/header.png",
                  "qr_code": "M1SMITH\/NICOLAS  CG4X7U nawouehgawgnapwi3jfa0wfh",
                  "above_bar_code_image_url": "https:\/\/www.example.com\/en\/PLAT.png",
                  "auxiliary_fields": [
                    {
                      "label": "Terminal",
                      "value": "T1"
                    },
                    {
                      "label": "Departure",
                      "value": "30OCT 19:05"
                    }
                  ],
                  "secondary_fields": [
                    {
                      "label": "Boarding",
                      "value": "18:30"
                    },
                    {
                      "label": "Gate",
                      "value": "D57"
                    },
                    {
                      "label": "Seat",
                      "value": "74J"
                    },
                    {
                      "label": "Sec.Nr.",
                      "value": "003"
                    }
                  ],
                  "flight_info": {
                    "flight_number": "KL0642",
                    "departure_airport": {
                      "airport_code": "JFK",
                      "city": "New York",
                      "terminal": "T1",
                      "gate": "D57"
                    },
                    "arrival_airport": {
                      "airport_code": "AMS",
                      "city": "Amsterdam"
                    },
                    "flight_schedule": {
                      "departure_time": "2016-01-02T19:05",
                      "arrival_time": "2016-01-05T17:30"
                    }
                  }
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
