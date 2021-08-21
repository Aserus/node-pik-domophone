import {
  //workerData,
  parentPort
} from 'worker_threads'

import fs from 'fs'
import path from 'path'
import { Buffer } from 'buffer'

import getFaceMatcher from './helpers/face-matcher.mjs'
import { getTensor,faceapi } from './helpers/faceapi.mjs'


import {
//  canvas,
  faceDetectionNet,
  faceDetectionOptions,
} from './commons/index.mjs';






async function run(){

  // then initialize tfjs
  await faceapi.tf.setBackend('tensorflow');
  await faceapi.tf.enableProdMode();
  await faceapi.tf.ENV.set('DEBUG', false);
  await faceapi.tf.ready();
  //console.log('Worker: PID:', process.pid, `TensorFlow/JS ${faceapi.tf.version_core} FaceAPI ${faceapi.version.faceapi} Backend: ${faceapi.tf.getBackend()}`);




  const modelPath = './weights'
  await faceDetectionNet.loadFromDisk(modelPath)
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath)
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)

  const faceMatcher = getFaceMatcher()




  parentPort.on('message', async (data) => {

    const frame = Buffer.from(data)
    const tensor = await getTensor(frame).catch(() =>{
      fs.promises.writeFile(path.join(process.cwd(),'.data/err_tmp.jpg'), frame)
      return null
    })
    if (!tensor) return;
    const detections = await faceapi.detectAllFaces(tensor, faceDetectionOptions)   // надо потом попробовать detectSingleFace
      .withFaceLandmarks()
      .withFaceDescriptors()

    tensor.dispose();

    if (detections.length == 0) return;

    const boxes = detections.map(item => item.detection.box)

    const detectFaces = []

    for (const detection of detections) {
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor)
      if (bestMatch.label == 'unknown') {
        //console.log('лицо не распознано')
        continue;
      }
      detectFaces.push({
        label: bestMatch.label,
        distance: bestMatch.distance
      })
      break;
    }


    parentPort.postMessage({ boxes, detectFaces });
  });



}


run()