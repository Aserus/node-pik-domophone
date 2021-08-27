
import child_process from 'child_process'
//import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'
import path from 'path'

const workerPath = path.join(process.cwd(),'workers/findface.mjs')

export default class WorkerFindface extends EventEmitter{
  constructor(workerData){
    super()
    this.workerData = workerData
    this.start()
  }


  async start(){
    if(this.worker ){
      this.worker.kill("SIGINT");
      this.worker = null
    }
    this.worker = child_process.fork(workerPath,[]);

    //console.log(this.worker)
    this.worker.on('exit', () => this.start())
    this.worker.on('error', err => console.error("--- onError ----\n", err));
    this.worker.on('message', data => this.emit('data', data));
  }




  recognizeFrame(data){
    return new Promise((resolve,reject)=>{
      if (!this.worker) return reject(new Error('worker is not started'))
      const worker = this.worker
      const onError = (err)=>{
        reject(err)
        removeHandler()
      }

      const onSuccess = (data)=>{
        resolve(data)
        removeHandler()
      }

      function removeHandler(){
        worker.off('error', onError);
        worker.off('message', onSuccess);
      }

      this.worker.once('error', onError);
      this.worker.once('message', onSuccess);
      this.worker.send(data);
    })
  }

}


