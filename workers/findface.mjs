// import {
//   //workerData,
//   parentPort
// } from 'worker_threads'


//import { Buffer } from 'buffer'


import { faceapi, loadImage, initFaceApi,faceDetectionOptions } from '../helpers/faceapi.mjs'
import getFaceMatcher from '../helpers/face-matcher.mjs'

import sharp from 'sharp'





async function run(){
  await initFaceApi()


  const faceMatcher = await getFaceMatcher()


  process.on('message', async (msg) => {
    const origFrame = Buffer.from(msg.data)


    const frame = await sharp(origFrame).resize(320,180).toBuffer()

    const tensor = await loadImage(frame)


    const detectFaces = []
    const boxes = []
    if (!tensor) {

      process.send({ boxes, detectFaces });
      return
    }
    const detections = await faceapi.detectAllFaces(tensor, faceDetectionOptions)   // надо потом попробовать detectSingleFace
    //  .withFaceLandmarks()
    //  .withFaceDescriptors()

    tensor.dispose()
    process.send({ boxes, detectFaces });
    return;


    if (detections.length == 0) {
      process.send({ boxes, detectFaces });
      return
    }


    detections.forEach(item => boxes.push(item.detection.box))




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

    process.send({ boxes, detectFaces });
  });




}


run()