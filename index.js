// configuracao básica de servidor
var express = require("express");
var app = express();
var servidor = require("http").createServer(app);
var io = require('socket.io')(servidor);
var fs = require("fs");
//var bodyParser= require('body-parser');

var partidas = {};

var usuarios = {}
fs.readFile("data/usuarios.json", "utf8", function(err, data){
  if(err){
    throw err
  }
  usuarios = JSON.parse(data)
})

// envia o que está na pasta public
app.use(express.static("public"));
//app.use(bodyParser.json()); // support json encoded bodies
//app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//nova conexao
io.on('connection', function (socket) {
    "use strict";
    
    //conectou
    socket.on("conexao", function (data) {
        var salvar = false;
        
        //Se o jogador não existe no banco de dados salva informações com o n de vitorias zerado 
        if(!usuarios.hasOwnProperty(data.id)){
            usuarios[data.id] = {};
            usuarios[data.id].vitorias = 0;
            salvar = true;
        }
    
        //Atualiza o nome e foto do jogador no banco de dados
        usuarios[data.id].nome = data.nome;
        usuarios[data.id].pic = data.pic;
        
        if(salvar) salvarDados();
        
        socket.emit("inicializar", usuarios[data.id]);
    });
                                       
    // usuario desconectou
    socket.on('disconnect', function () {
//        console.log('usuario desconectou');
//        io.to(socket.room).emit("ganhou-partida");
//        partidas[socket.room] = null;
//        delete partidas[socket.room];
    });
});

function salvarDados () {
    fs.writeFile(
  "data/usuarios.json",     // endereco
  JSON.stringify(usuarios),     // dados
  "utf8",           // encoding
  function(err) {       // callback
    if(err) {
        return console.log(err)
    }
    console.log("Usuarios.json foi salvo!")
  });
}

//app.post("/recorde", function(req, res) {
//    var idJogador = req.body.id;
//    var pontos = req.body.pontos;
//    console.log(idJogador + " : " + pontos);
//    if(recordes.hasOwnProperty(idJogador)){
//        if(pontos >= recordes[idJogador]){
//            recordes[idJogador] = pontos;
//        }
//    }
//    else {
//         recordes[idJogador] = pontos;
//    }
//    res.send({pontos: recordes[idJogador]});
//});

servidor.listen(3000, function(){
    console.log("RODANDO!");
});