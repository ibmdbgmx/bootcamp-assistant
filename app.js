//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

var express = require('express');
var cfenv = require('cfenv');

var watson = require('watson-developer-cloud');
var bodyParser = require('body-parser');

var wconv_version_date = '2018-02-16';
var wconv_api_version = 'v1';
var wconv_workspaceId = 'reemplazar_con_ID_workspace_watson_conversation';
var wconv_username = 'reemplazar_con_usuario_watson_conversation';
var wconv_password =  'reeamplazar_con_contraseña_watson_conversation';

var app = express();
var appEnv = cfenv.getAppEnv();
var session = require('express-session');

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.set('trust proxy', 1) // trust first proxy 
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.get('/chat', function (req, res) {
    res.sendFile(__dirname + '/public/chatv2.html');
});

app.get('/initiliaze', function(req, res){
  
  var conversation = watson.conversation({
    username: wconv_username,
    password: wconv_password,
    version: wconv_api_version,
    version_date: wconv_version_date
  });

  conversation.message({
    workspace_id: wconv_workspaceId,
    input: {'text': ''}
  },  function(err, response) {
      session.context = response.context;
      
      var msgOut = "";
      var additionalText = "";
      var name = "IBM Watson", avatar = "post", cssClass = "watson";
      for(var i=0; i<response.output.text.length; i++)
      {
        msgOut += "<section class=\"post\">";
        msgOut += "<header class=\"post-header-watson\">";
        msgOut += "<img width=\"48\" height=\"48\" alt=\"img\" class=\"" + avatar + "-avatar-w\" src=\"images/avatar-" + cssClass + ".png\">";
        msgOut += "<h2 class=\"post-title-" + cssClass +  "\">@" + name + "</h2>";
        msgOut += "</header>";
        msgOut += "<div class=\"post-description-" + cssClass + "\">";
        msgOut += response.output.text[i];
        msgOut += additionalText;
        msgOut += "</div>";
        msgOut += "</section>";
      }

      res.send(msgOut)
  });

});

app.get('/sendMessage', function (req, res) {
  
  var message = req.query.message;
  var saved_context = session.context;
  var username = req.query.username;
  var conversation = watson.conversation({
    username: wconv_username,
    password: wconv_password,
    version: wconv_api_version,
    version_date: wconv_version_date
  });

  conversation.message({
    workspace_id: wconv_workspaceId,
    input: {'text': message},
    context: saved_context
  },  function(err, response) {
      session.context = response.context;

      var additionalText = "";
      if(response.context.bandera_ubicacion !== undefined)
      {
        var additionalText = "<br><iframe " + 
          "src=\"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d482173.93142824515!2d-99.39010785" +
          "856533!3d19.23953607409557!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d200dc6d9c3dbb" +
          "%3A0xe146f685b596d5c7!2sIBM!5e0!3m2!1sen!2smx!4v1521645985106\"" +
          "width=\"700\" height=\"400\" frameborder=\"0\""
          "style=\"border:0\" allowfullscreen></iframe>";
          delete response.context.bandera_ubicacion;
          callback(res, username, message, response, additionalText)
      }
      else if(response.context.bandera_cotizar !== undefined)
      {
         var request = require('request');
          request(req.protocol + '://' + req.get('host') + '/calldatabase?categoria='+ response.context.categoria_producto, function (error, responseAPI, bodyAPI) {
            response.context.promociones = bodyAPI

            conversation.message({
              workspace_id: wconv_workspaceId,
              input: {'text': message},
              context: response.context
            },
              function(err, response2) {
                
                delete response.context.categoria_producto;
                delete response.context.bandera_cotizar;
                delete response.context.promociones;
                session.context = response2.context;
                callback(res, username, message, response2, additionalText)
              });
        });
      }
      else
      {
        callback(res, username, message, response, additionalText)
      }

      //callback(res, username, message, response, additionalText)
  });

});

function callback(res, username, message, watsonresponse, additionalText){
  var name = username, avatar = "pre", cssClass = "user";
    var msgOut = "";
    msgOut += "<section class=\"post\">";
    msgOut += "<header class=\"post-header-watson\">";
    msgOut += "<img width=\"48\" height=\"48\" alt=\"img\" class=\"" + avatar + "-avatar-w\" src=\"images/avatar-" + cssClass + ".png\">";
    msgOut += "<h2 class=\"post-title-" + cssClass +  "\">@" + name + "</h2>";
    msgOut += "</header>";
    msgOut += "<div class=\"post-description-" + cssClass + "\">";
    msgOut += message;
    msgOut += "</div>";
    msgOut += "</section>";

    
    name = "IBM Watson", avatar = "post", cssClass = "watson";
    for(var i=0; i<watsonresponse.output.text.length; i++)
    {
      msgOut += "<section class=\"post\">";
      msgOut += "<header class=\"post-header-watson\">";
      msgOut += "<img width=\"48\" height=\"48\" alt=\"img\" class=\"" + avatar + "-avatar-w\" src=\"images/avatar-" + cssClass + ".png\">";
      msgOut += "<h2 class=\"post-title-" + cssClass +  "\">@" + name + "</h2>";
      msgOut += "</header>";
      msgOut += "<div class=\"post-description-" + cssClass + "\">";
      msgOut += watsonresponse.output.text[i];
      msgOut += additionalText;
      msgOut += "</div>";
      msgOut += "</section>";
    }
    res.send(msgOut)
}

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("server starting on " + appEnv.url);
});

app.get("/calldatabase", function(req, res){
  var result = "";
  var categoria = req.query.categoria;

  switch(categoria){
    case "bottom":result = "30% de descuento. ";break
    case "top":result = "Todas las prendas tops incluyendo playeras, blusas y camisa están al 3x2. ";break
    case "joyería":result = "6 Meses sin intereses. ";break
    case "exteriores":result = "15% de descuento. ";break
  }

  res.send(result)
})

function compare(a,b) {
  if (a.score < b.score)
    return -1;
  if (a.score > b.score)
    return 1;
  return 0;
}