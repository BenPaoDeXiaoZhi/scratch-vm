class AsyncLimiter {
    callback: Function;
    maxConcurrent: number;
    _current: number;
    _queue: any[];

    constructor (callback: Function, maxConcurrent: number) {
        this.callback = callback;
        this.maxConcurrent = maxConcurrent;
        this._current = 0;
        this._queue = [];
    }

    do (...args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this._queue.push([resolve, reject, args]);
            this._startNext();
        });
    }

    _startNext (): void {
        if (this._current >= this.maxConcurrent || this._queue.length === 0) {
            return;
        }
        this._current++;
        const [resolve, reject, args] = this._queue.shift();
        this.callback.apply(null, args)
            .then(result => {
                resolve(result);
                this._current--;
                this._startNext();
            })
            .catch(error => {
                reject(error);
                this._current--;
                this._startNext();
            });
    }
}

export default AsyncLimiter;