class Joystick {
    /**
     * Reference to the owning Runtime.
     * @type{!Runtime}
     */
    runtime: any;
    _cache: any;

    constructor (runtime: any) {
        /**
         * Reference to the owning Runtime.
         * @type{!Runtime}
         */
        this.runtime = runtime;

        this._cache = {};
    }

    /**
     * Joystick event handler.
     * @param  {object} data Data from custom joystick event.
     */
    postData (data: any): void {
        this._cache[data.id] = {direction: data.direction, distance: data.distance};

        this.runtime.startHatsWithParams('GandiJoystick_whenJoystickMoved', {
            parameters: this._cache[data.id],
            fields: {JOYSTICK: data.id}
        });
    }

    getJoystickData (dataId: any): any {
        return this._cache[dataId];
    }
}

export default Joystick;