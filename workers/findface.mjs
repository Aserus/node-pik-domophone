// import {
//   //workerData,
//   parentPort
// } from 'worker_threads'


//import { Buffer } from 'buffer'


import { faceapi, loadImage, initFaceApi,faceDetectionOptions } from '../helpers/faceapi.mjs'
import getFaceMatcher from '../helpers/face-matcher.mjs'

//import sharp from 'sharp'
import sizeOf from 'image-size'



//let iCounter = 0
async function run(){
  await initFaceApi()


  const faceMatcher = await getFaceMatcher()
  let dimensions

  process.on('message', async (msg) => {
    const origFrame = Buffer.from(msg.data)
    if(!dimensions){
      const { width,height } = sizeOf(origFrame)
      dimensions = { width,height }
    }

    //console.log(iCounter++)

    const frame = origFrame
    // const frame =await sharp(origFrame)
    //   //.resize(320,180)
    //   .resize(640,360)
    //   .toBuffer()

    const tensor = await loadImage(frame)


    const detectFaces = []
    const boxes = []

    if (!tensor) {
      process.send({ boxes, detectFaces });
      return
    }

    let detections = await faceapi.detectAllFaces(tensor, faceDetectionOptions)   // надо потом попробовать detectSingleFace
     .withFaceLandmarks()
     .withFaceDescriptors()

    tensor.dispose()

    if (detections.length == 0) {
      process.send({ boxes, detectFaces });
      return
    }


    if(dimensions){
      detections = detections.map(item => faceapi.resizeResults(item, dimensions))
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