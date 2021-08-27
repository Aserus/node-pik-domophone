import express from 'express';

import intercoms from './intercoms.mjs'
import users from './users.mjs'


const router = express.Router();


router.use(users)
router.use(intercoms)


export default router