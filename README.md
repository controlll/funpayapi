# Funpay.com API Project

This is a Node.js API project designed to interact with the Funpay.com website. The API allows for seamless integration and communication with Funpay's services, making it easier to develop applications that rely on Funpay's features.

## Installation

To install the necessary dependencies, run the following command:

```bash
npm i funpay-js-api
```

#### Example Usage

```javascript
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


#### API
The Api class provides methods for interacting with the Funpay API.

## Methods

- `setConfig(key: string): Promise<void>`
    - Set the API key and initialize the instance.

- `getUserLastMessage(id: number): Promise<string>`
    - Retrieve the last message ID for a given user.

- `getOffers(id?: number): Promise<any>`
    - Retrieve offers for a specific user or for the current user.

- `getLots(node: string): Promise<any>`
    - Retrieve lots for a specific offer node.

- `getOfferPage(node: string, offer: string): Promise<any>`
    - Get the page for a specific offer.

- `updateOfferPage(offerPage: any): Promise<any>`
    - Update the offer page with new data.

- `updatePrice(node: string, offer: string, price: number): Promise<void>`
    - Update the price of a specific offer.

- `getUserLangById(id: number): Promise<string>`
    - Get the language preference of a user.

- `getUserByDialogId(dialogId: string): Promise<{ userId: string, lang: string }>`
    - Retrieve user information by dialog ID.

- `getDialogs(): Promise<any[]>`
    - Retrieve a list of dialogs for the current user.

- `getNewOrders(): Promise<any[]>`
    - Retrieve new orders for the current user.

- `refund(orderId: string): Promise<any>`
    - Refund an order by ID.

- `svgtopng(base64Svg: string): Promise<Buffer>`
    - Convert a base64 SVG image to PNG format.

- `uploadFileFromBuffer(imageBuffer: Buffer, contentType: string): Promise<any>`
    - Upload a file from a buffer.

- `uploadFileFromUrl(src: string): Promise<any>`
    - Upload a file from a URL or base64 encoded string.


#### Runner
The Runner class handles chat interactions and emits events.

## Event Handling
- `on(event: 'orders_counters', listener: (data: any) => void): void`
    - Listen for the orders_counters event.

- `on(event: 'chat_counter', listener: (data: any) => void): void`
    - Listen for the chat_counter event.

- `off(event: 'orders_counters', listener: (data: any) => void): void`
    - Stop listening for the orders_counters event.

- `off(event: 'chat_counter', listener: (data: any) => void): void`
    - Stop listening for the chat_counter event.


## `Chat` Class

The `Chat` class manages individual chat instances, allowing you to send messages, send files, and handle chat-specific events.

### Constructor

- `constructor(id: number, lastMessage?: number)`
  - **Parameters:**
    - `id` (number): The ID of the chat.
    - `lastMessage` (optional, number): The ID of the last message (if available).

### Methods

- `sendMessage(message: string): Promise<void>`
  - Send a text message to the chat.
  - **Parameters:**
    - `message` (string): The message text to send.

- `sendFile(fileid: string): Promise<void>`
  - Send a file to the chat.
  - **Parameters:**
    - `fileid` (string): The ID of the file to send.

- `remove(): Promise<void>`
  - Delete a chat instance. This method can be used to exit a chat.

### Event Handling

- `on(event: 'message', listener: (message: object) => void): void`
  - Register an event listener for incoming messages.
  - **Parameters:**
    - `event` (string): The event type (`'message'`).
    - `listener` (function): The callback function to handle incoming messages. The function receives a `message` object as an argument.

- `off(event: 'message', listener: (message: object) => void): void`
  - Unregister an event listener for incoming messages.
  - **Parameters:**
    - `event` (string): The event type (`'message'`).
    - `listener` (function): The callback function to remove.

## Author
This project was created by Aleksandr Iurov for https://buynstars.com.
