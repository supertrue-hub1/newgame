import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import type { ClientToServerEvents, ServerToClientEvents } from './types.js';
import * as game from './game.js';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.use('/projector', express.static('../client/projector'));
app.use('/phone', express.static('../client/phone'));

app.get('/', (req, res) => {
  res.send(`
    <h1>🎮 Minecraft AR Server</h1>
    <p><a href="/projector">Projector</a></p>
    <p><a href="/phone">Phone Controller</a></p>
  `);
});

io.on('connection', (socket) => {
  console.log(`📱 Connected: ${socket.id}`);
  
  socket.on('join-game', (playerId) => {
    game.addPlayer(playerId);
    io.emit('player-connected', playerId);
    socket.emit('game-state', game.getGameState());
  });
  
  socket.on('break-block', (blockId) => {
    const { block, points } = game.breakBlock(blockId);
    
    if (block) {
      game.addScore(socket.id, points);
      io.emit('destroy-block', blockId, { x: block.x, y: block.y, z: block.z });
      
      const state = game.getGameState();
      const player = state.players.get(socket.id);
      if (player) {
        io.emit('update-score', socket.id, player.score);
      }
    }
  });
  
  socket.on('start-game', () => {
    game.startGame();
  });
  
  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
    io.emit('player-disconnected', socket.id);
  });
});

setInterval(() => {
  if (game.getGameState().isRunning) {
    const state = game.getGameState();
    state.blocks.forEach(block => {
      io.emit('spawn-block', block);
    });
  }
}, 100);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
