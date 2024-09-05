# Funpay.com API Project

This is a Node.js API project designed to interact with the Funpay.com website. The API allows for seamless integration and communication with Funpay's services, making it easier to develop applications that rely on Funpay's features.

## Installation

To install the necessary dependencies, run the following command:

```bash

npm install
check app.js

```
```
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
```


## Usage
After installing the dependencies, you can start using the API in your project. Make sure to review the code and customize any settings according to your needs.

## Author
This project was created by Aleksandr Iurov for https://buynstars.com.
