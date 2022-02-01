import dotenv from 'dotenv'
import nconf from 'nconf'
import path from 'path'
import mkdirp from 'mkdirp'
import fs from 'fs'

dotenv.config()

export const storageFolder = '/app-data'
export const facesFolder = path.join(storageFolder, 'faces')

nconf.argv()
  .env()
  .use('file', { file: path.join(storageFolder, 'config.json') })


function nconfSave() {
  return new Promise((resolve, reject) => {
    nconf.save((err) => {
      if (err) return reject(err)
      resolve()
    });
  })
}

class Config {
  get(propName) { return nconf.get(propName) }
  set(propName, val) { return nconf.set(propName, val) }
  async save() {
    try {
      await fs.promises.access(storageFolder);
    } catch {
      await mkdirp(storageFolder)
    }
    await nconfSave()
  }

}

export const config = new Config()

