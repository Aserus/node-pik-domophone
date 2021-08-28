import { workerData, parentPort } from 'worker_threads'

// import { performance } from 'perf_hooks';
import * as rtsp from '../lib/rtsp-ffmpeg.js'


async function run(){
  const { url,rate,resolution } = workerData
  //console.log('start worker', workerData)


  //const timerRate = parseInt(1000 / (rate || 10))


  const stream = new rtsp.FFMpeg({
    input: url,
    rate,
    resolution,
    //quality: 1
  });
  stream.on('data', data => {
    parentPort.postMessage(data)
  });


  stream.on('error', err => {
    console.log(err)
  })
  stream.on('close', code => {
    if (code != 0 && code !=255){
      process.exit(0)
    }
  })



  parentPort.on('message',url =>{
    stream.input = url
    stream.stop()
    stream.start()
    //console.log('updated url', url)
  })

}





run().catch(err => console.log(err))
