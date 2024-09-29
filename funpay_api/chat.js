import { Api, Runner } from "./api.js";
import { timeout } from './utils.js';
import EventEmitter from 'events';
class chat extends EventEmitter {
    constructor(id, lastMessage = 0){
        super();
        this.loaded = false;
        this.id = id;
        this.lastMessage = lastMessage;
        this.init();
    }
    async init(){
        if(this.lastMessage == 0){
            try{
                this.lastMessage = await Api.getUserLastMessage(this.id);
            }catch(e){
                console.error('error getUserLastMessage:', e);
                await timeout(5000);
                return await this.init();
            }
        }
        console.log('loaded chat, last message',this.lastMessage);
        this.handlerId = await Runner.attachChat(this.id, (message)=>{
            if(message.author == parseInt(this.id)){
                if(message.id < this.lastMessage){
                    //console.log('trash message', message.id, this.lastMessage);
                    return;
                }
                this.emit('message', message);
            }
        }, this.lastMessage);
        this.loaded = true;
    }
    async sendMessage(message){
        await this.ready();
        Runner.sendMessageToChat(this.id, message);
    }
    async sendFile(fileid){
        await this.ready();
        Runner.sendFileToChat(this.id, fileid);
    }
    async remove(){
        await this.ready();
        Runner.removeChat(this.handlerId, this.id);
        delete this;
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
export default chat;