// Rutas de la aplicación

exports.index = function(req, res){
  // Renderiza la plantilla 'index' cuando en el navegador
  // nos encontremos en la raiz '/' --> http://localhost:puerto/
  res.render('index', {
    // Enviamos como variables un título
    // y objeto 'user' que contiene toda
    // la información del usuario y viaja en el 'request'
    title: 'TFM Juan Francisco Hernandez',
    description : 'Desarrollo de  componentes web basados en Angular JS, Polymer, Node.js, Django y MongoDB para el pre-procesado, consumo y homogeneización de fuentes Open Data gubernamentales ',
    user: req.user
  });
};