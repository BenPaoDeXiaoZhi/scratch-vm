const e=require("./uid-DbKYhYVR.cjs");var t,n=e.i((()=>{t=`﻿import context from './tw-extension-worker-context';
import jQuery from './tw-jquery-shim';
import './extension-worker';

declare global {
    interface Window {
        __WRAPPED_IFRAME_ID__: string;
    }
}

global.$ = jQuery;
global.jQuery = jQuery;

const id = window.__WRAPPED_IFRAME_ID__;

context.isWorker = false;
context.centralDispatchService = {
    postMessage (message: any, transfer?: any[]) {
        const data = {
            vmIframeId: id,
            message
        };
        if (transfer) {
            window.parent.postMessage(data, { include: '*' } as any, transfer);
        } else {
            window.parent.postMessage(data, '*');
        }
    }
};

window.parent.postMessage({
    vmIframeId: id,
    ready: true
}, '*');\r
`})),r,i,a,o;e.i((()=>{e.t(),n(),r=`'none'`,i={accelerometer:r,"ambient-light-sensor":r,battery:r,camera:r,"display-capture":r,"document-domain":r,"encrypted-media":r,fullscreen:r,geolocation:r,gyroscope:r,magnetometer:r,microphone:r,midi:r,payment:r,"picture-in-picture":r,"publickey-credentials-get":r,"speaker-selection":r,usb:r,vibrate:r,vr:r,"screen-wake-lock":r,"web-share":r,"interest-cohort":r},a=()=>Object.entries(i).map(([e,t])=>`${e} ${t}`).join(`; `),o=class{constructor(){this.id=e.n(),this.isRemote=!0,this.ready=!1,this.queuedMessages=[],this.onmessage=()=>{},this.iframe=document.createElement(`iframe`),this.iframe.className=`tw-custom-extension-frame`,this.iframe.dataset.id=this.id,this.iframe.style.display=`none`,this.iframe.setAttribute(`aria-hidden`,`true`),this.iframe.sandbox=`allow-scripts`,this.iframe.allow=a(),document.body.appendChild(this.iframe),window.addEventListener(`message`,this._onWindowMessage.bind(this));let n=new Blob([`<!DOCTYPE html><body><script>window.__WRAPPED_IFRAME_ID__=${JSON.stringify(this.id)};${t}<\/script></body>`],{type:`text/html; charset=utf-8`});this.iframe.src=URL.createObjectURL(n)}_onWindowMessage(e){if(!(!e.data||e.data.vmIframeId!==this.id)){if(e.data.ready){this.ready=!0;for(let{data:e,transfer:t}of this.queuedMessages)this.postMessage(e,t);this.queuedMessages.length=0}e.data.message&&this.onmessage({data:e.data.message})}}postMessage(e,t){this.ready&&this.iframe.contentWindow?t?this.iframe.contentWindow.postMessage(e,`*`,t):this.iframe.contentWindow.postMessage(e,`*`):this.queuedMessages.push({data:e,transfer:t})}}}))(),exports.default=o;
//# sourceMappingURL=tw-iframe-extension-worker-0o9KvzBu.cjs.map