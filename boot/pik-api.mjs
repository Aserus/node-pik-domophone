import PikApi from '../lib/pik/api.mjs'
import { config } from './config.mjs'


import { v1 as uuidv1 } from 'uuid';


function generateAccountUid() {
  const uid = uuidv1()
  config.set('account:uid', uid)
  config.save()
  return uid
}





const { ACCOUNT_PHONE, ACCOUNT_PWD, ACCOUNT_UID } = process.env
if (!ACCOUNT_PHONE) throw new Error('Не указан телефон')
if (!ACCOUNT_PWD) throw new Error('Не указан пароль')
const accountUid = ACCOUNT_UID || config.get('account:uid') || generateAccountUid()

export const pikApi = new PikApi({
  phone: ACCOUNT_PHONE,
  password: ACCOUNT_PWD,
  uid: accountUid
})

