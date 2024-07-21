const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { matches, newMatch, removeMatch, findEnemyId, findMatch, checkWin} = require('./matches')
const { players, newPlayer, removePlayer} = require('./players')

var waitingChair = null;

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.WS_PORT });

// Lưu tất cả các kết nối với index là ID
const clients = {};

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({type: 'msg', data: 'Welcome to TTT game!'}));

    // Sinh ra một ID duy nhất cho mỗi client
    const clientId = uuidv4();
    clients[clientId] = ws;
    console.log(`Client connected: ${clientId}`);

    // Cập nhật số người đang online 
    ws.send(JSON.stringify({ type: 'online_num', data : {num:Object.keys(players).length} }));

    // Lắng nghe tin nhắn từ client
    ws.on('message', function incoming(message) {
      const messageObj = JSON.parse(message.toString());
      const action = messageObj.action;
      const data = messageObj.data;
      console.log('v-------------> REQUEST FROM CLIENT:', action, '<-------------v');

      if (action == 'login') {
        const playerInfor = {
          id : clientId,
          ...data,
          starNum : 100
        };

        newPlayer(playerInfor);

        console.log(`Player login: ${playerInfor.playerName}`);

        // Trả thông tin khởi tạo cho client mới login
        ws.send(JSON.stringify({ type: 'assign', data: playerInfor}));
        
        // Cập nhật số người đang online cho tất cả client
        for (const id in clients) {
          clients[id].send(JSON.stringify({ type: 'online_num', data : {num:Object.keys(players).length} }));
        }
      }

      if (action == 'find') {
        const playerInfor = data;
        
        if (!waitingChair) {
          waitingChair = playerInfor;
          console.log('A player waiting');
        }
        else {
          console.log('B player login');
          
          if (clients[waitingChair.id]) {
            console.log('Matched');

            const matchId = newMatch(waitingChair, playerInfor);

            const matchStatus = {
              matchId : matchId,
              turn : matches[matchId].turn,
              tableSize : matches[matchId].tableSize,
              move : matches[matchId].move,
              tick : matches[matchId].tick
            }
            
            ws.send(JSON.stringify({ type: 'match_start', data : {enemyInfor: waitingChair, matchStatus} }));
            clients[waitingChair.id].send(JSON.stringify({ type: 'match_start', data : {enemyInfor: playerInfor, matchStatus} }));
            
            waitingChair = null;
          } 
        }
      }

      if (action == 'exit_find') {
        if (waitingChair && waitingChair.id == clientId) {
          waitingChair = null;
          console.log('A player stop waiting')
        }
      }

      if (action == 'tick') {
        if (matches[data.matchId] && data.playerId == matches[data.matchId].idA || data.playerId == matches[data.matchId].idB) {
          if (matches[data.matchId].turn == data.playerId && matches[data.matchId].table[data.position.x][data.position.y] == '') {
            matches[data.matchId].table[data.position.x][data.position.y] = matches[data.matchId].tick;
            matches[data.matchId].turn = matches[data.matchId].turn == matches[data.matchId].idA ? matches[data.matchId].idB : matches[data.matchId].idA;
            matches[data.matchId].tick = matches[data.matchId].tick == 'X' ? 'O' : 'X';

            console.log(checkWin(data.matchId, data.position, 3));

            const winnerId = checkWin(data.matchId, data.position, 5) ? data.playerId : null;

            const message = {
              type : 'match_update',
              matchStatus : {
                table : matches[data.matchId].table,
                turn : matches[data.matchId].turn,
                tick : matches[data.matchId].tick,
                winnerId
              }
            }
            
            clients[matches[data.matchId].idA].send(JSON.stringify(message));
            clients[matches[data.matchId].idB].send(JSON.stringify(message));

          }
        }
      }
    });

    ws.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);

      // Xóa client khỏi danh sách kết nối
      delete clients[clientId];

      // Xóa khỏi danh sách người chơi
      if (players[clientId]) removePlayer(clientId);


      // Nếu client mới ngắt đang trong trận, thông báo đối thủ và xóa ván đấu
      const enemyId = findEnemyId(clientId);
      if (enemyId) {
        const message = {
          type : 'enemy_quit'
        }

        clients[enemyId].send(JSON.stringify(message));
        removeMatch(findMatch(enemyId));
      }

      // Nếu client vừa ngắt kết nối đang là người đợi, xóa khỏi ghế đợi
      if (waitingChair && waitingChair.id == clientId) waitingChair = null;

      // Cập nhật số người đang online cho tất cả client
      for (const id in clients) {
        clients[id].send(JSON.stringify({ type: 'online_num', data : {num:Object.keys(players).length} }));
      }
    });

  

});

console.log('Game server start (web socket) on ws://localhost:8080');






