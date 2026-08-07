/**
 * Helper class for managing state and setState in JavaScript.
 */
class StateManager {
  state: any;

  /**
   * Initializes the StateManager with an optional initial state.
   * @param {Object} [initialState=null] - The optional initial state object.
   */
  constructor(initialState: any = null) {
    this.state = Object.create(initialState);
  }

  /**
   * Sets the value of a key in the state object.
   * If the key does not exist, it creates a new object for that key.
   * @param {string|Object} key - The key to set in the state object.
   * @param {any} value - The value to set for the given key.
   */
  set(key: any, value: any): void {
    const _key = typeof key === "string" ? key : JSON.stringify(key);

    if (!Object.prototype.hasOwnProperty.call(this.state, _key)) {
      this.state[_key] = {};
    }

    Object.assign(this.state[_key], value);
  }
}

export default StateManager;
