import { Api, Runner } from "./api.js";
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
        if(this.lastMessage == 0)
            this.lastMessage = await Api.getUserLastMessage(this.id);
        console.log('this.lastMessage', this.lastMessage);
        this.handlerId = await Runner.attachChat(this.id, (message)=>{
            if(message.author == parseInt(this.id))
                this.emit('message', message);
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