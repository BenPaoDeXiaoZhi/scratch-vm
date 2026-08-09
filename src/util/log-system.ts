import log from './log';
import EventEmitter from 'events';

/* eslint-disable no-console */

class LogSystem extends EventEmitter {
    /**
     * Set font color
     */
    setColor (...args: any[]): void {}

    /**
     * Display UI interface
     */
    show (...args: any[]): void {}

    /**
     * Hide UI interface
     */
    hide (...args: any[]): void {}

    /**
     * Outputs a message to the web console.
     */
    log (...args: any[]): void {
        log.log(...args);
    }

    /**
     * Outputs a warning message to the Web console.
     */
    warn (...args: any[]): void {
        log.warn(...args);
    }

    /**
     * Outputs an informational message to the Web console.
     */
    info (...args: any[]): void {
        log.info(...args);
    }

    /**
     * Outputs an error message to the Web console.
     */
    error (...args: any[]): void {
        log.error(...args);
    }

    /**
     * The method clears the console if the console allows it.
     */
    clear (): void {
        console.clear();
    }

    /**
     * Event name for new log.
     * @const {string}
     */
    static get NEW_LOG_MESSAGE (): string {
        return 'NEW_LOG_MESSAGE';
    }
}

export default LogSystem;