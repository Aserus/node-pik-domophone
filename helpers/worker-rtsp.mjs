import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'
import path from 'path'

const workerPath = path.join(process.cwd(),'workers/rtsp.mjs')

export default class WorkerRtsp extends EventEmitter{
  constructor(workerData){
    super()
    this.workerData = workerData

    this.start()
  }


  start(){
    this.worker = new Worker(workerPath,{ workerData: this.workerData });
    this.worker.on('exit', () => this.start())
    this.worker.on('error', err => console.error("--- onError ----\n", err));
    this.worker.on('message', data => {
      const bufferData = Buffer.from(data)
      this.emit('data', bufferData)
    });
  }

  changeUrl(url){
    this.workerData.url = url
    if (this.worker){
      this.worker.postMessage(url)
    }
  }

}
