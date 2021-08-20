import * as faceapi from '@vladmandic/face-api';

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