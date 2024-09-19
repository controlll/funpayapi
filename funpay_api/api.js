import fetch from 'node-fetch';
import FormData from 'form-data';
import { JSDOM } from 'jsdom';
import jQuery from 'jquery';
import runner from './runner.js';
import chat from './chat.js';
import Canvas from 'canvas';
import { getUsersId } from './utils.js';
class api {
    constructor(){
        this.loaded = false;
    }
    async setConfig(key){
        this.key = key;
        this.init();
    }
    async init(){
        await this.getData();
        console.log('api loaded', this.data);
        Runner.init();
        this.loaded = true;
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
    async getData(){
        let body = await this.get();
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        let data = JSON.parse($('body').attr('data-app-data'));
        this.data = data;
    }
    async getUserLastMessage(id){
        await this.ready();
        const node = getUsersId(this.data.userId, id);
        let body = await this.get(`chat/?node=${node}`);
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        return $('.chat-msg-item.chat-msg-with-head:last').attr('id').split('-')[1];
    }
    async getOffers(id = null){
        await this.ready();
        if(!id)
            id = this.data.userId;
        let body = await this.get(`users/${id}/`);
        let offers = [];
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        $('.mb20 .offer').each(function(index){
            let group_name = $('.offer-list-title h3 a', this).text()
            let node = $('.offer-list-title h3 a', this).attr('href').split('/').filter(part => part).pop();
            let offers_group = {group_name, node, offers:[]};
            $('.tc-item', this).each(function(index){
                let name = $('.tc-desc-text', this).text();
                let price = $('.tc-price', this).text().replace(/\n/g, '');
                let id = $(this).attr('href').match(/id=(\d+)/)[1];
                offers_group.offers.push({name, price, id});
            })
            offers[group_name] = offers_group;
        });
        for(let key of Object.keys(offers)){
            offers[key].lots = await this.getLots(offers[key].node);
        }
        return offers;
    }
    async getLots(node){
        let body = await this.get(`lots/${node}/`);
        let lots = {};
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        const self = this;
        $('.tc-item:not(.offer-promoted)').each(function(index){
            let user_id = $('.media-user-name .pseudo-a', this).attr('data-href').split('/').filter(part => part).pop();
            if(user_id == self.data.userId)//свой оффер пропускаем
                return;
            let name = $(this).attr('data-f-quantity');
            let price = $('.tc-price', this).attr('data-s');
            let online = $('.media.media-user', this).hasClass('online');
            let seller = $('.media-user-name .pseudo-a', this).text();
            let rating = $('.rating-stars .fas', this).length;
            if(!lots[name])
                lots[name] = [];
            lots[name].push({price, online, seller, rating, user_id});
        })
        return lots;
    }
    async getOfferPage(node, offer){
        let offerPage = await this.get(`lots/offerEdit?node=${node}&offer=${offer}`);
        const { window } = new JSDOM(offerPage);
        const $ = jQuery(window);
        return $;
    }
    async updateOfferPage(offerPage){
        const $ = offerPage;
        let form = $('.form-offer-editor');
        let formDataArray = form.serializeArray();
        let formDataJSON = {};
        $.each(formDataArray, function() {
            formDataJSON[this.name] = this.value;
        });
        return await this.post('lots/offerSave', formDataJSON);
    }
    async updatePrice(node, offer, price){
        let offerPage = await this.get(`lots/offerEdit?node=${node}&offer=${offer}`);
        const { window } = new JSDOM(offerPage);
        const $ = jQuery(window);
        price = Math.ceil(price * 1000) / 1000;
        console.log(price,' == ',$('.form-offer-editor [name=price]').val())
        if(price == $('.form-offer-editor [name=price]').val())
            return;
        if(!price)
            return;
        $('.form-offer-editor [name=price]').val(price);
        let form = $('.form-offer-editor');
        let formDataArray = form.serializeArray();
        let formDataJSON = {};
        $.each(formDataArray, function() {
            formDataJSON[this.name] = this.value;
        });
        await this.post('lots/offerSave', formDataJSON);
    }
    async getUserLangById(id){
        await this.ready();
        const node = getUsersId(this.data.userId, id);//`users-${this.data.userId}-${id}`;
        let body = await this.get(`chat/?node=${node}`);
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        let lang = 'Русский';
        $('.chat-detail-list.custom-scroll .param-item').each(function(index){
            const h5 = $('h5', this).text();
            if(h5 == 'Язык собеседника')
                lang = $('div', this).text();
        })
        if(lang != 'Русский' && lang != 'Английский')
            lang = 'Русский';
        return lang;
    }
    async getUserByDialogId(dialogId){
        await this.ready();
        let body = await this.get(`chat/?node=${dialogId}`);
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        const userId = $('.param-item.chat-panel').attr('data-id');
        let lang = 'Русский';
        $('.chat-detail-list.custom-scroll').each(function(index){
            if($('h5', this).text() == 'Язык собеседника')
                lang = $('div', this).text();
        })
        return {userId, lang};
    }
    async getDialogs(){
        await this.ready();
        let body = await this.get('chat/');
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        let dialogs = [];
        $('.contact-item').each(function(index){
            const dialogId = $(this).attr('data-id');
            const userName = $('.media-user-name', this).text();
            //console.log(userName);
            const last_message = $(this).attr('data-node-msg');
            const first_message = $(this).attr('data-user-msg');
            const unread = $(this).hasClass('unread');

            dialogs.push({dialogId, last_message, first_message, unread, userName});
        });
        return dialogs;
    }
    async getChatNodeByOrderId(order_id){
        await this.ready();
        let body = await this.get(`orders/${order_id}/`);
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        return $('.chat').attr('data-id');
    }
    async getLastOrders(){
        await this.ready();
        let body = await this.get('orders/trade');
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        let orders = [];
        $('.tc-item').each(function(index){
            const orderId = $('.tc-order', this).text().replace('#','');
            const url = $('.media-user-name .pseudo-a', this).attr('data-href');
            const userId = url.split('/').filter(part => part).pop();
            const date = $('.tc-date-time', this).text();
            const status = $('.tc-status', this).text();
            let _product = $('.order-desc div:first-child', this).text().split(', ');
            let amount = 1;
            let product = $('.order-desc div:first-child', this).text();
            if(_product.length > 1){
                if(_product.at(-1).split(' ').at(-1) == 'шт.'){
                    amount = Number(_product.at(-1).split(' ')[0]);
                    product = _product.splice(0, _product.length-1).join(',');
                }
            }
            
            orders.push({orderId, url, userId, date, status, product, amount});
        });
        return orders;
    }
    async getNewOrders(){
        await this.ready();
        let body = await this.get('orders/trade');
        const { window } = new JSDOM(body);
        const $ = jQuery(window);
        let orders = [];
        $('.tc-item.info').each(function(index){
            const orderId = $('.tc-order', this).text().replace('#','');
            const url = $('.media-user-name .pseudo-a', this).attr('data-href');
            const userId = url.split('/').filter(part => part).pop();
            const date = $('.tc-date-time', this).text();
            const status = $('.tc-status', this).text();
            let _product = $('.order-desc div:first-child', this).text().split(', ');
            let amount = 1;
            let product = $('.order-desc div:first-child', this).text();
            if(_product.length > 1){
                if(_product.at(-1).split(' ').at(-1) == 'шт.'){
                    amount = Number(_product.at(-1).split(' ')[0]);
                    product = _product.splice(0, _product.length-1).join(',');
                }
            }
            
            orders.push({orderId, url, userId, date, status, product, amount});
        });
        return orders;
    }
    async refund(order_id){
        return await this.post('orders/refund', {id:order_id});
    }
    async get(route = ''){
        const res = await fetch(`https://funpay.com/${route}`, {
            method: "POST",
            headers: {
                'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/112.0.0.0',
                'Cookie':`golden_key=${this.key};${this.PHPSESSID?` PHPSESSID=${this.PHPSESSID};`:''}`
            }
        })
        const cookies = res.headers.get('set-cookie')?.split(/,(?=\s*[^,]+=)/);
        if(cookies)
            for(let cookie of cookies){
                if(cookie.split(';')[0].split('=')[0] == 'PHPSESSID'){
                    this.PHPSESSID = cookie.split(';')[0].split('=')[1];
                }
            }
        const text = await res.text();
        return text;
    }
    async post(route, data){
        data.csrf_token = this.data['csrf-token'];
        const res = await fetch(`https://funpay.com/${route}`, {
            method: "POST",
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "ru,en;q=0.9,ru-RU;q=0.8,en-US;q=0.7",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Opera\";v=\"112\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/112.0.0.0',
                'Cookie':`golden_key=${this.key};${this.PHPSESSID?` PHPSESSID=${this.PHPSESSID};`:''}`
            },
            body: Object.keys(data)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
            .join('&')
        })
        const text = await res.text();
        return text;
    }
    async svgtopng(base64Svg){
        return new Promise((resolve, reject)=>{
            const canvas = Canvas.createCanvas(160, 160);
            const ctx = canvas.getContext('2d');
            const img = new Canvas.Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                const pngData = canvas.toBuffer('image/png');
                resolve(pngData);
            };
            img.onerror = (err) => {
                reject(err);
            };
            img.src = base64Svg;
        })
    };
    async uploadFileFromBuffer(imageBuffer, contentType){
        //const form = new FormData();
        //form.append('file', fs.createReadStream('path/to/your/file.jpg'));
        const form = new FormData();
        
        form.append('file', imageBuffer, {
            filename: 'image',
            contentType: contentType
        });
        const res = await fetch("https://funpay.com/file/addChatImage", {
            method: "POST",
            headers: {
                "accept-language": "ru,en;q=0.9,ru-RU;q=0.8,en-US;q=0.7",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Opera\";v=\"112\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/112.0.0.0',
                'Cookie':`golden_key=${this.key};${this.PHPSESSID?` PHPSESSID=${this.PHPSESSID};`:''}`,
                ...form.getHeaders()
            },
            body:form
        });
        const text = await res.json();
        return text;
    }
    async uploadFileFromUrl(src){
        //const form = new FormData();
        //form.append('file', fs.createReadStream('path/to/your/file.jpg'));
        const form = new FormData();
        let imageBuffer;
        let contentType;
        src = decodeURIComponent(src);
        if (src.startsWith('data:')) {
            const base64Data = src.split(',')[1]; // Убираем префикс "data:image/jpeg;base64,"
            contentType = src.substring(src.indexOf(':') + 1, src.indexOf(';'));
            if('image/svg+xml' === contentType){
                try{
                    contentType = "image/png";
                    imageBuffer = await this.svgtopng(src);
                }catch(e){
                    console.log(e);
                    return false;
                }
            }else{
                imageBuffer = Buffer.from(base64Data, 'base64');
            }
        } else if (src.startsWith('http')) {
            const imageResponse = await fetch(src);
            const arrayBuffer = await imageResponse.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
            contentType = imageResponse.headers.get('content-type');
        } else {
            throw new Error('Invalid image source');
        }
        
        return await this.uploadFileFromBuffer(imageBuffer, contentType);
    }
}
export const Api = new api();
export const Runner = new runner();
export const Chat = chat;