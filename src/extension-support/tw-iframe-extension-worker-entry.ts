import context from './tw-extension-worker-context';
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
} as any;

window.parent.postMessage({
    vmIframeId: id,
    ready: true
}, '*');
