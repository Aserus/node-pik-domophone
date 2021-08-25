import path from 'path'
import express from 'express'
import http from 'http'
import { Server as SocketIoServer } from 'socket.io'

import { config } from './index.mjs'

const PORT = config.get('PORT') || 3000

export const app = express();
const server = http.Server(app);
export const io = new SocketIoServer(server,{
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});



server.listen(PORT,() => {
  console.log(`Web listening at http://localhost:${PORT}`)
});



app.use(express.static('public'));
// app.get('/', function (req, res) {
//   res.sendFile(path.join(process.cwd(), 'public/index.html'));
// });


