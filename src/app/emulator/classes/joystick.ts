import {State} from '../interfaces/state';
import {Log} from '../../classes/log';

export class Joystick implements State {

    private static gamepadIndices: object;
    private static threshold = 0.25;

    private column: boolean[];
    private number: number;
    private index: number;
    private interval: number;
    private log: Log;

    constructor(column, number) {
        this.column = column;
        this.number = number;
        this.index = null;
        this.log = Log.getLog();
        window.addEventListener("gamepadconnected", this.gamepadConnected.bind(this));
        window.addEventListener("gamepaddisconnected", this.gamepadDisconnected.bind(this));
        this.start();
    }

    start() {
        this.interval = window.setInterval(this.update.bind(this), 17);
    }

    stop() {
        if (this.interval) {
            window.clearInterval(this.interval);
        }
    }

    private registerGamepad(number: number, index: number) {
        if (!Joystick.gamepadIndices) {
            Joystick.gamepadIndices = {
                0: null,
                1: null
            };
        }
        if (Joystick.gamepadIndices[0] !== index && Joystick.gamepadIndices[1] !== index) {
            Joystick.gamepadIndices[number] = index;
            return true;
        } else {
            return false;
        }
    }

    private gamepadConnected(e: GamepadEvent) {
        console.log("gamepadConnected");
        if (this.index === null || !navigator.getGamepads()[this.index]) {
            const gamepad = e.gamepad;
            if (gamepad.id.toLowerCase().indexOf("unknown") === -1) {
                if (this.registerGamepad(this.number, gamepad.index)) {
                    this.index = gamepad.index;
                    this.log.info("Joystick " + this.number + " connected to gamepad " + this.index);
                }
            }
        }
    }

    private gamepadDisconnected(e: GamepadEvent) {
        const gamepad = e.gamepad;
        if (gamepad.index === this.index) {
            this.log.info("Joystick " + this.number + " disconnected from gamepad " + this.index);
            Joystick.gamepadIndices[this.number] = null;
            this.index = null;
        }
    }

    private update() {
        if (this.index !== null) {
            const gamepad = navigator.getGamepads()[this.index];
            if (gamepad && gamepad.connected) {
                this.column[3] = gamepad.buttons[0].pressed;
                const axis0 = gamepad.axes[0];
                const threshold = Joystick.threshold;
                this.column[4] = axis0 < -threshold || gamepad.buttons[14] && gamepad.buttons[14].pressed; // Left
                this.column[5] = axis0 > threshold  || gamepad.buttons[15] && gamepad.buttons[15].pressed; // Right
                const axis1 = gamepad.axes[1];
                this.column[6] = axis1 > threshold  || gamepad.buttons[13] && gamepad.buttons[13].pressed; // Down
                this.column[7] = axis1 < -threshold || gamepad.buttons[12] && gamepad.buttons[12].pressed; // Up
            }
        }
    }

    getState() {
        return {
            column: this.column
        };
    }

    restoreState(state) {
        this.column = state.column;
    }
}
