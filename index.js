/*global node*/
var express = require("express");
var app = express();
var servidor = require("http").Server(app);
var io = require('socket.io')(servidor);
var fs = require("fs");

var partidas = {};

var usuarios = {}
fs.readFile("data/usuarios.json", "utf8", function(err, data){
  if(err){
    throw err
  }
  usuarios = JSON.parse(data)
})

// envia o que está na pasta public
app.use(express.static(__dirname + '/public'));

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
        
        if(salvar) SalvarDados();
        
        socket.emit("inicializar", usuarios[data.id]);
    });
    
    //pediu para jogar
    socket.on("jogar", function (data) {
        console.log("Jogador " + data.id + " esta procurando uma partida...");
        //Verifica se existe alguma partida em espera
        var idPartida = EncontrarPartida();
        //Cria uma nova se não encontrar
        if(idPartida == "") {
            idPartida = "R:" + socket.id;
            partidas[idPartida] = {};
            partidas[idPartida].jogador1 = usuarios[data.id];
            partidas[idPartida].nroJogadores = 1;
            socket.join(idPartida);
            socket.room = idPartida;
        }
        //Entra nela caso encontre
        else {
            partidas[idPartida].jogador2 = usuarios[data.id];
            partidas[idPartida].nroJogadores = 2;
            socket.join(idPartida);
            socket.room = idPartida;
        }
        partidas[idPartida].id = idPartida;
        
        socket.emit("encontrou-partida", partidas[idPartida]);
    });
    
    socket.on('jogador2pronto', function () {
        io.to(socket.room).emit("iniciar-partida", partidas[socket.room]);
    });
    
    // usuario desconectou
    socket.on('disconnect', function () {
//        console.log('usuario desconectou');
//        io.to(socket.room).emit("ganhou-partida");
//        partidas[socket.room] = null;
//        delete partidas[socket.room];
    });
});

function SalvarDados () {
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


function EncontrarPartida () {
    for( var idPartida in partidas) {
        if(partidas[idPartida].nroJogadores == 1) {
            return idPartida;
        }
    }
    return "";
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