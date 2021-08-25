import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'
import path from 'path'

const workerPath = path.join(process.cwd(),'workers/findface.mjs')

export default class WorkerFindface extends EventEmitter{
  constructor(workerData){
    super()
    this.workerData = workerData
    this.start()
  }


  start(){
    this.worker = new Worker(workerPath,{ workerData: this.workerData });
    this.worker.on('exit', () => this.start())
    this.worker.on('error', err => console.error("--- onError ----\n", err));
    this.worker.on('message', data => this.emit('data', data));
  }




  recognizeFrame(data){
    if (this.worker) {
      this.worker.postMessage(data);
    }
  }

}


