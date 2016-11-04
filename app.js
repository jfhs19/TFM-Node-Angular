// Archivo principal del Backend, configuración del servidor
// y otras opciones
//PARA DATA
var http = require('http');
var request = require('request');
var express = require('express');
var fs = require('fs');
var app = express();
var xml2js = require('xml2js');
var stripBom = require('strip-bom');
var sys = require('sys')
var exec = require('child_process').exec;

//
var express = require('express'); // Express: Framework HTTP para Node.js
var routes = require('./routes'); // Dónde tenemos la configuración de las rutas
var config = require('./config'); // Variable de configuración
var path = require('path');

var mongoose = require('mongoose'); // Mongoose: Libreria para conectar con MongoDB
var passport = require('passport'); // Passport: Middleware de Node que facilita la autenticación de usuarios

// Importamos el modelo usuario y la configuración de passport
require('./models/user');
require('./passport')(passport);

// Conexión a la base de datos de MongoDB que tenemos en local
mongoose.connect('mongodb://localhost:27017/users', function(err, res) {
  if(err) throw err;
  console.log('Conectado con éxito a la BD');
});

// Iniciamos la aplicación Express
var app = express();

// Configuración (Puerto de escucha, sistema de plantillas, directorio de vistas,...)
app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));

// Middlewares de Express que nos permiten enrutar y poder
// realizar peticiones HTTP (GET, POST, PUT, DELETE)
app.use(express.cookieParser());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.methodOverride());

// Ruta de los archivos estáticos (HTML estáticos, JS, CSS,...)
app.use(express.static(path.join(__dirname, 'public')));
// Indicamos que use sesiones, para almacenar el objeto usuario
// y que lo recuerde aunque abandonemos la página
app.use(express.session({ secret: config.secretkey }));

// Configuración de Passport. Lo inicializamos
// y le indicamos que Passport maneje la Sesión
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// Si estoy en local, le indicamos que maneje los errores
// y nos muestre un log más detallado
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/* Rutas de la aplicación */
// Cuando estemos en http://localhost:puerto/ (la raiz) se ejecuta el metodo index
// del modulo 'routes'
app.get('/', routes.index);

/* Rutas de Passport */
// Ruta para desloguearse
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});
// Ruta para autenticarse con Twitter (enlace de login)
app.get('/auth/twitter', passport.authenticate('twitter'));
// Ruta para autenticarse con Facebook (enlace de login)
app.get('/auth/facebook', passport.authenticate('facebook'));
// Ruta de callback, a la que redirigirá tras autenticarse con Twitter.
// En caso de fallo redirige a otra vista '/login'
app.get('/auth/twitter/callback', passport.authenticate('twitter',
  { successRedirect: '/', failureRedirect: '/' }
));
// Ruta de callback, a la que redirigirá tras autenticarse con Facebook.
app.get('/auth/facebook/callback', passport.authenticate('facebook',
  { successRedirect: '/', failureRedirect: '/' }
));
app.get('/data', function(req, res) {
   var path = generatePath();
  console.log(path);
    getXML(path, function(respuesta){
         console.log("desde el main");
         var jSReturn = new Array();
         parsearXML(respuesta, function(resultado){
            console.log("despues de llamar");
            console.log(resultado);
            deleteXML(path);
            res.setHeader('Content-Type', 'application/json');
            res.json(resultado);
        })
    });

})
// Inicio del servidor
app.listen(app.get('port'), function(){
  console.log('Aplicación Express escuchando en el puerto ' + app.get('port'));
});




function generatePath(){
  //Genera el path del fichero
  //Es el timestamp para asegurarnos de que es unico
  console.log("generamos el timestamp");
  var timestamp = new Date().getTime();
  var path = timestamp+".xml";
  console.log(path);
  return path;
}
function getXML(path, callback){
//Funcion encargada de obtener el xml desde la ruta original.
//Recibe el path
//Devuelve el file
    var file = fs.createWriteStream(path);
    var request = http.get("http://www.pamplona.es/xml/parkings.xml", function(response) {

      response.pipe(file);
      console.log("Lo tenemos!");
      console.log("Sigamos para bingo");
      callback(path);
});

}
function deleteXML(path){
//Elimina el fichero generado
//Recibe el path a borrar
  fs.unlinkSync(path);
  console.log("hasta luego xml");
}

function parsearXML(path, callback){
      console.log("vamos a parsear el xml");
       path="1462397170342.xml";
      var parser = new xml2js.Parser();
      var fs = require("fs");
      var fileContents = fs.readFileSync(path,'ucs2');
    var JSONreturn = [];
      parser.parseString(fileContents, function (err, result) {
            console.log("se ha parseado el XML");
            var libxml = require("libxmljs");
            var xmlDoc = libxml.parseXmlString(fileContents);
            var parkings = xmlDoc.root().childNodes();
            for(var i=1; i<parkings.length; i++){
                //El primero lo ignoramos porque es datos de ultima actualización
                var parkingBucle = parkings[i];
                var parkingObjeto = getJSONFromParking(parkingBucle);
                JSONreturn.push(parkingObjeto);
            }
            console.log("Desde el metodo" + JSONreturn);
        });
        callback(JSONreturn);
}

function recodificateXML(path){
    var fs = require("fs");
    var input = fs.readFileSync(path);
    var iconv = require('iconv-lite');
    var output = iconv.decode(input, "UTF-16BE");
    fs.writeFileSync("file.xml", output);
  //Se ejecuta un exec para hacerlo via terminal unix ->iconv -f UTF-16LE -t UTF-8 path -o path

}

function getJSONFromParking(parking){
    var park = new Object();

    var codigo = parking.get('CODIGO').text();
    park.codigo = codigo;
    var latitud = parking.get('LATITUD').text();
    park.latitud = latitud;
    var longitud = parking.get('LONGITUD').text();
    park.longitud = longitud;
    var nombre = parking.get('NOMBRE').text();
    park.nombre = nombre;
    var plazasNode = parking.get('PLAZAS');
    var libres = plazasNode.get('LIBRES').text();
    var totales = plazasNode.get('TOTAL').text();
    var porcentaje = (libres/totales)*100;
    var porc = parseInt(porcentaje) + "%";
    if(porcentaje<33){
      //BAJO
      park.estado="bajo";
    }
    if(porcentaje<66 && porcentaje>34){
      //MEDIO
      park.estado="medio";
    }
    if(porcentaje>67){
      park.estado="alto";
    }
    park.porcentaje= porc;
    return park;
}