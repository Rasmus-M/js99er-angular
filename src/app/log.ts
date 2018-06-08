export class Log {

    private static instance: Log;

    static getLog() {
        if (!this.instance) {
            this.instance = new Log();
        }
        return this.instance;
    }

    constructor() {

    }
}
