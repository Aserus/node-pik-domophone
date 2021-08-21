
import tf from '@tensorflow/tfjs-node'
import * as faceapiDist from '@vladmandic/face-api';

//import tf from '@tensorflow/tfjs-node-gpu'
//import faceapiDist from '@vladmandic/face-api/dist/face-api.node-gpu.js'

export async function getTensor(buffer) {
  const tensor = tf.tidy(() => tf.node.decodeImage(buffer).toFloat().expandDims());
  return tensor;
}

export const faceapi = faceapiDist
