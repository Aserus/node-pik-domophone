//import path from 'path'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server as SocketIoServer } from 'socket.io'

import { config } from './index.mjs'
import routeApi from '../routes/index.mjs'
import fileUpload from 'express-fileupload'


const PORT = config.get('PORT') || 3000

export const app = express();
const server = http.Server(app);


const corsOptions = {
  origin: 'http://localhost:8080',
  methods: ["GET", "POST", "PUT","DELETE"]
}

export const io = new SocketIoServer(server,{
  cors: corsOptions
});





server.listen(PORT,() => {
  console.log(`Web listening at http://localhost:${PORT}`)
});




app.use(express.static('public'));
app.use('/model', cors(corsOptions),express.static('node_modules/@vladmandic/face-api/model'));

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))


app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
}));


app.use('/api', cors(corsOptions),routeApi);
// app.get('/', function (req, res) {
//   res.sendFile(path.join(process.cwd(), 'public/index.html'));
// });


