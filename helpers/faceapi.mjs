import fs from 'fs'
import path from 'path'
//import canvas from 'canvas'
import mkdirp from 'mkdirp'
import tf from '@tensorflow/tfjs-node'
import * as faceapiDist from '@vladmandic/face-api';
import { facesFolder } from '../boot/config.mjs'





export const faceapi = faceapiDist

export const faceDetectionNet = faceapi.nets.ssdMobilenetv1
//export const faceDetectionNet = faceapi.nets.tinyFaceDetector


// SsdMobilenetv1Options
const minConfidence = 0.5
const maxResults = 3

// TinyFaceDetectorOptions
const inputSize = 800
const scoreThreshold = 0.3

function getFaceDetectorOptions(net) {
  return net === faceapi.nets.ssdMobilenetv1
    ? new faceapi.SsdMobilenetv1Options({ minConfidence, maxResults })
    : new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
}

export const faceDetectionOptions = getFaceDetectorOptions(faceDetectionNet)





//import tf from '@tensorflow/tfjs-node-gpu'
//import faceapiDist from '@vladmandic/face-api/dist/face-api.node-gpu.js'


// export async function loadImage(buffer) {
//   // const img = await canvas.loadImage(buffer);
//   // const c = canvas.createCanvas(img.width, img.height);
//   // const ctx = c.getContext('2d');
//   // ctx.drawImage(img, 0, 0, img.width, img.height);
//   // // const out = fs.createWriteStream('test.jpg');
//   // // const stream = c.createJPEGStream({ quality: 0.6, progressive: true, chromaSubsampling: true });
//   // // stream.pipe(out);
//   return await canvas.loadImage(buffer);
// }

export async function loadImage(buffer) {
  const tensor = tf.tidy(() => tf.node.decodeImage(buffer).toFloat().expandDims());
  return tensor;
}





export async function initFaceApi(){
  const modelPath = path.join(process.cwd(), 'node_modules/@vladmandic/face-api/model')

  // then initialize tfjs
  await faceapi.tf.setBackend('tensorflow');
  await faceapi.tf.enableProdMode();
  await faceapi.tf.ENV.set('DEBUG', false);
  await faceapi.tf.ready();
  //console.log('Worker: PID:', process.pid, `TensorFlow/JS ${faceapi.tf.version_core} FaceAPI ${faceapi.version.faceapi} Backend: ${faceapi.tf.getBackend()}`);


  await faceDetectionNet.loadFromDisk(modelPath)
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath)
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
  return faceapi
}





export async function writeFace(imageNameNew,data) {
  await mkdirp(facesFolder)
  await fs.promises.writeFile(path.join(facesFolder, imageNameNew), data)
}
export async function clearFaceFolder() {
  const files = await fs.promises.readdir(facesFolder)
  for (const file of files) {
    await fs.promises.unlink(path.join(facesFolder, file))
  }
}