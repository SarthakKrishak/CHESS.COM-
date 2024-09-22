const socket = io();
const chess = new Chess();

const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = ''; // Clear the board

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark');

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData('text/plain', ''); // Required for Firefox compatibility
                        pieceElement.classList.add('dragging');
                    } else {
                        console.log('Drag not allowed for this piece');
                    }
                });

                pieceElement.addEventListener('dragend', (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                    pieceElement.classList.remove('dragging');
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedPiece && sourceSquare) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSquare);

                    draggedPiece.style.position = 'relative';
                    draggedPiece.style.left = '';
                    draggedPiece.style.top = '';

                    draggedPiece = null;
                    sourceSquare = null;
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add("flipped")
    }
    else {
        boardElement.classList.remove("flipped")
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: '♙',
        r: '♖',
        n: '♘',
        b: '♗',
        q: '♕',
        k: '♔',
        P: '♟',
        R: '♜',
        N: '♞',
        B: '♝',
        Q: '♛',
        K: '♚',
    };

    return unicodePieces[piece.type] || '';
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`, // e.g., 'e2'
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`, // e.g., 'e4'
        promotion: 'q', // Add promotion logic if necessary
    };

    // Emit the move to the server
    socket.emit('move', move);
};

socket.on('playerRole', function (role) {
    playerRole = role;
    renderBoard();
});

socket.on('spectatorRole', function () {
    playerRole = null;
    renderBoard();
});

socket.on('boardState', function (fen) {
    chess.load(fen); // Load the new board state from the server's FEN string
    renderBoard();
});

socket.on('move', function (move) {
    chess.move(move);
    renderBoard();
});

renderBoard();
