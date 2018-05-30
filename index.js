const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fetch = require('node-fetch');
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
function broadcast(res) {
  let messageData = {
    "messages": [
      {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"generic",
            "elements":[
               {
                "title":"Welcome to Our Marketplace!",
                "image_url":"https://www.facebook.com/jaspers.png",
                "subtitle":"Fresh fruits and vegetables. Yum.",
                "buttons":[
                  {
                    "type":"web_url",
                    "url":"https://www.jaspersmarket.com",
                    "title":"View Website"
                  }              
                ]      
              }
            ]
          }       
        }
      }
    ]
  }
  request({
    "uri": "https://graph.facebook.com/v2.11/me/message_creatives",
    "qs": { "access_token": access },
    "method": "POST",
    headers: {'Content-Type': 'application/json'},
    form: messageData     
  }, (err, response, body) => {
    if (!err) {
      res.send(body);
      let obj = JSON.parse(body);
      sendBroadcast(obj.message_creative_id)
      console.log(obj.message_creative_id);
    } else {
       console.error("Unable to send message:" + err);
    }
  });

}
function sendBroadcast(body) {
  let messageData = {
  "message_creative_id": Number(body),
  "notification_type": "REGULAR",
  "messaging_type": "MESSAGE_TAG",
  "tag": "NON_PROMOTIONAL_SUBSCRIPTION"
  }
  request({
    "uri": "https://graph.facebook.com/v2.11/me/broadcast_messages",
    "qs": { "access_token": access },
    "method": "POST",
    headers: {'Content-Type': 'application/json'},
    form: messageData     
  }, (err, response, body) => {
    if (!err) {
      console.log(body);
    } else {
       console.error("Unable to send message:" + err);
    }
  });
}
app.get('/broadcast',(req, res) => {
  broadcast(res);
})

app.get('/setup',function(req,res){
  setupGreetingText(res);
  setupGetStartedButton(res);
  setupPersistentMenu(res);
  
});

function setupGreetingText(res){
  var messageData = {
      "greeting":[
          {
              "locale":"default",
              "text":"!\u0627\u0644\u0628\u0648\u062a\u0633 \u062a\u062a\u062d\u062f\u062b \u0627\u0644\u0639\u0631\u0628\u064a\u0647"
          }
      ]};
      requestProfile(messageData);
  
  }

function setupPersistentMenu(res){
  let messageData = {
        "persistent_menu":[
          {
          "locale":"default",
          "composer_input_disabled":false,
          "call_to_actions":[
              {
              "title":"ابدا من جديد ✅",
              "type":"postback",
              "payload":"CONTACT_INFO_PAYLOAD"
              },
              {
              "title":"خدمات 💎",
              "type":"nested",
              "call_to_actions":[
                  {
                  "title":"اشتراك في الاكاديميه 📚",
                  "type":"postback",
                  "payload":"HELP_PAYLOAD"
                  },
                  {
                  "title":"ابحث داخل الموقع 🔎",
                  "type":"postback",
                  "payload":"CONTACT_INFO_PAYLOAD"
                  },
                  {
                    "title":" اضافه بوت📬",
                    "type":"postback",
                    "payload":"HELP_PAYLOAD"
                    },
                    {
                    "title":" طلب بناء بوت💡",
                    "type":"postback",
                    "payload":"CONTACT_INFO_PAYLOAD"
                    }
              ]
             },
             {
              "title":"تحدث مع الادمن 🗣️",
              "type":"postback",
              "payload":"HELP_PAYLOAD"
              }
        ]
        }
    ]};  
  requestProfile(messageData);
}

function setupGetStartedButton(res){
  let messageData = {
          "get_started":{
              "payload":"getstarted"
          }
  };
 requestProfile(messageData);
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
 let name = getUserInfo(sender);
  let text = text1.toLowerCase();
  if (text.includes('getstarted') || text.includes('ابدا من جديد')) {
    senderAction(sender);
   // sendText(sender, `${name}ازيك يا`);
    sendRequest(sender, "اهلا بيك في بوتس بالعربي اول منصه عربيه متخصصه في الكتابه عن البوتس باللغه العربيه ستجد انواع مختلفه من المحتوى في بوتس بالعربي")
  //  sendRequest(sender, "محتوى تعليمي لبناء البوتس على منصات المراسله المختلفه(ماسنجر,تليجرام,سلاك وغيرها")
  // sendRequest(sender, "كيف يمكن ان نساعدك؟")
  // genericMassge(sender);


  } else if (text.includes('page')) {
    senderAction(sender);
    sendPageURL(sender);
  }
  else if (text.includes('coffee')) {
      senderAction(sender);
      sendImage(sender);
  } else if (text.includes('tea')) {
        senderAction(sender);
        genericMassge(sender);
  } else {
       senderAction(sender);
       sendRequest(sender, "مرحبا")
       sendButtonMessage(sender, "what do you like to drink?")
  }

}

function  sendPageURL(sender) {
  let messageData = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"welcom to our page 😅",
            "buttons":[
              {
                "type":"web_url",
                "url":"https://www.facebook.com/Zeinab-1773335382727515/",
                "title":"zeinab"
              }             
            ]      
          }
        ]
      }
    

  }
 } 
 sendRequest(sender, messageData);

}
function sendQuickReplies(sender) {
  let happy =  '😅'
  let messageData = {
    "text": "Here is a quick reply"+ happy,
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Search",
        "payload":"<POSTBACK_PAYLOAD>",
        "image_url":"https://static.parade.com/wp-content/uploads/2015/09/national-coffee-day-2015-ftr.jpg"
      },
      {
        "content_type":"text",
        "title":"Page",
        "payload":"Page",
      },
      {
        "content_type":"location"
      }
    ]
  }
  sendRequest(sender, messageData);
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
            "title":"البحث في مقالات بوتس بالعربي",
            "image_url":"http://s3.amazonaws.com/etntmedia/media/images/ext/497199886/red-tea-steeping.jpg",
            "subtitle":"اضغط على كلمه ابحث في الموقع..واكتب الكلمه التي ترغب ف البحث عنها..",
            "buttons":[
                {
                "type": "postback",
                "title": "ابحث في الموقع",
                "payload": "ابحث في الموقع"
                }
            ] 
          }, 
          {
            "title":"اضافه البوت الخاص بك في دليل البوتس بدون مقابل",
            "image_url":"https://petersfancybrownhats.com/company_image.png",
            "subtitle":"من خلال هذه الخدمه يمكن اضافه البوتس بدون مقابل",
            "buttons":[
                {
                  "type": "postback",
                  "title": "اضافه بوتس",
                  "payload":"اضافه بوتس"
                }
            ]      
          }, 
          {
            "title":"اكاديميه بوتس بالعربي التعليميه",
            "image_url":"https://petersfancybrownhats.com/company_image.png",
            "subtitle":"تسجيل بريدك للاشتراك في اكاديميه بوتس بالعربي",
            "buttons":[
                {
                  "type": "postback",
                  "title": "تسجيل",
                  "payload":"تسجيل"
                }
            ]      
          }, 
          {
            "title":"طلب بناء بوت",
            "image_url":"https://petersfancybrownhats.com/company_image.png",
            "subtitle":"ستجد هنا..كل تفاصيل المواضيع الخاص بالموقع",
            "buttons":[
                {
                  "type": "postback",
                  "title": "طلب بوت",
                  "payload":"طلب بوت"
                }
            ]      
          }, 
          {
            "title":"الاعلان على بوتس بالعربي",
            "image_url":"https://petersfancybrownhats.com/company_image.png",
            "subtitle":"..بوتس بالعربيه هي المنصه العربيه الاولى المتخصصه في الشروحات والمقالات الخاصه بتعلم",
            "buttons":[
                {
                  "type": "postback",
                  "title": "اعلن معنا",
                  "payload":"اعلن معنا"
                }
            ]      
          }, 
          {
            "title":"الكتابه عن البوتس في موقعنا",
            "image_url":"https://petersfancybrownhats.com/company_image.png",
            "subtitle":"للكتابه عن البوتس عموما او رايك في بوت استخدمته",
            "buttons":[
                {
                  "type": "postback",
                  "title": "اكتب معنا",
                  "payload":"اكتب معنا"
                }
            ]      
          }, 
          {
            "title":"مجتكع بوتس بالعربي",
            "image_url":"https://petersfancybrownhats.com/company_image.png",
            "subtitle":"ستجد هنا..كل تفاصيل المواضيع الخاص بالموقع",
            "buttons":[
                {
                  "type": "postback",
                  "title": "عرض التفاصيل",
                  "payload":"عرض التفاصيل"
                }
            ]      
          }             
                 
          
        ]
      }
    

    }
  } 
  sendRequest(sender, messageData);
}
function senderAction(sender) {
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": access },
    "method": "POST",
    "json": {  
        "recipient": {"id": sender},
         "sender_action":"typing_on"
                    
      }  
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
       console.error("Unable to send message:" + err);
    }
  });
}
function sendRequest(sender, text) {

  let messageData = {text: text}  

  request({
    url: 'https://graph.facebook.com/v2.6/me/messenges?access_token='+ access,
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    form: messageData
},
function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // response.send(body);
       console.log(body);
    } else { 
      console.error("Unable to send message:" + error);
    }
  });
}
function requestProfile(messageData){
  request({
    url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ access,
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    form: messageData
},
function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // response.send(body);
       console.log(body);
    } else { 
      console.error("Unable to send message:" + error);
    }
  });
}
function getUserInfo(sender){
  
  const options = {  
    url: 'https://graph.facebook.com/v2.6/'+sender+'?fields=first_name,last_name&access_token='+access,
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
    }
};

return request(options, function(err, res, body) {  
     json = JSON.parse(body);
     name = json.first_name;
    console.log(json);
    return name;
    
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

