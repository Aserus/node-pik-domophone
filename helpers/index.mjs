import moment from 'moment'
import clc from 'cli-color'

import fs from 'fs'
import path from 'path'

import mkdirp from 'mkdirp'
import mime from 'mime-types'
import { v4 as uuidv4 } from 'uuid';

import { facesFolder } from '../boot/config.mjs'


export function logTime(...args) {
  console.log(clc.blue(moment().format('YYYY-MM-DD HH:mm:ss')), ' - ', ...args)
}




function decodeBase64Image(dataString) {
  const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  const response = {}

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer.from(matches[2], 'base64');

  return response;
}

export async function saveFaceByBase64(dataString) {

  const obj = decodeBase64Image(dataString)
  await mkdirp(facesFolder)

  const extname = mime.extension(obj.type);
  const fileName = uuidv4() + extname.toLowerCase()

  await fs.promises.writeFile(path.join(facesFolder, fileName), obj.data)
  return fileName
}


export async function clearFaceFolder() {
  const files = await fs.promises.readdir(facesFolder)
  for (const file of files) {
    await fs.promises.unlink(path.join(facesFolder, file))
  }
}