import express from 'express';
import { v4 as uuidv4 } from 'uuid';




import { config } from '../boot/config.mjs'

import {
  clearFaceFolder,
  saveFaceByBase64
} from '../helpers/index.mjs'

import {
  restartFindface,
} from '../helpers/worker-findface.mjs'








const router = express.Router();




router.get('/users', (req, res) => {
  const assoc = config.get('users') || {}
  const list = Object.values(assoc)
  res.json({ list });
});



router.delete('/users', async (req, res) => {
  await clearFaceFolder()
  config.set('users', {})
  await config.save()
  res.json({success:1})
})

router.post('/users', async (req, res) => {
  const { name,faces } = req.body

  if (!name) throw new Error('Не указано имя')
  if (!faces || faces.length==0) throw new Error('Нет фотографий лиц')

  const faceList = []
  for(let item of faces){
    const file = await saveFaceByBase64(item.img)
    const face = {
      descriptor: item.descriptor,
      file
    }
    faceList.push(face)
  }

  const user = {
    id: uuidv4(),
    name,
    faces:faceList
  }

  const userAssoc = config.get('users') || {}

  userAssoc[user.id] = user
  config.set('users', userAssoc)
  await config.save()

  restartFindface()


  res.json({ success:1 });
});







export default router