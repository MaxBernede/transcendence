import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Message, ServerToClientEvents } from './types/events';
@WebSocketGateway({ namespace: 'events' })
export class EventsGateway {
  @WebSocketServer()
  server: Server<any, ServerToClientEvents>;

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    // console.log('client', client);
    console.log('message', payload);
    return 'Hello world!';
  }

  sendMessages(message: Message) {
    this.server.emit('newMessage', message);
  }
}
