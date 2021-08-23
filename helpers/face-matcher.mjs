import { config } from '../boot/config.mjs'
import { faceapi } from './faceapi.mjs'






export default ()=>{

  let peopleList = config.get('people')

  if (!peopleList || peopleList.length==0) throw new Error('Нету зарегистрированных лиц')
  console.log('Зарегистрированных лиц:',peopleList.length)


  const faceList = Array.from(peopleList).map(item => {

    const descriptors = Array.from(item.faces).map(face => new Float32Array(face.descriptor))
    const labeledFace = new faceapi.LabeledFaceDescriptors(item.name, descriptors)

    return labeledFace
  })




  const faceMatcher = new faceapi.FaceMatcher(faceList)

  return faceMatcher
}