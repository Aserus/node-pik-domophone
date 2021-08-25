import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import { v4 as uuidv4 } from 'uuid';
import * as faceapi from '@vladmandic/face-api';

import { config } from './boot/index.mjs'


import { loadImage, faceDetectionOptions } from './helpers/faceapi.mjs'

const rootFolder = process.cwd()
const faceFolder = path.join(rootFolder,'.data/faces')

async function clearFaceFolder(){
  const files = await fs.promises.readdir(faceFolder)
  for (const file of files) {
    await fs.promises.unlink(path.join(faceFolder, file))
  }
}

async function getFaceToRegFolder(regFacePath){
  try {
    await fs.promises.access(regFacePath);
    return regFacePath
  } catch (error) {
    throw new Error(`Регистрация лица: Папка с лицами пуста: ${regFacePath}`)
  }
}



async function faceReg() {


  await mkdirp(faceFolder)
  await clearFaceFolder()


  const regFacesPath = await getFaceToRegFolder(facesPath)
  let regFaceFiles = await fs.promises.readdir(regFacesPath)
  regFaceFiles = regFaceFiles.filter(name => ['.jpg', '.png'].includes(path.extname(name)))

  if (regFaceFiles.length==0) throw new Error(`Регистрация лица: В папке с лицами нет изображений: ${regFacesPath}`)
  regFaceFiles = regFaceFiles.map(name => path.join(regFacesPath, name))


  const faceList = []

  for (let faceFile of regFaceFiles) {
    const extname = path.extname(faceFile)
    const name = path.basename(faceFile, extname)
    const data = await fs.promises.readFile(faceFile)

    const tensor = await loadImage(data)

    const faceData = await faceapi.detectSingleFace(tensor, faceDetectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor()

    //tensor.dispose()

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






export default faceReg

