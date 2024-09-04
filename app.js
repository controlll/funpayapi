import { Api, Runner, Chat } from "./funpay_api/api.js";
const goldenkey = 'YOUR GOLDEN KEY FROM COOKIES';
class app {
    constructor(){
        Api.setConfig(goldenkey);
        this.test()
    }
    async test(){
        Runner.on('orders_counters', (data)=>{
            console.log('updated order counter', data);
        })
        Runner.on('chat_counter', (data)=>{
            console.log('updated chat counter', data);
        })

        let neworders = await Api.getNewOrders();
        console.log('neworders', neworders);

        
        let chat = new Chat(11936609, 1);
        chat.on('message', (msg)=>{
            console.log(msg);
        });
    }
}
new app();