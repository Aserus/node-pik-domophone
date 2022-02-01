import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'
import path from 'path'
import axios from 'axios'

const workerPath = path.join(process.cwd(),'workers/rtsp.mjs')

const sleep = (time) => new Promise((resolve, _) => setTimeout(() => resolve(),time))



export default class WorkerRtsp extends EventEmitter{
  constructor(workerData){
    super()
    this.workerData = workerData
    const rate = Number(this.workerData.rate || 10)
    this.time = parseInt(1000 / rate)
    this.errorCount = 0
    this.lastData= null
    this.start()
 
    setInterval(()=>{
      if (this.errorCount > 0) this.errorCount--
    },3000)

  }

  async fetchImage(){
    const {data} = await axios.get(this.workerData.photo_url, { responseType: 'arraybuffer' })    
    const b64 = Buffer.from(data, 'binary').toString('base64')
    if (this.lastData === b64){
      
      throw new Error('non')
    }
    this.lastData = b64
    //console.log('cool img')
    this.emit('data', data)
  }
  async stepFetch(){
    if (this.errorCount > 3){
      this.errorCount = 0;
      console.log('fetch sleep')
      await sleep(30000)

    }
    setTimeout(async () => {
      try{
        await this.fetchImage()
      }catch(err){
        console.log('fetch error')
        // console.log(err)
        this.errorCount++
      }
      
      this.stepFetch()
    }, this.time)
  }

  start(){
    this.stepFetch()

    // this.worker = new Worker(workerPath,{ workerData: this.workerData });
    // this.worker.on('exit', () => this.start())
    // this.worker.on('error', err => console.error("--- onError ----\n", err));
    // this.worker.on('message', data => {
    //   const bufferData = Buffer.from(data)
    //   this.emit('data', bufferData)
    // });
  }

  changeUrl(url){
    this.workerData.url = url
    if (this.worker){
      this.worker.postMessage(url)
    }
  }

  changePhotoUrl(photo_url){
    this.workerData.photo_url = photo_url
  }

}
