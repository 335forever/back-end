const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

var waitingChair = null;

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.WS_PORT });

// Lưu tất cả các kết nối với index là ID
const clients = {};

wss.on('connection', (ws) => {
    // Sinh ra một ID duy nhất cho mỗi client
    const clientId = uuidv4();
    clients[clientId] = ws;
    console.log(`Client connected: ${clientId}`);

    // Trả ID cho client mới kết nối
    ws.send(JSON.stringify({ type: 'assign_id', id: clientId }));
    
    // Cập nhật số người đang online cho tất cả client
    for (const id in clients) {
      clients[id].send(JSON.stringify({ type: 'online_num', num: Object.keys(clients).length }));
    }

    // Lắng nghe tin nhắn từ client
    ws.on('message', function incoming(message) {
      const messageObj = JSON.parse(message.toString());
      const action = messageObj.action;
      const data = messageObj.data;

      if (action == 'login') {
        const playerInfo = {
          id : clientId,
          ...data,
          starNum : 100
        };

        if (!waitingChair) {
          waitingChair = playerInfo;
          console.log('A player waiting');
        }
        else {
          console.log('B player login');
          
          if (clients[waitingChair.id]) {
            console.log('Matched');

            const turn = Math.random() < 0.5 ? [true, false] : [false, true];
            const mark = Math.random() < 0.5 ? ['X','O'] : ['O','X'];

            const infoSendToMe = {
              ...waitingChair,
              turn: turn[0],
              mark: mark[0]
            }

            const infoSendToEnemy = {
              ...playerInfo,
              turn: turn[1],
              mark: mark[1]              
            }
            
            ws.send(JSON.stringify({ type: 'enemy_info', info: infoSendToMe }));
            clients[waitingChair.id].send(JSON.stringify({ type: 'enemy_info', info: infoSendToEnemy}));
            
            waitingChair = null;
          } 
        }
        
      }
    });

    ws.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);

      // Xóa client khỏi danh sách kết nối
      delete clients[clientId];

      // Nếu client vừa ngắt kết nối đang là người đợi, xóa khỏi ghế đợi
      if (waitingChair && waitingChair.id == clientId) waitingChair = null;

      // Thông báo cho các client khác (nếu cần)
      for (const id in clients) {
        clients[id].send(JSON.stringify({ type: 'client_disconnected', id: clientId }));
      }

      // Cập nhật số người đang online cho tất cả client
      for (const id in clients) {
        clients[id].send(JSON.stringify({ type: 'online_num', num: Object.keys(clients).length }));
      }
    });

  
    // Gửi một tin nhắn chào mừng đến client khi kết nối
    ws.send(JSON.stringify({msg: 'Welcome to TTT game!'}));
});

console.log('WebSocket server is running on ws://localhost:8080');






