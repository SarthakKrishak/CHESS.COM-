const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');
const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'W';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game' });
});

io.on('connection', function (uniquesocket) {
    console.log('A user connected:', uniquesocket.id);

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit('playerRole', 'b');
    } else {
        uniquesocket.emit('spectatorRole');
    }

    uniquesocket.on('disconnect', function () {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
        console.log('A user disconnected:', uniquesocket.id);
    });

    uniquesocket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return alert("BlACK WONS");
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return alert("WHITE WONS");

            const result = chess.move(move);
            if (result) {
                console.log('Move accepted:', result);
                io.emit('move', move); // Broadcast the move to all clients
            } else {
                console.log('Invalid Move:', move);
            }
        } catch (err) {
            console.error(err);
            uniquesocket.emit('invalidMove', move);
        }
    });
});

server.listen(3000, function () {
    console.log('Server started on http://localhost:3000');
});
