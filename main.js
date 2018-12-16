const electron = require('electron');
const {app, BrowserWindow, Menu, ipcMain} = electron;

const path = require('path');
const url = require('url');

let win;
let did;
let clave;

/*     /*
FUNCIONES
/*    */
function createWindow(electron) {

}
function cerrarSession() {
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }));
    win.once('ready-to-show',() => { win.show(); });
}
/*     /*
FUNCIONES
/*    */
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: null,
  database: 'modelo'
});
connection.connect((err) => {
  if(err){
    return console.log(err.stack);
  }
  console.log("Conexión establecida");
});
const closeConnection = () => {
  connection.end(function(){
    console.log("Conexión cerrada");
  })
}

const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
win = new BrowserWindow({
        width:width,
        height:height,
        minWidth:460,
        show:false,
        backgroundColor:'#f4f3ef',
      });

app.on('ready', function() {
  //, icon: __dirname + 'favicon.icon'
//win.setFullScreen(true);
  win.setMenu(true);
  win.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
  }));
  //const mainMenu = Menu.buildFromTemplate(mainMenutemplate);
  //Menu.setApplicationMenu(mainMenu);
  win.once('ready-to-show',() => { win.show(); });
//
  win.on('closed',function(){
      app.quit();
  });
});

// ---> FUNCTION
function perfil_personal(datos,tipo = 0) {
  if(tipo == 0) {
    let query = 'SELECT * FROM usuario_info WHERE elim = 0 AND tipo_documento = ? AND documento = ?';
    connection.query(query,[datos.tipo_documento,datos.documento],function(err,rows,fields){
      if(err) {
        console.log(err);
        return;
      }
      if(rows.length > 1) {
        win.webContents.send('perfil:error:documento');
      } else {
        let query_usuario = 'UPDATE usuario_info SET nombre = ?,apellido = ?,tipo_documento = ?,documento = ? WHERE usuario = ? AND elim = 0';
        connection.query(query_usuario,[datos.nombre,datos.apellido,datos.tipo_documento,datos.documento,did],() => {});
        win.webContents.send('perfil:datos');
      }
    });
  } else if(tipo == 1) {
    let query = 'SELECT * FROM usuario WHERE elim = 0 AND email = ?';
    connection.query(query,[datos],function(err,rows,fields){
      let query_usuario = 'UPDATE usuario SET email = ? WHERE did = ? AND elim = 0';
      connection.query(query_usuario,[datos,did],() => {});
      win.webContents.send('perfil:datos');
    });
  } else if(tipo == 2) {
    let query_usuario = 'UPDATE usuario SET clave = ?,clave_len = ? WHERE did = ? AND elim = 0';
    clave = datos.clave_1;
    connection.query(query_usuario,[datos.clave_1,datos.clave_len,did],() => {});
    win.webContents.send('perfil:datos');
  } else if(tipo == 3) {
    let query_usuario = 'UPDATE usuario SET user = ? WHERE did = ? AND elim = 0';
    connection.query(query_usuario,[datos.usuario,did],() => {});
    win.webContents.send('perfil:datos');
  }
}

function categorias_tabla() {
  let query = 'SELECT c1.autofecha,c1.did,c1.nombre,c2.nombre AS n_padre FROM categoria AS c1 LEFT JOIN categoria AS c2 ON (c1.padre = c2.did AND c2.elim = 0) WHERE c1.elim = 0 ORDER BY c2.nombre,c1.nombre';
  connection.query(query,function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    var html = "";
    if(rows.length > 0) {
      for(var i = 0; i < rows.length; i++) {
        var d = new Date(rows[i].autofecha);
        let month = String(d.getMonth() + 1);
        let day = String(d.getDate());
        let hours = String(d.getHours());
        let minutes = String(d.getMinutes());
        const year = String(d.getFullYear());

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        if (hours.length < 2) hours = '0' + hours;
        if (minutes.length < 2) minutes = '0' + minutes;

        html += '<tr data-did="'+rows[i].did+'">';
          html += '<td><p>'+(rows[i].n_padre != null ? rows[i].n_padre+', ' : '')+rows[i].nombre+'</p></td>';
          html += '<td><p>'+(rows[i].n_padre != null ? 'Subcategoría' : 'Categoría')+'</p></td>';
          html += '<td><p class="text-right">'+day+'/'+month+'/'+year+' '+hours+':'+minutes+'</p></td>';
        html += '</tr>';
      }
    }
    win.webContents.send('categorias:tabla',html);
  });
}
function categorias_padre_select() {
  let query = 'SELECT * FROM categoria WHERE elim = 0 AND padre = 0 ORDER BY nombre';
  connection.query(query,function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    var html = "";
    if(rows.length > 0) {
      for(var i = 0; i < rows.length; i++) {
        html += '<option value="'+rows[i].did+'">'+rows[i].nombre+'</option>';
      }
    }
    win.webContents.send('categorias:padre',html);
  });
}
function categorias_todas_select() {
  let query = 'SELECT c1.did,c1.nombre,c2.nombre AS n_padre FROM categoria AS c1 LEFT JOIN categoria AS c2 ON (c1.padre = c2.did AND c2.elim = 0) WHERE c1.elim = 0 ORDER BY c2.nombre,c1.nombre';
  connection.query(query,function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    var html = "";
    if(rows.length > 0) {
      for(var i = 0; i < rows.length; i++) {
        html += '<option value="'+rows[i].did+'">'+(rows[i].n_padre != null ? rows[i].n_padre+', ' : '')+rows[i].nombre+'</option>';
      }
    }
    win.webContents.send('categorias:todas',html);
  });
}
function categoria_alta(datos) {
  let query = 'SELECT * FROM categoria WHERE elim = 0 AND padre = ? AND nombre = ?';
  connection.query(query,[datos.padre,datos.nombre],function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    if(rows.length > 0) {
      win.webContents.send('categoria:alta:error_nombre');
    } else {
      var query_did = connection.query('SELECT MAX(did) AS did FROM categoria WHERE elim = 0',function (error, results, fields) {
        var did_cat = results[0].did;
        did_cat ++;
        let alta = 'INSERT INTO categoria (did,nombre,padre,usuario) VALUES (?,?,?,?)';
        connection.query(alta,[did_cat,datos.nombre,datos.nombre,did], function (error, results, fields){
          if (error) throw error;
        });
      });
      win.webContents.send('categoria:alta');
    }
  });
}
function categoria(id) {
  let query = 'SELECT c1.did,c1.nombre,c2.nombre AS n_padre FROM categoria AS c1 LEFT JOIN categoria AS c2 ON (c1.padre = c2.did AND c2.elim = 0) WHERE c1.elim = 0 AND c1.did = ?';
  connection.query(query,[id],function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    if(rows.length > 0) {
      var html = "";
      html += '<div class="modal-body">';
      if(rows[0].n_padre != null) {
        html += '<div class="row" style="margin:0px;padding:20px;">';
        html += '<div class="col">';
        html += '<h3 style="margin:0" class="text-center"><i class="fas fa-tag"></i> '+rows[0].n_padre+'</h3>';
        html += '</div>';
        html += '</div>';
      }

      html += '<div class="row form-row align-items-center">';
      html += '<label for="nom-cat-ver" class="col-3"><i class="fab fa-product-hunt"></i> Nombre</label>';
      html += '<input type="text" id="nom-cat-ver" value="'+rows[0].nombre+'" class="form-control col-6" aria-describedby="nom-cat-ver" maxlength="70" required>';
      html += '</div>';
      html += '</div>';

      html += '<div class="modal-footer">';
      html += '<button type="button" class="btn btn-dark" data-dismiss="modal"><i class="fas fa-times"></i></button>';
      html += '<button type="button" data-eliminar data-categoria="'+id+'" class="btn btn-danger"><i class="fas fa-trash-alt"></i></button>';
      html += '<button type="submit" data-editar data-categoria="'+id+'" class="btn btn-primary"><i class="fas fa-pencil-alt"></i></button>';
      html += '</div>';
      win.webContents.send('categoria:modal',html);
    }
  });
}

// ---> FUNCTION
ipcMain.on('cerrarSession',function() { cerrarSession(); });
ipcMain.on('perfil',function(event) {
  let query = 'SELECT u.user,u.email,REPEAT("*",u.clave_len) AS clave,ui.nombre,ui.apellido,ui.nivel,ui.tipo_documento,ui.documento FROM usuario AS u JOIN usuario_info AS ui ON (u.did = ui.usuario AND ui.elim = 0) WHERE u.elim = 0';
  connection.query(query,function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    console.log("Perfil")
    var html = "";
    if(rows.length > 0) {
      html += '<h3 class="text-center">Datos personales <i class="fas fa-pencil-alt text-warning btn-editar" title="Editar" data-toggle="tooltip" data-placement="top" id="perfil_personal"></i></h3>';
      html += '<input type="hidden" value="'+rows[0].nombre+'" id="perfil_nombre">';
      html += '<input type="hidden" value="'+rows[0].apellido+'" id="perfil_apellido">';
      html += '<input type="hidden" value="'+rows[0].tipo_documento+'" id="perfil_tdoc">';
      html += '<input type="hidden" value="'+rows[0].documento+'" id="perfil_documento">';
      html += '<input type="hidden" value="'+rows[0].email+'" id="perfil_email">';
      html += '<input type="hidden" value="'+rows[0].user+'" id="perfil_usuario">';
      html += '<div class="row">';
        html += '<div class="col-6 text-right">Nombre</div>';
        html += '<div class="col-6"><p>'+((rows[0].nombre != null) ? rows[0].nombre : '<i class="fas fa-ellipsis-h"></i>')+'</p></div>';
      html += '</div>';
      html += '<div class="row">';
        html += '<div class="col-6 text-right">Apellido</div>';
        html += '<div class="col-6"><p>'+((rows[0].apellido != null) ? rows[0].apellido : '<i class="fas fa-ellipsis-h"></i>')+'</p></div>';
      html += '</div>';
      html += '<div class="row">';
        html += '<div class="col-6 text-right">Tipo de documento</div>';
        html += '<div class="col-6"><p>'+((rows[0].tipo_documento != null) ? rows[0].tipo_documento : '<i class="fas fa-ellipsis-h"></i>')+'</p></div>';
      html += '</div>';
      html += '<div class="row">';
        html += '<div class="col-6 text-right">Documento</div>';
        html += '<div class="col-6"><p>'+((rows[0].documento != null) ? rows[0].documento : '<i class="fas fa-ellipsis-h"></i>')+'</p></div>';
      html += '</div>';
      html += '<hr>';
      html += '<h3 class="text-center">Datos del sistema</h3>';
      html += '<div class="row">';
        html += '<div class="col-6 text-right">E-mail</div>';
        html += '<div class="col-6"><p>'+((rows[0].email != null) ? rows[0].email : '<i class="fas fa-ellipsis-h"></i>')+' <i class="fas fa-pencil-alt text-warning btn-editar" title="Editar" id="perfil_sistema_email"></i></p></div>';
      html += '</div>';
      html += '<div class="row">';
        html += '<div class="col-6 text-right">Usuario</div>';
        html += '<div class="col-6"><p>'+rows[0].user+' <i class="fas fa-pencil-alt text-warning btn-editar" title="Editar" id="perfil_sistema_usuario"></i></p></div>';
      html += '</div>';
      html += '<div class="row">';
        html += '<div class="col-6 text-right">Clave</div>';
        html += '<div class="col-6"><p>'+rows[0].clave+' <i class="fas fa-pencil-alt text-warning btn-editar" title="Editar" id="perfil_sistema_clave"></i></p></div>';
      html += '</div>';
    }
    event.returnValue = html;
  });
});
ipcMain.on('perfil:datos:personales',function(e,dato) { perfil_personal(dato) });
ipcMain.on('perfil:datos:email',function(e,email) { perfil_personal(email,1) });
ipcMain.on('perfil:datos:clave',function(e,datos) { perfil_personal(datos,2) });
ipcMain.on('perfil:datos:usuario',function(e,datos) { perfil_personal(datos,3) });

ipcMain.on('categorias:datos',function(event) {
  let query = 'SELECT COUNT(*) AS total FROM categoria WHERE elim = 0';
  connection.query(query,function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    var cantidad = 0;
    if(rows.length > 0) cantidad = rows[0].total;
    event.returnValue = cantidad;
  });
});
ipcMain.on('categorias:tabla',function() { categorias_tabla() });
ipcMain.on('categorias:padre',function() { categorias_padre_select() });
ipcMain.on('categorias:todas',function() { categorias_todas_select() });

ipcMain.on('categorias:modal',function(event) {
  let query = 'SELECT c1.autofecha,c1.did,c1.nombre,c2.nombre AS n_padre FROM categoria AS c1 LEFT JOIN categoria AS c2 ON (c1.padre = c2.did AND c2.elim = 0) WHERE c1.elim = 0 ORDER BY c1.did';
  connection.query(query,function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    var html = "";
    if(rows.length > 0) {
      for(var i = 0; i < rows.length; i++) {
        var d = new Date(rows[i].autofecha);
        let month = String(d.getMonth() + 1);
        let day = String(d.getDate());
        let hours = String(d.getHours());
        let minutes = String(d.getMinutes());
        const year = String(d.getFullYear());

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        if (hours.length < 2) hours = '0' + hours;
        if (minutes.length < 2) minutes = '0' + minutes;

        html += '<tr data-did="'+rows[i].did+'">';
          html += '<td><p class="text-center"><input type="checkbox"/> <i class="fas fa-pencil-alt text-warning categoria-editar_modal" title="Editar" data-toggle="tooltip" data-placement="top" data-did="'+rows[i].did+'"></i> <i class="fas fa-trash-alt text-danger categoria-eliminar_modal" title="Eliminar" data-toggle="tooltip" data-placement="top" data-did="'+rows[i].did+'"></i></p></td>';
          html += '<td><p class="text-center">'+rows[i].did+'</p></td>';
          html += '<td><p>'+(rows[i].n_padre != null ? rows[i].n_padre+', ' : '')+rows[i].nombre+'</p></td>';
          html += '<td><p>'+(rows[i].n_padre != null ? 'Subcategoría' : 'Categoría')+'</p></td>';
          html += '<td><p class="text-right">'+day+'/'+month+'/'+year+' '+hours+':'+minutes+'</p></td>';
        html += '</tr>';
      }
    }
    event.returnValue = html;
  });
});

ipcMain.on('login:primer',function(event,dato) {
  let query = 'SELECT * FROM usuario WHERE user = ? OR email = ?';
  connection.query(query,[dato,dato],function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    if(rows.length > 0) {
      let row = rows[0];
      win.webContents.send('login:segundo',row.did);
    } else {
      win.webContents.send('login:primer:error');
    }
  });
});
ipcMain.on('login:segundo',function(event,datos) {
  let query = 'SELECT * FROM usuario WHERE did = ? AND clave = ?';
  connection.query(query,[datos.usuario,datos.clave],function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    if(rows.length > 0) {
      did = datos.usuario;
      clave = datos.clave;

      win.loadURL(url.format({
        pathname: path.join(__dirname, 'views/main.html'),
        protocol: 'file',
        slashes: true
      }));
      win.once('ready-to-show',() => { win.show(); });
    } else {
      win.webContents.send('login:segundo:error');
    }
  });
});

ipcMain.on('categoria:alta',function(event,dato) { categoria_alta(dato) });
ipcMain.on('categoria:buscar',function(event,did_cat) { categoria(did_cat) });
ipcMain.on('categoria:eliminar',function(event,did_cat) { categoria_eliminar(did_cat) });
ipcMain.on('categoria:eliminar:tabla',function(event,did_cat) {
  let query = 'UPDATE categoria SET elim = 1,usuario = ? WHERE did = ? AND elim = 0';
  connection.query(query,[did,did_cat],function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    let query_hijos = 'UPDATE categoria SET elim = 1,usuario = ? WHERE padre = ? AND elim = 0';
    connection.query(query_hijos,[did,did_cat],() => {});
    event.returnValue = true;
  });
});

ipcMain.on('perfil:clave', function(event, clave_md5) {
  event.returnValue = ((clave != clave_md5) ? "Clave incorrecta" : null);
});
ipcMain.on('perfil:usuario', function(event, usuario) {
  let query = 'SELECT * FROM usuario WHERE elim = 0 AND user = ?';
  connection.query(query,[usuario],function(err,rows,fields){
    if(err) {
      console.log(err);
      return;
    }
    if(rows.length > 1) event.returnValue = "Usuario no disponible";
    else event.returnValue = null
  });
});

ipcMain.on('categoria:eliminar:seleccion', function(event, dids) {
  var categorias = "";
  for (var did_categoria of dids) {
    if(categorias != "") categorias += ",";
    categorias += did_categoria;
  }
  console.log(categorias)
  let query = 'UPDATE categoria SET elim = 1,usuario = ? WHERE elim = 0 AND did IN ('+categorias+')';
  connection.query(query,[did],() => {});
  win.webContents.send('categoria:eliminar',"modal_tabla");
  event.returnValue = true;
});
