class JSONRPC {
    _requestID: number;
    _openRequests: any;

    constructor () {
        this._requestID = 0;
        this._openRequests = {};
    }

    /**
     * Make an RPC request and retrieve the result.
     * @param {string} method - the remote method to call.
     * @param {object} params - the parameters to pass to the remote method.
     * @returns {Promise} - a promise for the result of the call.
     */
    sendRemoteRequest (method: string, params: any): Promise<any> {
        const requestID = this._requestID++;

        const promise = new Promise((resolve, reject) => {
            this._openRequests[requestID] = {resolve, reject};
        });

        this._sendRequest(method, params, requestID);

        return promise;
    }

    /**
     * Make an RPC notification with no expectation of a result or callback.
     * @param {string} method - the remote method to call.
     * @param {object} params - the parameters to pass to the remote method.
     */
    sendRemoteNotification (method: string, params: any): void {
        this._sendRequest(method, params);
    }

    /**
     * Handle an RPC request from remote, should return a result or Promise for result, if appropriate.
     * @param {string} method - the method requested by the remote caller.
     * @param {object} params - the parameters sent with the remote caller's request.
     */
    didReceiveCall (method: string, params: any): any {
        throw new Error('Must override didReceiveCall');
    }

    _sendMessage (jsonMessageObject: any): void {
        throw new Error('Must override _sendMessage');
    }

    _sendRequest (method: string, params: any, id?: number): void {
        const request: any = {
            jsonrpc: '2.0',
            method,
            params
        };

        if (id !== null && id !== undefined) {
            request.id = id;
        }

        this._sendMessage(request);
    }

    _handleMessage (json: any): void {
        if (json.jsonrpc !== '2.0') {
            throw new Error(`Bad or missing JSON-RPC version in message: ${json}`);
        }
        if (Object.prototype.hasOwnProperty.call(json, 'method')) {
            this._handleRequest(json);
        } else {
            this._handleResponse(json);
        }
    }

    _sendResponse (id: number, result: any, error?: any): void {
        const response: any = {
            jsonrpc: '2.0',
            id
        };
        if (error) {
            response.error = error;
        } else {
            response.result = result || null;
        }
        this._sendMessage(response);
    }

    _handleResponse (json: any): void {
        const {result, error, id} = json;
        const openRequest = this._openRequests[id];
        delete this._openRequests[id];
        if (openRequest) {
            if (error) {
                openRequest.reject(error);
            } else {
                openRequest.resolve(result);
            }
        }
    }

    _handleRequest (json: any): void {
        const {method, params, id} = json;
        const rawResult = this.didReceiveCall(method, params);
        if (id !== null && typeof id !== 'undefined') {
            Promise.resolve(rawResult).then(
                (result: any) => {
                    this._sendResponse(id, result);
                },
                (error: any) => {
                    this._sendResponse(id, null, error);
                }
            );
        }
    }
}

export default JSONRPC;
