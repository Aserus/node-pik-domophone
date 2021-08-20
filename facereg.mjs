import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import { v4 as uuidv4 } from 'uuid';
import * as faceapi from '@vladmandic/face-api';

import { config } from './boot/index.mjs'

import {
  faceDetectionNet,
  faceDetectionOptions,
} from './commons/index.mjs';

import {
  canvas,
} from './commons/env.mjs';


// import { getTensor } from './helpers/faceapi.mjs'


const rootFolder = process.cwd()
const faceFolder = path.join(rootFolder,'.data/faces')



async function clearFaceFolder(){
  const files = await fs.promises.readdir(faceFolder)
  for (const file of files) {
    await fs.promises.unlink(path.join(faceFolder, file))
  }
}

async function getFaceToRegFolder(){
  const regFacePath = process.argv[2] || path.join(rootFolder, 'regfaces')
  try {
    await fs.promises.access(regFacePath);
    return regFacePath
  } catch (error) {
    throw new Error(`Регистрация лица: Папка с лицами пуста: ${regFacePath}`)
  }
}

async function findFaceToReg(){
  const regFacePath = await getFaceToRegFolder()
  let regFaceFiles = await fs.promises.readdir(regFacePath)
  regFaceFiles = regFaceFiles.filter(name => ['.jpg', '.png'].includes(path.extname(name)))

  if (regFaceFiles.length==0) throw new Error(`Регистрация лица: Папка с лицами пуста: ${regFacePath}`)
  return regFaceFiles.map(name => path.join(regFacePath, name))
}


async function run() {

  await faceDetectionNet.loadFromDisk('./weights')
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./weights')
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./weights')

  await mkdirp(faceFolder)
  await clearFaceFolder()


  const regFaceFiles = await findFaceToReg()


  const faceList = []

  for (let faceFile of regFaceFiles) {
    const extname = path.extname(faceFile)
    const name = path.basename(faceFile, extname)
    const data = await fs.promises.readFile(faceFile)

    const tensor = await canvas.loadImage(data)

    const faceData = await faceapi.detectSingleFace(tensor, faceDetectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor()
    return;
    tensor.dispose()

    if (!faceData) throw new Error('Регистрация лица: не обнаружено лицо')

    const imageNameNew = uuidv4() + extname.toLowerCase()

    await fs.promises.copyFile(faceFile, path.join(faceFolder, imageNameNew))

    const id = uuidv4()

    const face = {
      id,
      name,
      faces:[
        {
          file: imageNameNew,
          descriptor: [...faceData.descriptor]
        }
      ]
    }
    faceList.push(face)
  }

  config.set('people', faceList)



  await config.save()

  console.log('Зарегистрировано лиц:', faceList.length, regFaceFiles)
  return
}








run().catch(err => console.log(err))