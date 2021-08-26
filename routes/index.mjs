import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path'



import { config } from '../boot/config.mjs'

import {
  initFaceApi,
  loadImage,
  faceDetectionOptions,
  clearFaceFolder,
  writeFace
} from '../helpers/faceapi.mjs'




const router = express.Router();




router.get('/users', (req, res) => {
  const list = config.get('users') || []
  res.json({ list });
});



router.delete('/users', async (req, res) => {
  await clearFaceFolder()
  config.set('users', [])
  await config.save()
  res.json({success:1})
})
router.post('/users', async (req, res) => {
  //const list = config.get('users') || []

  const { photo } = req.files
  const { name } = req.body

  if (!photo) throw new Error('Не указана фотка')

  const extname = path.extname(photo.name).toLowerCase()

  if (!['.jpeg', '.jpg', '.png'].includes(extname)) throw new Error('Неподдерживаемое расширение')

  const userList = config.get('users') || []


  const faceapi = await initFaceApi()



  const img = await loadImage(photo.data)

  const faceData = await faceapi.detectSingleFace(img, faceDetectionOptions)
   .withFaceLandmarks()
   .withFaceDescriptor()

  img.dispose()

  if (!faceData) throw new Error('Регистрация лица: не обнаружено лицо')

  const imageNameNew = uuidv4() + extname.toLowerCase()
  await writeFace(imageNameNew,photo.data)
  const id = uuidv4()

  const face = {
    id,
    name,
    faces: [
      {
        file: imageNameNew,
        descriptor: [...faceData.descriptor]
      }
    ]
  }
  userList.push(face)
  config.set('users', userList)
  await config.save()


  res.json({ success:1 });
});








export default router