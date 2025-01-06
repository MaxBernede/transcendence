// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { io, Socket } from 'socket.io-client';
// @Injectable()
// export class SocketClient implements OnModuleInit {
//   public socketClient: Socket;
//   constructor() {
//     console.log('SocketClient');
//     this.socketClient = io('http://localhost:3000');
//   }

//   onModuleInit() {
//     this.registerConnectionEvents();
//   }

//   private registerConnectionEvents() {
// 	// this.socketClient.emit('newMessage', {msg: 'Hello from client'});
//     this.socketClient.on('connect', () => {
//       console.log('Connected to server gateway');
//     });
// 	this.socketClient.on('onMessage', (payload:any) => {
// 		console.log('SocketClient');
// 	  console.log(payload);
// 	});
//   }
// }
