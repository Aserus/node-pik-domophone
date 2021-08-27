import express from 'express';
import { pikApi } from '../boot/index.mjs'


const router = express.Router();






router.get('/intercoms', async (req, res) => {
  const list = await pikApi.allIntercomList()
  res.json({ list })
})

router.post('/intercoms/:ID/unlock', async (req, res) => {
  await pikApi.intercomOpen(req.params.ID)
  res.json({ success:1 })
})





export default router