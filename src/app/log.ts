export enum Level {
    LEVEL_DEBUG = 0,
    LEVEL_INFO = 1,
    LEVEL_WARNING = 2,
    LEVEL_ERROR = 3,
    LEVEL_NONE = 4
}

export class Log {

    private static instance: Log;

    private minLevel = Level.LEVEL_INFO;
    private id;
    private buffer = '';
    private bufferCount = 0;
    private bufferSize = 20;
    private print;

    private msgMap = {};

    static getLog() {
        if (!this.instance) {
            this.instance = new Log('default');
        }
        return this.instance;
    }

    static setLog(newLog) {
        this.instance = newLog;
    }

    constructor(id) {
        this.id = id;
        this.init(id);
    }

    private init(id) {
        // Set default log scheme.
        this.print = function (object) { /* Do nothing. */
        };

        if (this.id === undefined) {
            // Try to use native console.
            if (console) {
                this.print = function (object) {
                    console.log(object);
                };
            }
        } else if (id != null) {
            const log = this;
            // Try to output under specified DOM object.
            const framePre = typeof(document) === 'object' ? document.getElementById(id) : null;
            if (framePre == null || framePre === undefined) {
                if (console) {
                    this.print = function (object) {
                        console.log(object);
                    };
                }
                return;
            } else {
                this.print = function (object) {
                    if (object != null) {
                        log.buffer += object + '\n';
                        log.bufferCount++;
                    }
                    if (log.bufferCount >= log.bufferSize && log.buffer.length > 0) {
                        const buffer = log.buffer;
                        window.setTimeout(
                            function () {
                                framePre.appendChild(document.createTextNode(buffer));
                                framePre.scrollTop = framePre.scrollHeight;
                            },
                            10
                        );
                        log.buffer = '';
                        log.bufferCount = 0;
                        this.framePre.appendChild(document.createTextNode(log.buffer));
                        this.framePre.scrollTop = this.framePre.scrollHeight;
                        // this.framePre.innerHTML = this.buffer;
                        log.buffer = '';
                        log.bufferCount = 0;
                    }
                };
                const that = this;
                setInterval(function () {
                    that.flushBuffer();
                }, 1000);
            }
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
    setMinLevel(level: Level) {
        this.minLevel = level;
    }

    /**
     * Log error message.
     * @param message error message
     */
    error(message: string) {
        if (Level.LEVEL_ERROR >= this.minLevel) {
            alert(message);
        }
    }

    /**
     * Log warning message.
     * @param message warning message
     */
    warn(message) {
        if (Level.LEVEL_WARNING >= this.minLevel) {
            this.print('*** Warning *** ' + message);
        }
    }

    /**
     * Log information message.
     * @param message information message
     */
    info(message) {
        if (Level.LEVEL_INFO >= this.minLevel) {
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
        if (Level.LEVEL_DEBUG >= this.minLevel) {
            this.print('Debug: ' + message);
        }
    }
}
