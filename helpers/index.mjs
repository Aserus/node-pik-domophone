import moment from 'moment'
import clc from 'cli-color'

export function logTime(...args) {
  console.log(clc.blue(moment().format('YYYY-MM-DD HH:mm:ss')), ' - ', ...args)
}

