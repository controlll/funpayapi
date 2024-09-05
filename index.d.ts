declare module "funpay-js-api" {
    export const Api : {
      setConfig(key: string): Promise<void>;
      getUserLastMessage(id: number): Promise<string>;
      getOffers(id?: number): Promise<any>;
      getLots(node: string): Promise<any>;
      getOfferPage(node: string, offer: string): Promise<JQuery<HTMLElement>>;
      updateOfferPage(offerPage: JQuery<HTMLElement>): Promise<any>;
      updatePrice(node: string, offer: string, price: number): Promise<void>;
      getUserLangById(id: number): Promise<string>;
      getUserByDialogId(dialogId: string): Promise<{ userId: number; lang: string }>;
      getDialogs(): Promise<any[]>;
      getNewOrders(): Promise<any[]>;
      refund(order_id: number): Promise<any>;
      get(route?: string): Promise<string>;
      post(route: string, data: any): Promise<string>;
      svgtopng(base64Svg: string): Promise<Buffer>;
      uploadFileFromBuffer(imageBuffer: Buffer, contentType: string): Promise<any>;
      uploadFileFromUrl(src: string): Promise<any>;
    }
  
    export const Runner : {
      sendMessageToChat(id: number, message: string): Promise<boolean>;
      sendFileToChat(id: number, file: string): Promise<boolean>;
      addRequest(request: any): Promise<void>;
      parser(data: any): Promise<void>;
      ready(): Promise<void>;
      // Event handling
      on(event: 'orders_counters', listener: (data: object) => void): void;
      on(event: 'chat_counter', listener: (data: object) => void): void;
      off(event: 'orders_counters', listener: (data: object) => void): void;
      off(event: 'chat_counter', listener: (data: object) => void): void;
    }
  
    export class Chat {
      constructor(id: number, lastMessage?: number);
      loaded: boolean;
      id: number;
      lastMessage: number;
      handlerId?: string;
      init(): Promise<void>;
      sendMessage(message: string): Promise<void>;
      sendFile(fileid: string): Promise<void>;
      remove(): Promise<void>;
      ready(): Promise<void>;
      // Event handling
      on(event: 'message', listener: (message: object) => void): void;
      off(event: 'message', listener: (message: object) => void): void;
    }
  }