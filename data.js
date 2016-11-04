//REQUIRES
var http = require('http');
var request = require('request');
var express = require('express');
var fs = require('fs');
var app = express();
var xml2js = require('xml2js');
var stripBom = require('strip-bom');
var sys = require('sys')
var exec = require('child_process').exec;
var sleep = require("sleep");
var child;

app.get("/", function (req, res) {

  var path = generatePath();
  console.log(path);
    getXML(path, function(respuesta){
         console.log("desde el main");
         var jSReturn = new Array();
         parsearXML(respuesta, function(resultado){
            console.log("despues de llamar");
            console.log(resultado);
            res.setHeader('Content-Type', 'application/json');
            res.json(req.query.callback +'(' + resultado + ')');
        })
    });




   // res.send(JSON.stringify(json));
  // res.json(req.query.callback + '('+ '[{"codigo":"0","nombre":"Baluarte","latitud":"42.813316","longitud":"-1.647981","estado":0.5255555555555556},{"codigo":"1","nombre":"Blanca de Navarra","latitud":"42.81186805058923","longitud":"-1.635117530822754","estado":0.7942238267148014},{"codigo":"2","nombre":"Carlos III","latitud":"42.81186805058923","longitud":"-1.639484167098999","estado":0.711340206185567},{"codigo":"3","nombre":"El Corte Inglés","latitud":"42.813977323980595","longitud":"-1.6452884674072266","estado":0},{"codigo":"4","nombre":"Plaza de Toros","latitud":"42.81583468426657","longitud":"-1.6393446922302246","estado":0.9272727272727272},{"codigo":"5","nombre":"Plaza del Castillo","latitud":"42.816901067187786","longitud":"-1.6428154706954956","estado":0.6460176991150443},{"codigo":"6","nombre":"Rincón de la Aduana","latitud":"42.816003890164154","longitud":"-1.6477882862091064","estado":0.5423728813559322},{"codigo":"7","nombre":"Autobuses","latitud":"42.81180508609865","longitud":"-1.6448163986206055","estado":0.6857142857142857},{"codigo":"8","nombre":"Audiencia","latitud":"42.817408674738","longitud":"-1.6568756103515625","estado":0.9959016393442623},{"codigo":"9","nombre":"Hospitales","latitud":"42.80594517263736","longitud":"-1.6659602522850037","estado":0.10077519379844961}]' + ');');

});
app.listen(process.env.PORT, process.env.IP);
console.log("escuchando" + process.env.PORT);

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
      //ALGO RARO EN EL CALLBACK... PARSEA ANTES QUE RECOD
      // return parsearXML(path);
});
      //return file;

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
      var input = fs.readFileSync(path);
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
    var porcentaje = libres/totales;
    park.porcentaje= porcentaje;
   // console.log(porcentaje);
//    console.log(codigo + latitud + longitud);
    //var inJSON = [];
   // inJSON = { "codigo" : codigo , "nombre" : nombre, "latitud" : latitud , "longitud" : longitud, "estado" : porcentaje};
    console.log("recorro en bucle");
    return park;
}