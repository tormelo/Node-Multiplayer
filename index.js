/*global node*/
var express = require('express');
var app = express();
var servidor = require('http').Server(app);
var io = require('socket.io')(servidor);
var fs = require('fs');

//Construtor dos objetos jogador
function jogador (nome, picUrl, vitorias) {
    this.nome = nome,
    this.pic = picUrl,
    this.vitorias = vitorias,
    this.carta = 4,
    this.turnosVencidos = 0,
    this.rematch = false;
}

var partidas = {};

var usuarios = {}
fs.readFile('data/usuarios.json', 'utf8', function(err, data){
  if(err){
    throw err
  }
  usuarios = JSON.parse(data)
})

// envia o que está na pasta public
app.use(express.static(__dirname + '/public'));

//nova conexao
io.on('connection', function (socket) {
    'use strict';
    
    //conectou
    socket.on('conexao', function (data) {
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
        
        socket.emit('inicializar', usuarios[data.id]);
    });
    
    //pediu para jogar
    socket.on('jogar', function (data) {
        console.log('Jogador ' + data.id + ' esta procurando uma partida...');
        //Verifica se existe alguma partida em espera
        var idPartida = EncontrarPartida();
        //Cria uma nova se não encontrar
        if(idPartida == '') {
            idPartida = 'R:' + socket.id;
            partidas[idPartida] = {};
            partidas[idPartida].jogadorUm = new jogador(usuarios[data.id].nome, usuarios[data.id].pic, usuarios[data.id].vitorias);
            partidas[idPartida].nroJogadores = 1;
            partidas[idPartida].ganhador = '';
            partidas[idPartida].jogadorUm.turnosVencidos = 0;
            socket.join(idPartida);
            socket.room = idPartida;
        }
        //Entra nela caso encontre
        else {
            partidas[idPartida].jogadorDois = new jogador(usuarios[data.id].nome, usuarios[data.id].pic, usuarios[data.id].vitorias);
            partidas[idPartida].nroJogadores = 2;
            partidas[idPartida].jogadorDois.turnosVencidos = 0;
            socket.join(idPartida);
            socket.room = idPartida;
        }
        partidas[idPartida].id = idPartida;
        
        socket.emit('encontrou-partida', partidas[idPartida]);
    });
    
    //Sinaliza apos a entrada do jogador 2 que a partida pode comecar
    socket.on('jogadorDoispronto', function () {
        io.to(socket.room).emit('iniciar-partida', partidas[socket.room]);
    });
    
    //Atualiza a situação da partida no servidor e envia uma mensagem de atualização para as pessoas da sala
    socket.on('escolheu-carta', function (data) {
        console.log(socket.room);
        console.log(data.jogador);
        console.log(data.carta);
        partidas[socket.room][data.jogador].carta = data.carta;
        
        //verifica se os dois já jogaram
        if (partidas[socket.room].jogadorUm.carta !== 4 && partidas[socket.room].jogadorDois.carta !== 4) {
            var ganhador = VerificarResultado(socket.room);
            
            if (ganhador != '') {
                partidas[socket.room][ganhador].turnosVencidos++;
                
                if(partidas[socket.room][ganhador].turnosVencidos == 3){
                    partidas[socket.room][ganhador].vitorias++;
                    SalvarDados();
                }  
            }
            
            partidas[socket.room].ganhador = ganhador;
            io.to(socket.room).emit('terminar-turno', partidas[socket.room]);
            novoTurno(socket.room);
        } else {
            io.to(socket.room).emit('atualizar-tela', {jogador: data.jogador});
        }
    });
    
    //Sinaliza apos a entrada do jogador 2 que a partida pode comecar
    socket.on('fazer-rematch', function (data) {
        partidas[socket.room][data.jogador].rematch = true;
        
        if(partidas[socket.room].jogadorUm.rematch == true && partidas[socket.room].jogadorDois.rematch == true){
            partidas[socket.room].jogadorUm.carta = 4;
            partidas[socket.room].jogadorUm.rematch = false;
            partidas[socket.room].jogadorUm.turnosVencidos = 0;
            partidas[socket.room].jogadorDois.carta = 4;
            partidas[socket.room].jogadorDois.rematch = false;
            partidas[socket.room].jogadorDois.turnosVencidos = 0;
            
            io.to(socket.room).emit('iniciar-partida', partidas[socket.room]);
        }
        
    });
    
    // usuario desconectou
    socket.on('disconnect', function () {
//        console.log('usuario desconectou');
//        io.to(socket.room).emit('oponente-disconectou');
//        partidas[socket.room] = null;
//        delete partidas[socket.room];
    });
});

function SalvarDados () {
    fs.writeFile(
  'data/usuarios.json',     // endereco
  JSON.stringify(usuarios),     // dados
  'utf8',           // encoding
  function(err) {       // callback
    if(err) {
        return console.log(err)
    }
    console.log('Usuarios.json foi salvo!')
  });
}


function EncontrarPartida () {
    for( var idPartida in partidas) {
        if(partidas[idPartida].nroJogadores == 1) {
            return idPartida;
        }
    }
    return '';
}

function novoTurno (idPartida) {
    partidas[idPartida].jogadorUm.carta = 4;
    partidas[idPartida].jogadorDois.carta = 4;
    partidas[idPartida].ganhador = '';
}

function VerificarResultado (idPartida) {
    var cartaJ1 = partidas[idPartida].jogadorUm.carta;
    var cartaJ2 = partidas[idPartida].jogadorDois.carta;
    var resultado = cartaJ1 - cartaJ2;
    if (resultado == 1 || resultado == -3) {
        return 'jogadorUm';
    } else if (resultado == -1 || resultado == 3) {
        return 'jogadorDois';
    } else {
        return '';
    }
}

//app.post('/recorde', function(req, res) {
//    var idJogador = req.body.id;
//    var pontos = req.body.pontos;
//    console.log(idJogador + ' : ' + pontos);
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
    console.log('RODANDO!');
});