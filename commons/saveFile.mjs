import * as fs from 'fs';
import * as path from 'path';

const baseDir = path.resolve(process.cwd(), 'out')

export function saveFile(fileName, buf) {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir)
  }

  fs.writeFileSync(path.resolve(baseDir, fileName), buf)
}