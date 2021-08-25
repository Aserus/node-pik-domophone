import {
  //workerData,
  parentPort
} from 'worker_threads'


//import { Buffer } from 'buffer'


import { faceapi, loadImage, initFaceApi,faceDetectionOptions } from '../helpers/faceapi.mjs'
import getFaceMatcher from '../helpers/face-matcher.mjs'





async function run(){
  await initFaceApi()


  const faceMatcher = await getFaceMatcher()



  parentPort.on('message', async (data) => {
    //return;
    const frame = Buffer.from(data)
    const tensor = await loadImage(frame)

    if (!tensor) return;
    const detections = await faceapi.detectAllFaces(tensor, faceDetectionOptions)   // надо потом попробовать detectSingleFace
      .withFaceLandmarks()
      .withFaceDescriptors()

    tensor.dispose();

    if (detections.length == 0) return;


    const boxes = detections.map(item => item.detection.box)

    const detectFaces = []


    if(faceMatcher){
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
    }

    parentPort.postMessage({ boxes, detectFaces });
  });




}


run()