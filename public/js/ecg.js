/*global Phaser, io*/
var jogador = {};
var oponente = {};

var socket = {};

var background;

var ranking = [], 
    rankingNames = [],
    rankingVictories = [],
    rankingNumeros = [],
    rankingX,
    rankingY;

//Variaveis de referencia interface
var xJogador = 0,
    yJogador = 0, 
    xOponente = 0,
    yOponente = 0;

var painelJogador,
    nomeJogador,
    profilePic,
    statistics,
    botaoJogar;

//Variaveis dentro do jogo
var estado = '', 
    idPartida = '',
    jogadorCarta = [],
    jogadorTurnos = [],
    oponenteTurnos = [],
    escolhaJogador,
    escolhaOponente,
    posCartasJogador = {x: 0, y: 0},
    posCartasOponente = {x: 0, y: 0},
    turnosJogador = [],
    turnosOponente = [],
    botaoRematch,
    botaoSair,
    infoText;
    
//Variaveis oponente
var painelOponente,
    nomeOponente,
    picOponente,
    statOponente;

var loginState = {
    preload: function() {
        game.add.text(jogo.width, jogo.height, "fix", { font: '1px Romulus', fill: '#fff' });
        game.load.image("background", "assets/background.png");
        this.load.spritesheet('loginButton', 'assets/loginButton.png', 288, 62);
        
        socket = io();
    },
    create: function() {
        background = game.add.tileSprite(0, 0, 800, 600, "background");
        //game.stage.backgroundColor = '#d3e3ed';
        this.loginButton = game.add.button(game.width/2, game.height/2, 'loginButton', this.onClickLogin, this, 0, 1, 2);
        this.loginButton.pivot = new Phaser.Point(this.loginButton.width / 2, this.loginButton.height / 2);
    },
    update: function() {
        if(game.canvas.style.cursor != 'inherit'){
            game.canvas.style.cursor = 'inherit';
        }
        
        if(estadoFB == 'connected' && jogadorFB.foto != null){
            game.state.start('menu', true);
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
        this.load
    },
    
    create: function() {
        background = game.add.tileSprite(0, 0, 800, 600, "background");
        xJogador = 20;
        yJogador = 20;
        
        nomeJogador = game.add.text(xJogador + 85, yJogador + 5, '', { font: '30px Romulus', fill: '#ffffff' });  
        statistics = game.add.text(xJogador + 85, yJogador + 45, '', { font: '30px Romulus', fill: '#ffffff' });  
        
        socket.on('atualizar-ranking', function (data) { 
            ranking = data;
            menuState.novoRanking();
        });
        
        socket.on('inicializar', function (data) {            
            jogador =  data;   
            console.log(jogador.nome);
            profilePic = game.add.sprite(xJogador, yJogador, 'playerPic');
            profilePic.scale = new Phaser.Point(1.5, 1.5);
            statistics.text = 'V: ' + jogador.vitorias.toString();
            nomeJogador.text = jogador.nome;
            botaoJogar = game.add.button(game.width/2, 520, 'playButton', menuState.clicouJogar, this, 0, 1, 2);
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
            
            game.state.start('game', true);
        });
        
        this.conectar();
    },
    
    update: function() {
       if(game.canvas.style.cursor != 'inherit'){
            game.canvas.style.cursor = 'inherit';
        }
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
    },
    
    novoRanking: function () {
        rankingX = 260;
        rankingY = 140;
        
        for(var i = 0; i <= 9; i++){
            rankingNames[i] != null ? rankingNames[i].destroy() : null;
            rankingVictories[i] != null ? rankingVictories[i].destroy() : null;
            rankingNumeros[i] != null ? rankingNumeros[i].destroy() : null;
            
            rankingNumeros[i] = game.add.text(rankingX -50, rankingY + i*30, '', { font: '30px Romulus', fill: '#ffffff' });
            rankingNumeros[i].text = i+1 + ".";
            
            rankingNames[i] = game.add.text(rankingX, rankingY + i*30, '', { font: '30px Romulus', fill: '#ffffff' });
            if(ranking[i].hasOwnProperty("nome")) {
                rankingNames[i].text = ranking[i].nome.substring(0,15);
            } else {
                rankingNames[i].text = "-";
            }
            
            rankingVictories[i] = game.add.text(rankingX + 250, rankingY + i*30, '', { font: '30px Romulus', fill: '#ffffff' });
            if(ranking[i].hasOwnProperty("vitorias")) {
                rankingVictories[i].text = "V: " + ranking[i].vitorias.toString();
            } else {
                rankingVictories[i].text = "-";
            }
        }
    }
}

var gameState = {
    preload: function() {         
        game.load.crossOrigin = '*';
        this.load.spritesheet('cards', 'assets/cards.png', 140, 190);
        this.load.spritesheet('rematchButton', 'assets/rematchButton.png', 250, 60);
        this.load.spritesheet('exitButton', 'assets/exitButton.png', 200, 60);
        this.load.image('playerPic', jogadorFB.foto);
        this.load.image('vazio', 'assets/vazio.png');
        
        this.load.image('bluePanel', 'assets/blue_panel.png');
        this.load.image('redPanel', 'assets/red_panel.png');
        this.load.image('greyCircle', 'assets/grey_circle.png');
        this.load.image('blueTick', 'assets/blue_boxTick.png');
        this.load.image('redTick', 'assets/red_boxTick.png'); 
        
        if(estado == 'jogadorDois'){
            this.load.image('enemyPic', oponente.pic);
        }
    },

    create: function() { 
        background = game.add.tileSprite(0, 0, 800, 600, "background");
        
        //Paineis
        painelJogador = game.add.sprite(0, 0, 'bluePanel');
        painelOponente = game.add.sprite(400, 0, 'redPanel');
        
        //Inicialização das informações do jogador
        xJogador = 10;
        yJogador = 12;
        nomeJogador = game.add.text(xJogador + 85, yJogador + 5, '', { font: '30px Romulus', fill: '#ffffff' });  
        statistics = game.add.text(xJogador + 85, yJogador + 45, '', { font: '30px Romulus', fill: '#ffffff' });  
        profilePic = game.add.sprite(xJogador, yJogador, 'playerPic');
        profilePic.scale = new Phaser.Point(1.5, 1.5);
        statistics.text = 'V: ' + jogador.vitorias.toString();
        nomeJogador.text = jogador.nome;
        infoText = game.add.text(game.width/2, 590, '', { font: '30px Romulus', fill: '#ffffff' }); 
        infoText.anchor.setTo(0.5, 1);
        
        //Inicialização das infos do oponente
        xOponente = 410;
        yOponente = 12;
        nomeOponente = game.add.text(xOponente + 60, yOponente + 25, 'Esperando oponente...', { font: '30px Romulus', fill: '#ffffff' }); 
        picOponente = game.add.sprite(xOponente, yOponente, null);
        statOponente = game.add.text(xOponente + 85, yOponente + 45, '', { font: '30px Romulus', fill: '#ffffff' });
        
        if(estado == 'jogadorDois'){
            socket.emit('jogadorDoispronto');
        }
        
        socket.on('iniciar-partida', function (data) {            
            console.log('Partida iniciada!');
            
            if(botaoRematch != null) botaoRematch.destroy();
            if(botaoSair != null) botaoSair.destroy();
            
            if(estado == 'jogadorUm'){
                jogador = data.jogadorUm;
                oponente = data.jogadorDois;
                gameState.load.image('enemyPic', oponente.pic);
            } else if (estado == "jogadorDois") {
                jogador = data.jogadorDois;
                oponente = data.jogadorUm;
            }
            
            picOponente != null ? picOponente.destroy() : null;
            picOponente = game.add.sprite(xOponente, yOponente, 'enemyPic');
            picOponente.scale = new Phaser.Point(1.5, 1.5);
            statOponente.text = 'V: ' + oponente.vitorias.toString();
            nomeOponente.destroy();
            nomeOponente = game.add.text(xOponente + 85, yOponente + 5, '', { font: '30px Romulus', fill: '#ffffff' });
            nomeOponente.text = oponente.nome;
            
            gameState.atualizarPontos();
            
            gameState.novoTurno();
        });
        
        socket.on('atualizar-tela', function (data) {
            if(data.jogador == estado)
                return;
            
            infoText.text = 'O oponente escolheu uma carta. Faça sua jogada.';
            gameState.limparCartas(false, false, true);
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
            
            gameState.atualizarPontos();
            
            gameState.limparCartas(true, true, true);
            
            escolhaJogador = game.add.sprite(game.width/2, posCartasJogador.y, 'cards', jogador.carta);
            escolhaJogador.pivot = new Phaser.Point(escolhaJogador.width / 2, escolhaJogador.height / 2);
            escolhaOponente = game.add.sprite(game.width/2, posCartasOponente.y, 'cards', oponente.carta);
            escolhaOponente.pivot = new Phaser.Point(escolhaOponente.width / 2, escolhaOponente.height / 2);
            
            if (data.ganhador == '') {
                infoText.text = 'Ocorreu um EMPATE!';
            } else {
                if(data[data.ganhador].turnosVencidos == 3) {
                if (data.ganhador == estado) {
                    infoText.text = 'Você VENCEU!';
                } else {
                    infoText.text = 'Você PERDEU!';
                }
                    
                } else {
                    if (data.ganhador == estado) {
                        infoText.text = 'Você VENCEU essa rodada!';
                    } else {
                        infoText.text = 'Você PERDEU essa rodada!';
                    } 
                }
            }
        });
        
        socket.on('mostrar-final', function () {
            gameState.limparCartas(true, true, true);
            
            if(botaoRematch != null) botaoRematch.destroy();
            if(botaoSair != null) botaoSair.destroy();
            
            botaoRematch = game.add.button(game.width/2, 220, 'rematchButton', gameState.clicouRematch, this, 0, 1, 2);
            botaoRematch.pivot = new Phaser.Point(botaoRematch.width / 2, botaoRematch.height / 2);
            botaoSair = game.add.button(game.width/2, 420, 'exitButton', gameState.clicouSair, this, 0, 1, 2);
            botaoSair.pivot = new Phaser.Point(botaoSair.width / 2, botaoSair.height / 2);
            
            console.log("oi");
        });
        
        socket.on('chamar-turno', function () {
            gameState.novoTurno();
        });
        
        socket.on('desconectar', function () {
            gameState.limparCartas(true, true, true);
            game.state.start("menu", true);
        });
        
    },

    update: function() {
        if(game.canvas.style.cursor != 'inherit'){
            game.canvas.style.cursor = 'inherit';
        }
        
        if(picOponente != null && picOponente.animations.sprite.key == "__missing") {
            game.load.image('enemyPic', oponente.pic);
            game.load.start();

            picOponente.destroy();
            picOponente = game.add.sprite(xOponente, yOponente, 'enemyPic');
            picOponente.scale = new Phaser.Point(1.5, 1.5);

            console.log("Carregando foto do oponente");
        }
        //        if(!habilitarJogada) {
//            //Trava os botões
//        }
    },
    
    novoTurno: function () {
//        habilitarJogada = true;
        
        infoText.text = "Escolha a sua carta";
        
        gameState.limparCartas(true, true, true);
        
        posCartasJogador.x = 180;
        posCartasJogador.y = 450;
        
        posCartasOponente.x = 180;
        posCartasOponente.y = 220;
        
        //Configura as cartas
        for(var i = 0; i < 4; i++){
            //Jogador
            jogadorCarta[i] =  game.add.button(posCartasJogador.x + 150*i, posCartasJogador.y, 'cards', gameState.escolherCarta, this, i, i, i);
            jogadorCarta[i].pivot = new Phaser.Point(jogadorCarta[i].width / 2, jogadorCarta[i].height / 2);
            jogadorCarta[i].numCarta = i;
            jogadorCarta[i].onInputOver.add(function (carta) {carta.y -= 30;}, this);
            jogadorCarta[i].onInputOut.add(function (carta) {carta.y = posCartasJogador.y;}, this);
        }
    },
    
    escolherCarta: function (botao) {
//        habilitarJogada = false;
        gameState.limparCartas(true, false, false);
        
        infoText.text = 'Aguardando jogada do oponente...'
            
        escolhaJogador = game.add.button(game.width/2, posCartasJogador.y, 'cards', null, this, botao.numCarta, 4, botao.numCarta);
        escolhaJogador.pivot = new Phaser.Point(escolhaJogador.width / 2, escolhaJogador.height / 2);
        
        socket.emit('escolheu-carta', {jogador: estado, carta: botao.numCarta});
    },
    
    clicouRematch: function (botao) {
        botao.inputEnabled = false;
        
        infoText.text = "Aguardando resposta do oponente...";
        
        socket.emit('fazer-rematch', {jogador: estado});
    },
    
    clicouSair: function (botao) {
        gameState.limparCartas(true, true, true);
        socket.emit('sair');
        game.state.start("menu",true);
    },
    
    limparCartas: function (jCartas, jEscolha, oEscolha) {
        if(jCartas) {
            for(var i = 0; i < 4; i++){
                if(jogadorCarta[i] != null) jogadorCarta[i].destroy();
                
                jogadorCarta[i] = null;
            }
        }
        if(jEscolha) {
            if(escolhaJogador != null) escolhaJogador.destroy();
            
             escolhaJogador = null;
        }
        
        if(oEscolha) {
            if(escolhaOponente != null) escolhaOponente.destroy();
            
            escolhaOponente = null;
        }
    },
    
    atualizarPontos: function (){
        var pontosJogador = "blueTick";
        var pontosOponente = "redTick";
        for(var i = 0; i < 3; i++){
            if(i+1 > jogador.turnosVencidos) pontosJogador = "greyCircle";
            if(i+1 > oponente.turnosVencidos) pontosOponente = "greyCircle";
            
            turnosJogador[i] != null ? turnosJogador[i].destroy() : null;
            turnosJogador[i] = game.add.sprite(xJogador + 240 + i*50, yJogador + 40, pontosJogador);
            
            turnosOponente[i] != null ? turnosOponente[i].destroy() : null;
            turnosOponente[i] = game.add.sprite(xOponente + 240 + i*50, yOponente + 40, pontosOponente);
            
            statistics.text = "V: " + jogador.vitorias.toString();
            statOponente.text = "V: " + oponente.vitorias.toString();
        }
    }
};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'jogo');

game.state.add('login', loginState); 
game.state.add('menu', menuState); 
game.state.add('game', gameState); 

game.state.start('login', true);