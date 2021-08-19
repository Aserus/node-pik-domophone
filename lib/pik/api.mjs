import EventEmitter from 'events'
import axios from 'axios'
import { v1 as uuidv1 } from 'uuid';





const API_BASEURL = 'https://intercom.pik-comfort.ru/api/'
const API_USERAGENT = 'domophone-ios/128987 CFNetwork/1237 Darwin/20.4.0'
const API_VERSION = 2






class PikApi extends EventEmitter {
    constructor(params = {}){
        super()

        this.phone = params.phone
        this.password = params.password
        this.uid = params.uid || uuidv1()
    }
    static createInstanceApi(headers = {}) {
        return axios.create({
            baseURL: API_BASEURL,
            timeout: 6000,
            headers: {
                ...headers,
                'User-Agent': API_USERAGENT,
                'api-version': API_VERSION,

            }
        });
    }

    async login(){
        return this.fetchToken()
    }

    setToken(token){
        this.token = token
        this.createInstance()
    }
    async fetchToken(){
        const params = {
            account: {
                phone: this.phone,
                password: this.password
            },
            customer_device: {
                uid: this.uid
            }

        }

        const res = await this.constructor.createInstanceApi().post('/customers/sign_in', params)

        const { authorization } = res.headers
        if (!authorization) throw new Error('not auth')
        const tmp = authorization.split(' ')
        const token = tmp[1] || null

        this.setToken(token)
        this.emit('token',token)
    }

    createInstance(){
        this.api = this.constructor.createInstanceApi({
            'Authorization': `Bearer ${this.token}`
        })
        return this.api
    }


    async propsList(){
        const { data } = await this.api.get(`/customers/properties/`)
        return data
    }
    async apartmentList(){
        const { apartments } = await this.propsList()
        return apartments
    }

    async intercomList(apartmentId){
        const { data } = await this.api.get(`/customers/properties/${apartmentId}/intercoms`)
        return data
    }

    async intercomOpen(intercomId){
        const { data } = await this.api.post(`/customers/intercoms/${intercomId}/unlock`)
        return data
    }

    async allIntercomList(){
        const aparmentList = await this.apartmentList()

        const intercomList = []
        for (const aparment of aparmentList) {
            const list = await this.intercomList(aparment.id)
            if (list.length) intercomList.push(...list)
        }
        return intercomList
    }



}





export default PikApi