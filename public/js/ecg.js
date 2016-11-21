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
var estado = "", idPartida = "";
    
//Variaveis oponente
var nomeOponente,
    picOponente,
    statOponente;

var loginState = {
    preload: function() {
        this.load.spritesheet("loginButton", "assets/loginButton.png", 288, 62);
        
        socket = io();
    },
    create: function() {
        game.stage.backgroundColor = '#d3e3ed';
        this.loginButton = game.add.button(game.width/2, game.height/2, 'loginButton', this.onClickLogin, this, 0, 1, 2);
        this.loginButton.pivot = new Phaser.Point(this.loginButton.width / 2, this.loginButton.height / 2);
    },
    update: function() {
        if(estadoFB == "connected" && jogadorFB.foto != null){
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
        this.load.image("playerPic", jogadorFB.foto);
        this.load.spritesheet("playButton", "assets/playButton.png", 200, 60);
    },
    
    create: function() {
        xJogador = 20;
        yJogador = 20;
        
        nomeJogador = game.add.text(xJogador + 80, yJogador, "", { font: "30px Arial", fill: "#ffffff" });  
        statistics = game.add.text(xJogador + 80, yJogador + 40, "", { font: "30px Arial", fill: "#ffffff" });  
        
        socket.on("inicializar", function (data) {            
            jogador =  data;   
            console.log(jogador.nome);
            profilePic = game.add.sprite(xJogador, yJogador, "playerPic");
            profilePic.scale = new Phaser.Point(1.5, 1.5);
            statistics.text = "V: " + jogador.vitorias.toString();
            nomeJogador.text = jogador.nome;
            botaoJogar = game.add.button((game.width/2)/2, game.height/2, 'playButton', menuState.clicouJogar, this, 0, 1, 2);
            botaoJogar.pivot = new Phaser.Point(botaoJogar.width / 2, botaoJogar.height / 2);
        });
        
        socket.on("mensagem-conexao", function (data) {
            console.log("Conectado");
        });   
        
        socket.on("encontrou-partida", function (data) {            
            if(data.hasOwnProperty("jogador2")){
                estado = "jogador2";
                oponente = data.jogador1;
            } else {
                estado = "jogador1";
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
        console.log("Conectando...");
        socket.emit("conexao", {
            id: jogadorFB.id, 
            nome: jogadorFB.nome, 
            pic: jogadorFB.foto
        });
    },
        
    clicouJogar: function () {
        console.log("Procurando partida...");
        socket.emit("jogar", {
            id: jogadorFB.id
        });
    }
}

var gameState = {
    preload: function() {         
        game.load.crossOrigin = '*';
        this.load.image("playerPic", jogadorFB.foto);
        this.load.image("vazio", "assets/vazio.png");
         
        if(estado == "jogador2"){
            this.load.image("enemyPic", oponente.pic);
        }
    },

    create: function() { 
        //Inicialização das informações do jogador
        xJogador = 20;
        yJogador = 500;
        nomeJogador = game.add.text(xJogador + 80, yJogador, "", { font: "30px Arial", fill: "#ffffff" });  
        statistics = game.add.text(xJogador + 80, yJogador + 40, "", { font: "30px Arial", fill: "#ffffff" });  
        profilePic = game.add.sprite(xJogador, yJogador, "playerPic");
        profilePic.scale = new Phaser.Point(1.5, 1.5);
        statistics.text = "V: " + jogador.vitorias.toString();
        nomeJogador.text = jogador.nome;
        
        //Inicialização das infos do oponente
        xOponente = 500;
        yOponente = 20;
        nomeOponente = game.add.text(xOponente + 80, yOponente, "", { font: "30px Arial", fill: "#ffffff" });  
        statOponente = game.add.text(xOponente + 80, yOponente + 40, "", { font: "30px Arial", fill: "#ffffff" }); ; 
        picOponente = game.add.sprite(xOponente, yOponente, "vazio");;
        nomeOponente.text = "Esperando oponente...";
      
        if(estado == "jogador2"){
            socket.emit("jogador2pronto");
        }
        
        socket.on("iniciar-partida", function (data) {            
            console.log("Partida iniciada!");
            if(estado == "jogador1"){
                oponente = data.jogador2;
                gameState.load.image("enemyPic", oponente.pic);
            }
            picOponente = null;
            picOponente = game.add.sprite(xOponente, yOponente, "enemyPic");
            picOponente.scale = new Phaser.Point(1.5, 1.5);
            statOponente.text = "V: " + oponente.vitorias.toString();
            nomeOponente.text = oponente.nome;
        });
    },

    update: function() {
     
    },

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, "jogo");

game.state.add('login', loginState); 
game.state.add('menu', menuState); 
game.state.add('game', gameState); 

game.state.start('login');