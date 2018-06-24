export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
    NONE = 4
}

export class Log {

    private static instance: Log;

    private minLevel = LogLevel.INFO;
    private element: HTMLElement;
    private buffer = '';
    private bufferCount = 0;
    private bufferSize = 20;
    private msgMap = {};

    static getLog(): Log {
        if (!this.instance) {
            this.instance = new Log();
        }
        return this.instance;
    }

    constructor() {
    }

    init(element: HTMLElement) {
        this.element = element;
        const that = this;
        setInterval(function () {
            that.flushBuffer();
        }, 1000);
    }

    print(obj) {
        if (obj != null) {
            this.buffer += obj + '\n';
            this.bufferCount++;
        }
        if (this.bufferCount >= this.bufferSize && this.buffer.length > 0) {
            if (this.element) {
                this.element.appendChild(document.createTextNode(this.buffer));
                this.element.scrollTop = this.element.scrollHeight;
            } else {
                console.log(this.buffer);
            }
            this.buffer = '';
            this.bufferCount = 0;
        }
    }

    flushBuffer() {
        this.bufferCount = this.bufferSize;
        this.print(null);
    }

    /**
     * Set minimum log level.
     * @param level Log level to set
     */
    setMinLevel(level: LogLevel) {
        this.minLevel = level;
    }

    /**
     * Log error message.
     * @param message error message
     */
    error(message: string) {
        if (LogLevel.ERROR >= this.minLevel) {
            alert(message);
        }
    }

    /**
     * Log warning message.
     * @param message warning message
     */
    warn(message) {
        if (LogLevel.WARNING >= this.minLevel) {
            this.print('*** Warning *** ' + message);
        }
    }

    /**
     * Log information message.
     * @param message information message
     */
    info(message) {
        if (LogLevel.INFO >= this.minLevel) {
            let count = this.msgMap[message];
            if (count == null) {
                count = 1;
            } else {
                count++;
            }
            this.msgMap[message] = count;
            if (count < 64) {
                this.print(message);
            } else if (count === 64 || (count & 1023) === 0) {
                this.print(message + ' (suppressing most messages)');
            }
        }
    }

    /**
     * Log debug message.
     * @param message fatal message
     */
    debug(message) {
        if (LogLevel.DEBUG >= this.minLevel) {
            this.print('Debug: ' + message);
        }
    }
}
