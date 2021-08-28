import clc from 'cli-color'


import { EventEmitter } from 'events'

import { pikApi, io,config } from './boot/index.mjs'
import { logTime } from './helpers/index.mjs'
import WorkerFindface from './helpers/worker-findface.mjs'
import WorkerRtsp from './helpers/worker-rtsp.mjs'

const FPS_FINDFACE = 1
const FPS_STREAM = 5
const FPS_VIEW = 1


async function fetchIntercoms(){
  const intercomList = await pikApi.allIntercomList()
  const list = intercomList.filter(item => !!item.video && item.video.length)
    //.filter((item, i) => (i == 1))
  return list
}


async function run() {
  await pikApi.login()

  const videoIntercomList = await fetchIntercoms()



  const intercomBusMap = new Map();
  videoIntercomList.forEach(intercom => {
    intercomBusMap.set(intercom.id,new EventEmitter())
  })


  setInterval(async ()=>{
    const list = await fetchIntercoms()

    list.forEach(intercom => {
      const bus = intercomBusMap.get(intercom.id)
      if(!bus) return;
      bus.emit('update', intercom)
    })

  },30*60*1000)






  videoIntercomList.forEach(async intercom => {
    const { id } = intercom
    const title = intercom.renamed_name

    const bus = intercomBusMap.get(id)

    let url = intercom.video[0].source

    const deviceId = `intercom.${id}`

    const ffmpegWidth = config.get('FFMPEG_WIDTH')
    const ffmpegHeight = config.get('FFMPEG_HEIGHT')

    const resolution = ffmpegWidth+`x`+ffmpegHeight
    //console.log('resolution',resolution)
    const workerData = {
      url,
      title,
      resolution,
      rate: FPS_STREAM
    }


    const workerRtsp = new WorkerRtsp(workerData)
    const workerFindface = new WorkerFindface(workerData)




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

    bus.on('update',updIntercom =>{
      const url = updIntercom.video[0].source
      workerRtsp.changeUrl(url)
    })




    function handleFrame() {
      setTimeout(handlerRecognize, 1000 / FPS_FINDFACE)
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

      try{
        //t = performance.now()
        const data = await workerFindface.recognizeFrame(frame)
        if(data.boxes && data.boxes.length){
          socketEmit('detections', JSON.stringify(data.boxes))

          if (data.detectFaces.length) {
            findfacePause()
            const face = data.detectFaces[0]
            logTime('Обнаружено зарегистрированное лицо:', clc.yellow(title), face.label, face.distance)
            await pikApi.intercomOpen(intercom.id)
            logTime('Команда на открытие отправлена', clc.yellow(title))
            socketEmit('face', face)
          }
        }
      }catch(err){
        console.log(err)
      }

      handleFrame();
    }


    handleFrame()

  })




}





run().catch(err => console.log(err))






