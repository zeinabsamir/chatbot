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
              "template_type": "airline_itinerary",
              "intro_message": "Here is your flight itinerary.",
              "locale": "en_US",
              "pnr_number": "ABCDEF",
              "passenger_info": [
                {
                  "name": "Farbound Smith Jr",
                  "ticket_number": "0741234567890",
                  "passenger_id": "p001"
                },
                {
                  "name": "Nick Jones",
                  "ticket_number": "0741234567891",
                  "passenger_id": "p002"
                }
              ],
              "flight_info": [
                {
                  "connection_id": "c001",
                  "segment_id": "s001",
                  "flight_number": "KL9123",
                  "aircraft_type": "Boeing 737",
                  "departure_airport": {
                    "airport_code": "SFO",
                    "city": "San Francisco"
                  },
                  "arrival_airport": {
                    "airport_code": "SLC",
                    "city": "Salt Lake City"
                  },
                  "flight_schedule": {
                    "departure_time": "2016-01-02T19:45",
                    "arrival_time": "2016-01-02T21:20"
                  },
                  "travel_class": "business"
                },
                {
                  "connection_id": "c002",
                  "segment_id": "s002",
                  "flight_number": "KL321",
                  "aircraft_type": "Boeing 747-200",
                  "travel_class": "business",
                  "departure_airport": {
                    "airport_code": "SLC",
                    "city": "Salt Lake City",
                    "terminal": "T1",
                    "gate": "G33"
                  },
                  "arrival_airport": {
                    "airport_code": "AMS",
                    "city": "Amsterdam",
                    "terminal": "T1",
                    "gate": "G33"
                  },
                  "flight_schedule": {
                    "departure_time": "2016-01-02T22:45",
                    "arrival_time": "2016-01-03T17:20"
                  }
                }
              ],
              "passenger_segment_info": [
                {
                  "segment_id": "s001",
                  "passenger_id": "p001",
                  "seat": "12A",
                  "seat_type": "Business"
                },
                {
                  "segment_id": "s001",
                  "passenger_id": "p002",
                  "seat": "12B",
                  "seat_type": "Business"
                },
                {
                  "segment_id": "s002",
                  "passenger_id": "p001",
                  "seat": "73A",
                  "seat_type": "World Business",
                  "product_info": [
                    {
                      "title": "Lounge",
                      "value": "Complimentary lounge access"
                    },
                    {
                      "title": "Baggage",
                      "value": "1 extra bag 50lbs"
                    }
                  ]
                },
                {
                  "segment_id": "s002",
                  "passenger_id": "p002",
                  "seat": "73B",
                  "seat_type": "World Business",
                  "product_info": [
                    {
                      "title": "Lounge",
                      "value": "Complimentary lounge access"
                    },
                    {
                      "title": "Baggage",
                      "value": "1 extra bag 50lbs"
                    }
                  ]
                }
              ],
              "price_info": [
                {
                  "title": "Fuel surcharge",
                  "amount": "1597",
                  "currency": "USD"
                }
              ],
              "base_price": "12206",
              "tax": "200",
              "total_price": "14003",
              "currency": "USD"
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
