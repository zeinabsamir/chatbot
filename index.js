const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();


app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
     res.send('hello this is a chatbot')
})

app.get('/webhook/', function(req, res) {
    if(req.query['hub.verify_token'] === 'zeinab123') {
        res.send(req.query['hub.challeng'])
    } else {
        res.send('No entry');
    }
      
})

app.listen(app.get('port'), function() {
    console.log('running on port')
})