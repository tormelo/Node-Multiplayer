/*global Phaser, io*/
var jogador = {};
var oponente = {};

var socket = {};

//Variaveis de referencia interface
var xJogador = 0,
    yJogador = 0, 
    xOponente = 0,
    yOponente = 0;

var nomeJogador,
    profilePic,
    statistics,
    botaoJogar;

//Variaveis dentro do jogo
var estado = '', 
    idPartida = '',
    jogadorCarta = [],
    oponenteCarta = [],
    escolhaJogador,
    escolhaOponente,
    posCartasJogador = {x: 0, y: 0},
    posCartasOponente = {x: 0, y: 0},
    botaoRematch,
    infoText;
    
//Variaveis oponente
var nomeOponente,
    picOponente,
    statOponente;

var loginState = {
    preload: function() {
        this.load.spritesheet('loginButton', 'assets/loginButton.png', 288, 62);
        
        socket = io();
    },
    create: function() {
        game.stage.backgroundColor = '#d3e3ed';
        this.loginButton = game.add.button(game.width/2, game.height/2, 'loginButton', this.onClickLogin, this, 0, 1, 2);
        this.loginButton.pivot = new Phaser.Point(this.loginButton.width / 2, this.loginButton.height / 2);
    },
    update: function() {
        if(estadoFB == 'connected' && jogadorFB.foto != null){
            game.state.start('menu');
        }
    },
    
    onClickLogin: function() {
        logarFB();
    }
    
}

var menuState = {
    preload: function() {    
        game.load.crossOrigin = '*';
        this.load.image('playerPic', jogadorFB.foto);
        this.load.spritesheet('playButton', 'assets/playButton.png', 200, 60);
    },
    
    create: function() {
        xJogador = 20;
        yJogador = 20;
        
        nomeJogador = game.add.text(xJogador + 80, yJogador, '', { font: '30px Arial', fill: '#ffffff' });  
        statistics = game.add.text(xJogador + 80, yJogador + 40, '', { font: '30px Arial', fill: '#ffffff' });  
        
        socket.on('inicializar', function (data) {            
            jogador =  data;   
            console.log(jogador.nome);
            profilePic = game.add.sprite(xJogador, yJogador, 'playerPic');
            profilePic.scale = new Phaser.Point(1.5, 1.5);
            statistics.text = 'V: ' + jogador.vitorias.toString();
            nomeJogador.text = jogador.nome;
            botaoJogar = game.add.button((game.width/2)/2, game.height/2, 'playButton', menuState.clicouJogar, this, 0, 1, 2);
            botaoJogar.pivot = new Phaser.Point(botaoJogar.width / 2, botaoJogar.height / 2);
        });
        
        socket.on('mensagem-conexao', function (data) {
            console.log('Conectado');
        });   
        
        socket.on('encontrou-partida', function (data) {            
            if(data.hasOwnProperty('jogadorDois')){
                estado = 'jogadorDois';
                oponente = data.jogadorUm;
            } else {
                estado = 'jogadorUm';
                oponente = {};
            }
            
            idPartida = data.id;
            
            game.state.start('game');
        });
        
        this.conectar();
    },
    
    update: function() {
       
    },
    
    conectar: function () {
        console.log('Conectando...');
        socket.emit('conexao', {
            id: jogadorFB.id, 
            nome: jogadorFB.nome, 
            pic: jogadorFB.foto
        });
    },
        
    clicouJogar: function () {
        console.log('Procurando partida...');
        socket.emit('jogar', {
            id: jogadorFB.id
        });
    }
}

var gameState = {
    preload: function() {         
        game.load.crossOrigin = '*';
        this.load.spritesheet('cards', 'assets/cards.png', 140, 190);
        this.load.spritesheet('rematchButton', 'assets/rematchButton.png', 250, 60);
        this.load.image('playerPic', jogadorFB.foto);
        this.load.image('vazio', 'assets/vazio.png');
         
        if(estado == 'jogadorDois'){
            this.load.image('enemyPic', oponente.pic);
        }
    },

    create: function() { 
        //Inicialização das informações do jogador
        xJogador = 20;
        yJogador = 500;
        nomeJogador = game.add.text(xJogador + 80, yJogador, '', { font: '30px Arial', fill: '#ffffff' });  
        statistics = game.add.text(xJogador + 80, yJogador + 40, '', { font: '30px Arial', fill: '#ffffff' });  
        profilePic = game.add.sprite(xJogador, yJogador, 'playerPic');
        profilePic.scale = new Phaser.Point(1.5, 1.5);
        statistics.text = 'V: ' + jogador.vitorias.toString();
        nomeJogador.text = jogador.nome;
        infoText = game.add.text(game.width/2, game.height/2, '', { font: '30px Arial', fill: '#ffffff' }); 
        infoText.anchor.setTo(0.5, 0.5);
        
        //Inicialização das infos do oponente
        xOponente = 500;
        yOponente = 20;
        nomeOponente = game.add.text(xOponente + 80, yOponente, '', { font: '30px Arial', fill: '#ffffff' });  
        statOponente = game.add.text(xOponente + 80, yOponente + 40, '', { font: '30px Arial', fill: '#ffffff' });
        picOponente = game.add.sprite(xOponente, yOponente, 'vazio');
        nomeOponente.text = 'Esperando oponente...';
        
        if(estado == 'jogadorDois'){
            socket.emit('jogadorDoispronto');
        }
        
        socket.on('iniciar-partida', function (data) {            
            console.log('Partida iniciada!');
            
            if(estado == 'jogadorUm'){
                oponente = data.jogadorDois;
                gameState.load.image('enemyPic', oponente.pic);
            }
            
            picOponente = null;
            picOponente = game.add.sprite(xOponente, yOponente, 'enemyPic');
            picOponente.scale = new Phaser.Point(1.5, 1.5);
            statOponente.text = 'V: ' + oponente.vitorias.toString();
            nomeOponente.text = oponente.nome;
            
            gameState.novoTurno();
        });
        
        socket.on('atualizar-tela', function (data) {
            if(data.jogador == estado)
                return;
            
            gameState.limparCartas(false, false, true, false);
            
            infoText.text = 'O oponente escolheu uma carta. Faça sua jogada.';  
            escolhaOponente = game.add.sprite(game.width/2, posCartasOponente.y, 'cards', 4);
            escolhaOponente.pivot = new Phaser.Point(escolhaOponente.width / 2, escolhaOponente.height / 2);
        });
        
        socket.on('terminar-turno', function (data) {
            if (estado == 'jogadorUm') {
                jogador = data.jogadorUm;
                oponente = data.jogadorDois;
            } else {
                jogador = data.jogadorDois;
                oponente = data.jogadorUm;
            }
            
            gameState.limparCartas(true, true, true, true);
            
            escolhaJogador = game.add.sprite(game.width/2, posCartasJogador.y, 'cards', jogador.carta);
            escolhaOponente = game.add.sprite(game.width/2, posCartasOponente.y, 'cards', oponente.carta);
            
            if (data.ganhador == '') {
                infoText.text = 'Ocorreu um EMPATE!';
                game.time.events.add(Phaser.Timer.SECOND * 4, gameState.novoTurno, this);
            } else {
                if(data[data.ganhador].turnosVencidos == 3) {
                if (data.ganhador == estado) {
                    infoText.text = 'Você VENCEU!';
                } else {
                    infoText.text = 'Você PERDEU!';
                }
                
                botaoRematch = game.add.button(game.width/2, game.height/2, 'rematchButton', gameState.clicouRematch, this, 0, 1, 2);
                
                } else {
                    if (data.ganhador == estado) {
                        infoText.text = 'Você VENCEU essa rodada!';
                    } else {
                        infoText.text = 'Você PERDEU essa rodada!';
                    } 

                    game.time.events.add(Phaser.Timer.SECOND * 4, gameState.novoTurno, this);
                }
            }
        });
    },

    update: function() {
//        if(!habilitarJogada) {
//            //Trava os botões
//        }
    },
    
    novoTurno: function () {
//        habilitarJogada = true;
        
        gameState.limparCartas(true, true, true, true);
        
        posCartasJogador.x = 100;
        posCartasJogador.y = 400;
        
        posCartasOponente.x = 100;
        posCartasOponente.y = 100;
        
        //Configura as cartas
        for(var i = 0; i < 4; i++){
            //Jogador
            jogadorCarta[i] =  game.add.button(posCartasJogador.x + 150*i, posCartasJogador.y, 'cards', gameState.escolherCarta, this, i, i, i);
            jogadorCarta[i].numCarta = i;
            jogadorCarta[i].onInputOver.add(gameState.cartaOver, this);
            jogadorCarta[i].onInputOut.add(gameState.cartaOut, this);
            
            //Oponente
            oponenteCarta[i] = game.add.sprite(posCartasOponente.x + 150*i, posCartasOponente.y, 'cards', 4);
        }
    },
    
    escolherCarta: function (botao) {
//        habilitarJogada = false;
        gameState.limparCartas(true, false, false, false);
        
        if(oponenteCarta != null)
            infoText.text = 'Aguardando jogada do oponente...'
            
        //////////////////////////////////////CUIDADO COM ESSE NULL POAR
        escolhaJogador = game.add.button(game.width/2, posCartasJogador.y, 'cards', null, this, botao.numCarta, 4, 4);
        escolhaJogador.pivot = new Phaser.Point(escolhaJogador.width / 2, escolhaJogador.height / 2);
        
        socket.emit('escolheu-carta', {jogador: estado, carta: botao.numCarta});
    },
    
    cartaOver: function (carta) {
        carta.y -= 30;
    },
    
    cartaOut: function (carta) {
        carta.y = posCartasJogador.y;
    },
    
    clicouRematch: function (jogador) {
        socket.emit('fazer-rematch', {jogador: estado});
    },
    
    limparCartas: function (jCartas, jEscolha, oCartas, oEscolha) {
        if(jCartas) {
            for(var i = 0; i < 4; i++){
                if(jogadorCarta[i] != null) jogadorCarta[i].destroy();
            }
        }
        if(jEscolha) {
            if(escolhaJogador != null) escolhaJogador.destroy();
        }
        if(oCartas) {
            for(var i = 0; i < 4; i++){
                if(oponenteCarta[i] != null) oponenteCarta[i].destroy();
            }
        }
        if(oEscolha) {
            if(escolhaOponente != null) escolhaOponente.destroy();
        }
    }
};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'jogo');

game.state.add('login', loginState); 
game.state.add('menu', menuState); 
game.state.add('game', gameState); 

game.state.start('login');