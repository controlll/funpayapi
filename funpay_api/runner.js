import EventEmitter from 'events';
import { JSDOM } from 'jsdom';
import jQuery from 'jquery';
import { Api } from './api.js';
import { getUsersId } from './utils.js';
import randomstring from 'randomstring';
class runner extends EventEmitter {
    constructor(){
        super();
        this.loaded = false;
        this.data = {};
        this.handlers = {};
        this.requestShift = 0;
    }
    async init(){
        this.objects = [
            {"type":"orders_counters","id":Api.data.userId,"tag":"starsbot","data":true},
            {"type":"chat_counter","id":Api.data.userId,"tag":"starsbot","data":true},
        ];
        this.requests = []
        setInterval(()=>{
            this.update();
        }, 5000);
        this.loaded = true;
    }
    async attachChat(id, cb, last_message = 0){
        await this.ready();
        let chatid = getUsersId(Api.data.userId, id);
        let handlerId = randomstring.generate(16);
        if(this.handlers[handlerId])
            return false;
        let lastDate;
        let lastUsername;
        this.handlers[handlerId] = (data)=>{
            if(data.node.name == chatid){
                for(let message of data.messages){
                    const { window } = new JSDOM(message.html.replace(/\n/g, '').replace(/\s{2,}/g, ' '));
                    const $ = jQuery(window);
                    const date = $('.chat-msg-date').attr('title')
                    const msg = $('.chat-msg-text').html();
                    const username = $('.media-user-name').text().trim();
                    if(date)
                        lastDate = date;
                    if(username != '')
                        lastUsername = username;
                    cb({id:message.id, date:date||lastDate||new Date(), msg, author:message.author, username:username||lastUsername||'?'});
                }
            }
        }
       
        this.objects.push({"type":"chat_node","id":chatid,"data":{
            "node":chatid,"last_message":parseInt(last_message),"content":""
        }});
        this.on('chat_node', this.handlers[handlerId]);
        await this.update();
        return handlerId;
    }
    async removeChat(handlerId, id){
        let chatid = getUsersId(Api.data.userId, id);
        for(let i = 0; i < this.objects.length; i++){
            if(this.objects[i].type == "chat_node" && this.objects[i].id == chatid){
                this.off('chat_node', this.handlers[handlerId]);
                delete this.handlers[handlerId];
                this.objects.splice(i, 1);
                return true;
            }
        }
        return false;
    }
    getChat(id){
        let chatid = getUsersId(Api.data.userId, id);
        for(let object of this.objects){
            if(object.type == "chat_node" && object.id == chatid)
                return object;
        }
        return false;
    }
    async update(){
        let obj = this.objects;
        if(obj.length > 6){
            obj = [obj[0], obj[1], ...obj.slice(2+this.requestShift, 6+this.requestShift)];
            if(this.requestShift+6>=this.objects.length){
                this.requestShift=0;
            }else{
                this.requestShift+=4;
                if(this.requestShift>this.objects.length)
                    this.requestShift=this.objects.length;
            }
        }
        let data = {
            objects:JSON.stringify(obj),
            request:this.requests.length>0?JSON.stringify(this.requests.splice(0, 1)[0]):false
        }
        try{
            let res = await Api.post('runner/', data);
            await this.parser(JSON.parse(res));
        }catch(e){
            if(data.request)
                this.requests.unshift(data.request);
            console.log(e);
        }
    }
    async sendMessageToChat(id, message){
        let chatid = getUsersId(Api.data.userId, id);
        let chatObj = this.getChat(id);
        if(!chatObj){
            var handlerId = await this.attachChat(id, ()=>{});
            chatObj = this.getChat(id);
        }
        chatObj.data.last_message++;
        await this.addRequest({"action":"chat_message","data":{"node":chatid,"last_message":chatObj.data.last_message,"content":message}})
        if(handlerId)
            await this.removeChat(handlerId, id);
        
        return true;
    }
    async sendFileToChat(id, file){
        let chatid = getUsersId(Api.data.userId, id);
        let chatObj = this.getChat(id);
        if(!chatObj)
            return false;
        chatObj.data.last_message++;
        await this.addRequest({"action":"chat_message","data":{"node":chatid,"last_message":chatObj.data.last_message,"content":"","image_id":file}})
        return true;
    }
    async addRequest(request){
        this.requests.push(request);
        await this.update();
    }
    async parser(data){
        let objects = data.objects;
        for(let obj of objects){
            switch(obj.type){
                case 'orders_counters':
                    if(!this.data.orders_counters)
                        this.data.orders_counters = obj.data;
                    if(JSON.stringify(this.data.orders_counters) != JSON.stringify(obj.data))
                        this.emit('orders_counters', obj.data);
                    this.data.orders_counters = obj.data;
                break;
                case 'chat_counter':
                    if(!this.data.chat_counter)
                        this.data.chat_counter = obj.data;
                    if(JSON.stringify(this.data.chat_counter) != JSON.stringify(obj.data))
                        this.emit('chat_counter', obj.data);
                    this.data.chat_counter = obj.data;
                break;
                case 'chat_node':
                    for(let _obj of this.objects){
                        if(obj.data && _obj.type == "chat_node" && _obj.id == obj.id && obj.data.messages.length != 0){
                            _obj.data.last_message = obj.data.messages[obj.data.messages.length-1].id;
                            this.emit('chat_node', obj.data);
                        }
                    }
                break;
            }
        }
    }
    async ready(){
        return new Promise((resolve)=>{
            if(this.loaded)
                return resolve();
            let interval = setInterval(()=>{
                if(!this.loaded)
                    return;
                clearInterval(interval);
                resolve();
            }, 16)
        })
    }
}
export default runner;