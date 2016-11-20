/*global Phaser, io*/
var socket = {};

var jogador = {};
var oponente = {};

var nomeJogador,
    profilePic,
    statistics;

var loginState = {
    preload: function() {
        this.load.spritesheet("loginButton", "assets/loginButton.png", 288, 62);
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
        this.imagem = game.load.image("playerPic", jogadorFB.foto);
    },
    create: function() {
        nomeJogador = game.add.text(100, 20, "", 
            { font: "30px Arial", fill: "#ffffff" });  
        statistics = game.add.text(100, 60, "", 
            { font: "30px Arial", fill: "#ffffff" });  
            
        socket = io();
    
        socket.on("inicializar", function (data) {            
            jogador =  data;   
            console.log(jogador.nome);
            profilePic = game.add.sprite(20, 20, "playerPic");
            profilePic.scale = new Phaser.Point(1.5, 1.5);
            statistics.text = "V: " + jogador.vitorias.toString();
            nomeJogador.text = jogador.nome;
        });
        
        this.conectar(); //game.load.onLoadComplete(this.initialize, this);
    },
    update: function() {
    },
    
    conectar: function () {
        socket.emit("conexao", {
            id: jogadorFB.id, 
            nome: jogadorFB.nome, 
            pic: jogadorFB.foto
        });
    },
}


// Create our 'main' state that will contain the game
var gameState = {
    preload: function() {         
        // Load the bird sprite        
        game.load.image('pipe', 'assets/pipe.png');
        game.load.crossOrigin = '*';
        game.load.image('bird', jogadorFB.foto); 
    },

    create: function() { 
        // Change the background color of the game to blue
        game.stage.backgroundColor = '#71c5cf';

        // Set the physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // Display the bird at the position x=100 and y=245
        this.bird = game.add.sprite(100, 245, 'bird');

        // Add physics to the bird
        // Needed for: movements, gravity, collisions, etc.
        game.physics.arcade.enable(this.bird);

        // Add gravity to the bird to make it fall
        this.bird.body.gravity.y = 1000;  

        // Call the 'jump' function when the spacekey is hit
        var spaceKey = game.input.keyboard.addKey(
                        Phaser.Keyboard.SPACEBAR);
        spaceKey.onDown.add(this.jump, this);   
        
        // Create an empty group
        this.pipes = game.add.group();
        this.timer = game.time.events.loop(1500, this.addRowOfPipes, this); 
        
        this.score = 0;
        this.labelScore = game.add.text(20, 20, "0", 
            { font: "30px Arial", fill: "#ffffff" });  
    },

    update: function() {
        // If the bird is out of the screen (too high or too low)
        // Call the 'restartGame' function
        if (this.bird.y < 0 || this.bird.y > 490)
            this.restartGame();
        
        game.physics.arcade.overlap(
        this.bird, this.pipes, this.restartGame, null, this);
    },
    
    // Make the bird jump 
    jump: function() {
        // Add a vertical velocity to the bird
        this.bird.body.velocity.y = -350;
    },

    // Restart the game
    restartGame: function() {
        // Start the 'main' state, which restarts the game
        $.post("/recorde", 
               { id: jogadorFB.id, 
                 pontos: this.score }
                , function(res){
                   console.log(res); 
                    game.state.start('main');
                });
    },
    
    addOnePipe: function(x, y) {
        // Create a pipe at the position x and y
        var pipe = game.add.sprite(x, y, 'pipe');

        // Add the pipe to our previously created group
        this.pipes.add(pipe);

        // Enable physics on the pipe 
        game.physics.arcade.enable(pipe);

        // Add velocity to the pipe to make it move left
        pipe.body.velocity.x = -200; 

        // Automatically kill the pipe when it's no longer visible 
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    },
    
    addRowOfPipes: function() {
        // Randomly pick a number between 1 and 5
        // This will be the hole position
        var hole = Math.floor(Math.random() * 5) + 1;

        // Add the 6 pipes 
        // With one big hole at position 'hole' and 'hole + 1'
        for (var i = 0; i < 8; i++)
            if (i != hole && i != hole + 1) 
                this.addOnePipe(400, i * 60 + 10);  
        
        this.score += 1;
        this.labelScore.text = this.score;  
    }
};

var game = new Phaser.Game(800, 600, Phaser.WEBGL);

game.state.add('login', loginState); 
game.state.add('menu', menuState); 
game.state.add('game', gameState); 

game.state.start('login');