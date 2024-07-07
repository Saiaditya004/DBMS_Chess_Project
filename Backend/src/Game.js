import { WebSocketServer } from 'ws';
import { Chess } from 'chess.js'
import { GAME_OVER,INIT_GAME,MOVE } from './messages.js'

class Game{
    constructor(player1,player2){
        this.player1=player1;
        this.player2=player2;
        this.board=new Chess();
        this.startTime=new Date();
        this.player1.send(JSON.stringify({
            type:INIT_GAME,
            payload:{
                color:'w'
            }
        }));
        this.player2.send(JSON.stringify({
            type:INIT_GAME,
            payload:{
                color:'b'
            }
        }));
    }

    makeMove(socket, move) {
        // Check current turn before making a move
        if (this.board.turn() === 'w' && socket !== this.player1) {
            return;
        }
    
        if (this.board.turn() === 'b' && socket !== this.player2) {
            return;
        }
    
        try {
            const result = this.board.move(move);
            if (!result) {
                return;
            }
        } catch (e) {
            console.error("Error while making move:", e);
            return;
        }
    
         // Check current turn after making a move
    
        if (this.board.isGameOver()) {
            const winner = this.board.turn() === 'w' ? 'black' : 'white';
            this.player1.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: winner
                }
            }));
            this.player2.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: winner
                }
            }));
            return;
        }
    
        if (this.board.turn() === 'b') {
            this.player2.send(JSON.stringify({
                type: MOVE,
                payload: move
            }));
        } else {
            this.player1.send(JSON.stringify({
                type: MOVE,
                payload: move
            }));
        }

        if (!this.player1 || !this.player2) {
            const winner = !this.player1 ? 'black' : 'white';
            this.player1 && this.player1.send(JSON.stringify({
                type: GAME_OVER,
                payload: { winner }
            }));
            this.player2 && this.player2.send(JSON.stringify({
                type: GAME_OVER,
                payload: { winner }
            }));
            return;
        }
    }

    handlePlayerDisconnect(disconnectedSocket) {
        if (disconnectedSocket === this.player1) {
            this.player1 = null;
            if (this.player2) {
                this.player2.send(JSON.stringify({
                    type: GAME_OVER,
                    payload: { winner: 'black' }
                }));
            }
        } else if (disconnectedSocket === this.player2) {
            this.player2 = null;
            if (this.player1) {
                this.player1.send(JSON.stringify({
                    type: GAME_OVER,
                    payload: { winner: 'white' }
                }));
            }
        }
    }

    
}
export { Game };