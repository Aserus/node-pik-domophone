import { pikApi,config } from './boot/index.mjs'

import fs from 'fs'
import path from 'path'

import express from 'express'
import http from 'http'

import { Server as SocketIoServer} from 'socket.io'
import * as rtsp from './lib/rtsp-ffmpeg.js'

import * as faceapi from '@vladmandic/face-api';

import moment from 'moment'
import clc from 'cli-color'

import EventEmitter from 'events'


import {
  canvas,
  faceDetectionNet,
  faceDetectionOptions,
} from './commons/index.mjs';

const RECG_FRAMERATE = 2
const timerTime = parseInt(1000 / RECG_FRAMERATE)

function logTime(...args){
  console.log(clc.blue(moment().format('YYYY-MM-DD HH:mm:ss')),' - ',...args)
}


const rootFolder = process.cwd()


const app = express();
const server = http.Server(app);
const io = new SocketIoServer(server);



server.listen(config.get('PORT',3000));

app.get('/', function (req, res) {
  res.sendFile(path.join(rootFolder,'public/index.html'));
});




async function regFaces() {
  const regFacePath = path.join(rootFolder, 'regfaces')

  let regFaceFiles = await fs.promises.readdir(regFacePath)
  regFaceFiles = regFaceFiles.filter(file => ['.jpg', '.png'].includes(path.extname(file)))

  const faceList = []

  for (let faceFile of regFaceFiles) {
    const name = path.basename(faceFile, path.extname(faceFile))
    const data = await fs.promises.readFile(path.join(regFacePath, faceFile))
    const img = await canvas.loadImage(data)
    const detections = await faceapi.detectAllFaces(img, faceDetectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptors()

    if (detections.length == 0) throw new Error('Регистрация лица: не обнаружено лицо')
    const faceData = detections[0]

    const labeledDescriptor = new faceapi.LabeledFaceDescriptors(
      name,
      [faceData.descriptor]
    )

    faceList.push(labeledDescriptor)
  }

  const faceMatcher = new faceapi.FaceMatcher(faceList)

  console.log('Зарегистрировано лиц:', faceList.length, regFaceFiles)

  return faceMatcher
}




async function run() {

  await faceDetectionNet.loadFromDisk('./weights')
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./weights')
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./weights')

  await pikApi.login()

  const faceMatcher = await regFaces()
  const intercomList = await pikApi.allIntercomList()
  const videoIntercomList = intercomList.filter(item => !!item.video && item.video.length)

  const bus = new EventEmitter()

  setInterval(async ()=>{

    const intercomList = await pikApi.allIntercomList()
    const videoIntercomList = intercomList.filter(item => !!item.video && item.video.length)

    bus.emit('intercoms.updated', videoIntercomList)
    //console.log('intercoms.updated')
  }, 30*60*1000)
    //.filter((item, i) => i === 0)

  const deviceIds = []

  videoIntercomList.forEach(async intercom => {
    const rtspUrl = intercom.video[0].source
    const title = intercom.renamed_name

    const deviceId = `intercom.${intercom.id}`

    deviceIds.push({title,deviceId})






    function socketEmit(type,data){
      const clientLength = io.of("/").sockets.size
      if (clientLength == 0) return;
        io.emit(`${deviceId}.${type}`, data)
    }

    function socketEmitImage(data){
      const clientLength = io.of("/").sockets.size
      //console.log('clientLength', clientLength)
      if (clientLength == 0) return;
      io.emit(`${deviceId}.data`, data.toString('base64'))
    }

    console.log('Подключена камера домофона:', clc.yellow(title))
    const stream = new rtsp.FFMpeg({
      input: rtspUrl,
      rate: 10,
      //quality: 1
    });

    bus.on('intercoms.updated', (list) => {
      for (const item of list){
        if (item.id == intercom.id){
          const rtspUrl = item.video[0].source
          stream.input = rtspUrl
          //console.log('intercoms.updated source', rtspUrl)
          break
        }
      }
    })


    const pipeStream = (data) => socketEmitImage(data)
    stream.on('data', pipeStream);

    let lastFrame = null
    let isPause = false

    stream.on('error', err => {
      console.log(err)
      lastFrame = null
    })
    stream.on('data', (data) => {
      lastFrame = data
    })


    async function handlerRecognize(){
      if (isPause || !lastFrame) return setTimeout(() => handlerRecognize(), timerTime);
      try{
        const img = await canvas.loadImage(lastFrame)
        const detections = await faceapi.detectAllFaces(img, faceDetectionOptions)   // надо потом попробовать detectSingleFace
          .withFaceLandmarks()
          .withFaceDescriptors()

        if (detections.length) {
          const list = detections.map(item => item.detection.box)
          socketEmit('detections', JSON.stringify(list))
        }

        for (const detection of detections){
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor)
          if (bestMatch.label == 'unknown') {
            //console.log('лицо не распознано')
            continue;
          }
          socketEmit('face', bestMatch.label)
          logTime('Обнаружено зарегистрированное лицо:', clc.yellow(title), bestMatch.label, bestMatch.distance)
          isPause = true
          setTimeout(() => isPause = false ,5000)
          await pikApi.intercomOpen(intercom.id)
          logTime('команда на открытие отправлена', clc.yellow(title))
          break;
        }
      }catch(err){
        console.log('err handlerRecognize',err)
        console.log('err handlerRecognize lastFrame',typeof (lastFrame))
      }

      setTimeout(() => handlerRecognize(), timerTime)
    }

    handlerRecognize();
  })

  io.on('connection',socket => {
    socket.emit('devices', deviceIds)
  })
}






run().catch(err=>console.log(err))