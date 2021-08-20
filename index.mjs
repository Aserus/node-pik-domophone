import express from 'express'
import http from 'http'
import path from 'path'

import clc from 'cli-color'

import { Buffer } from 'buffer';
import { Server as SocketIoServer } from 'socket.io'
import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'

import { pikApi, config } from './boot/index.mjs'
import { logTime } from './helpers/index.mjs'


const FPS = 1


const rootFolder = process.cwd()


const app = express();
const server = http.Server(app);
const io = new SocketIoServer(server);





server.listen(config.get('PORT', 3000));

app.get('/', function (req, res) {
  res.sendFile(path.join(rootFolder, 'public/index.html'));
});



function startWorkerRtsp(workerData) {
  const bus = new EventEmitter()
  let worker = null

  const onExit = () => {
    start();
  }
  const onError = err => console.log('--- onError ----', err)
  const onMessage = data => {
    const bufferData = Buffer.from(data)
    bus.emit('data', bufferData)
  }

  function start() {
    worker = new Worker('./worker.rtsp.mjs', { workerData });
    worker.on('message', onMessage);
    worker.on('error', onError);
    worker.on('exit', onExit)
  }

  bus.on('url',url =>{
    workerData.url = url
    if (worker){
      worker.postMessage(url)
    }
  })

  start()

  return bus
}

function startWorkerFindface(workerData) {
  const bus = new EventEmitter()
  let worker = null

  const onExit = () => {
    start();
  }
  const onError = err => {
    console.error("--- onError ----\n", workerData, "\n", err)
  }
  const onMessage = data => {
    bus.emit('data', data)
  }

  function start() {
    worker = new Worker('./worker.findface.mjs', { workerData });
    worker.on('message', onMessage);
    worker.on('error', onError);
    worker.on('exit', onExit)
  }


  bus.on('frame', frame => {
    if (worker) {
      worker.postMessage(frame);
    }
  })

  start()

  return bus
}



async function run() {
  await pikApi.login()

  const intercomList = await pikApi.allIntercomList()
  const videoIntercomList = intercomList.filter(item => !!item.video && item.video.length)
  //.filter((item, i) => (i == 1))
  const deviceIds = []

  io.on('connection', socket => {
    socket.emit('devices', deviceIds)
  })

  const intercomBus = new EventEmitter()

  setInterval(async ()=>{

    const intercomList = await pikApi.allIntercomList()
    const videoIntercomList = intercomList.filter(item => !!item.video && item.video.length)



    intercomBus.emit('update', videoIntercomList)

  },30*60*1000)



  videoIntercomList.forEach(async intercom => {
    const { id } = intercom
    const title = intercom.renamed_name
    let url = intercom.video[0].source

    const deviceId = `intercom.${id}`

    deviceIds.push({ title, deviceId })

    const workerData = { url, title, rate: 5 }


    const workerRtsp = startWorkerRtsp(workerData)
    const workerFindface = startWorkerFindface({ title })


    function socketEmit(type, data) {
      const clientLength = io.of("/").sockets.size
      if (clientLength == 0) return;
      io.emit(`${deviceId}.${type}`, data)
    }
    function socketEmitImage(data) {
      const clientLength = io.of("/").sockets.size
      //console.log('clientLength', clientLength)
      if (clientLength == 0) return;
      io.emit(`${deviceId}.data`, data.toString('base64'))
    }


    let lastFrame = null;

    workerRtsp.on('data', data => {
      lastFrame = data
      socketEmitImage(data)
    })

    intercomBus.on('update',list =>{
      const updIntercom = list.find(item => item.id ===id)
      if (!updIntercom) return;
      const url = updIntercom.video[0].source
      workerRtsp.emit('url', url)
    })




    function handleFrame() {
      setTimeout(handlerRecognize, 1000 / FPS)
    }

    let isPause = false
    const findfacePause = () => {
      isPause = true
      setTimeout(() => isPause = false, 5000)
    }

    //let t = performance.now()
    async function handlerRecognize() {
      if (isPause || !lastFrame) return handleFrame();
      const frame = lastFrame;
      lastFrame = null

      //t = performance.now()
      workerFindface.emit('frame', frame)

      handleFrame();
    }


    workerFindface.on('data', async data => {
      //console.log('workerFindface', data)

      // console.log(performance.now() - t)
      // t = performance.now()

      if (!data) return;

      socketEmit('detections', JSON.stringify(data.boxes))

      if (data.detectFaces.length) {
        findfacePause()
        const face = data.detectFaces[0]
        logTime('Обнаружено зарегистрированное лицо:', clc.yellow(title), face.label, face.distance)
        await pikApi.intercomOpen(intercom.id)
        logTime('Команда на открытие отправлена', clc.yellow(title))
        socketEmit('face', face)
      }

    })

    handleFrame()

  })




}





run().catch(err => console.log(err))






