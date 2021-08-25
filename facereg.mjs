
import path from 'path'


import { config } from './boot/index.mjs'
import faceReg from './helpers/facereg.mjs';



const rootFolder = process.cwd()
const faceFolder = path.join(rootFolder,'.data/faces')




config.get('')




faceReg().catch(err => console.log(err))
