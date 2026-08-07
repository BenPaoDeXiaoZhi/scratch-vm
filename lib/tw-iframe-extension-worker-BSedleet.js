import { i as e, n as t, t as n } from "./uid-CSctzU29.js";
//#region src/extension-support/tw-iframe-extension-worker-entry.ts?raw
var r, i = e((() => {
	r = "﻿import context from './tw-extension-worker-context';\nimport jQuery from './tw-jquery-shim';\nimport './extension-worker';\n\ndeclare global {\n    interface Window {\n        __WRAPPED_IFRAME_ID__: string;\n    }\n}\n\nglobal.$ = jQuery;\nglobal.jQuery = jQuery;\n\nconst id = window.__WRAPPED_IFRAME_ID__;\n\ncontext.isWorker = false;\ncontext.centralDispatchService = {\n    postMessage (message: any, transfer?: any[]) {\n        const data = {\n            vmIframeId: id,\n            message\n        };\n        if (transfer) {\n            window.parent.postMessage(data, { include: '*' } as any, transfer);\n        } else {\n            window.parent.postMessage(data, '*');\n        }\n    }\n};\n\nwindow.parent.postMessage({\n    vmIframeId: id,\n    ready: true\n}, '*');\r\n";
})), a, o, s, c;
//#endregion
e((() => {
	n(), i(), a = "'none'", o = {
		accelerometer: a,
		"ambient-light-sensor": a,
		battery: a,
		camera: a,
		"display-capture": a,
		"document-domain": a,
		"encrypted-media": a,
		fullscreen: a,
		geolocation: a,
		gyroscope: a,
		magnetometer: a,
		microphone: a,
		midi: a,
		payment: a,
		"picture-in-picture": a,
		"publickey-credentials-get": a,
		"speaker-selection": a,
		usb: a,
		vibrate: a,
		vr: a,
		"screen-wake-lock": a,
		"web-share": a,
		"interest-cohort": a
	}, s = () => Object.entries(o).map(([e, t]) => `${e} ${t}`).join("; "), c = class {
		constructor() {
			this.id = t(), this.isRemote = !0, this.ready = !1, this.queuedMessages = [], this.onmessage = () => {}, this.iframe = document.createElement("iframe"), this.iframe.className = "tw-custom-extension-frame", this.iframe.dataset.id = this.id, this.iframe.style.display = "none", this.iframe.setAttribute("aria-hidden", "true"), this.iframe.sandbox = "allow-scripts", this.iframe.allow = s(), document.body.appendChild(this.iframe), window.addEventListener("message", this._onWindowMessage.bind(this));
			let e = new Blob([`<!DOCTYPE html><body><script>window.__WRAPPED_IFRAME_ID__=${JSON.stringify(this.id)};${r}<\/script></body>`], { type: "text/html; charset=utf-8" });
			this.iframe.src = URL.createObjectURL(e);
		}
		_onWindowMessage(e) {
			if (!(!e.data || e.data.vmIframeId !== this.id)) {
				if (e.data.ready) {
					this.ready = !0;
					for (let { data: e, transfer: t } of this.queuedMessages) this.postMessage(e, t);
					this.queuedMessages.length = 0;
				}
				e.data.message && this.onmessage({ data: e.data.message });
			}
		}
		postMessage(e, t) {
			this.ready && this.iframe.contentWindow ? t ? this.iframe.contentWindow.postMessage(e, "*", t) : this.iframe.contentWindow.postMessage(e, "*") : this.queuedMessages.push({
				data: e,
				transfer: t
			});
		}
	};
}))();
export { c as default };

//# sourceMappingURL=tw-iframe-extension-worker-BSedleet.js.map