import config from './boot/index.mjs'
import path from 'path'
import PikApi from './lib/pik/api.mjs'
import createRecorder from './lib/recorder.mjs'
import { RecorderEvents, } from 'rtsp-video-recorder'


import { v1 as uuidv1 } from 'uuid';

const WORK_CODEC = process.env.WORK_CODEC




async function generateAccountUid() {
  const uid = uuidv1()
  config.set('account:uid', uid)
  await config.save()
  return uid
}


console.time("Time this");
async function start() {
  const { ACCOUNT_PHONE, ACCOUNT_PWD, ACCOUNT_UID } = process.env
  if (!ACCOUNT_PHONE) throw new Error('Не указан телефон')
  if (!ACCOUNT_PWD) throw new Error('Не указан пароль')
  const accountUid = ACCOUNT_UID || config.get('account:uid', null) || generateAccountUid()

  const api = new PikApi({
    phone: ACCOUNT_PHONE,
    password: ACCOUNT_PWD,
    uid: accountUid
  })
  await api.login()


  const intercomList = await api.allIntercomList()
  console.log('intercomList', intercomList)

  const videoIntercom = intercomList.filter(item => !!item.video && item.video.length).forEach(intercom => {
    const rtspUrl = intercom.video[0].source
    const title = intercom.renamed_name


    const recorder = createRecorder(rtspUrl, path.join(process.cwd(), '.data'), {
      title,
      noAudio: true,
      segmentTime: 3000,
      filePattern: `%Y-%m-%d/${intercom.id}/%H-%M-%S`,
      vcodec: WORK_CODEC,

    });

    recorder.on(RecorderEvents.STARTED, (payload) => {
      console.log('started')
      console.log(payload)

      // setTimeout(() => {
      //   recorder.stop()
      // }, 300000)
    });

    recorder.on(RecorderEvents.ERROR, (err) => {
      console.error(err)
      /** Do what you need in case of recording error */
    });

    recorder.on(RecorderEvents.STOPPED, (payload) => {
      console.error('FFMPEG exited. Code 255.');
      recorder.stop()
      //recorder.start()
    });

    recorder.start();




  })

  // const videoSensors = intercomList.filter(item => !!item.video && item.video.length).map(item => item.video[0].source)
  // console.log(videoSensors)


  // const t0 = performance.now();


  // async function checkLogTime(){
  //   try{
  //     await api.propsList()
  //     const t1 = performance.now();
  //     const sum = parseInt((t1 - t0) / 1000)
  //     console.log(`ok - next 25s, sum = ${sum}s`)
  //     setTimeout(checkLogTime,25000)

  //   }catch(err){
  //     console.log(err)
  //     console.timeEnd("Time this");
  //     return;
  //   }
  // }

  // setTimeout(checkLogTime, 25000)


}


start().catch(err => console.log(err))