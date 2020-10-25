import { WebSocket, WebSocketServer } from 'https://deno.land/x/websocket@v0.0.5/mod.ts';

import { Block } from './chain.ts';

interface Packet {
  msg: string,
  data: any,
}

export const handshake = (peers: Array<string>, address: string): Promise<Array<WebSocket>> => {
  return Promise.all((peers as any).map((peer: string): Promise<WebSocket> => {
    return new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(`ws://${peer}`);
      ws.on('open', () => {
        ws.send(JSON.stringify({
          msg: 'connect',
          data: address,
        }));
        resolve(ws);
      });
    });
  }));
};

export const broadcastBlock = (peers: Array<WebSocket>, block: Block) => {
  peers.forEach((peer) => peer.send(JSON.stringify({
    msg: 'block',
    data: block,
  })));
};

export const listen = (port: number, onAddBlock: Function): WebSocketServer => {
  const wss = new WebSocketServer(port);
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: string) => {
      const { msg, data }: Packet = JSON.parse(message);
      if (msg === 'block') {
        onAddBlock(data);
      }
    });
  });
  return wss;
};
