export class AMS {
    constructor(size: number) {

    }

    reset() {

    }

    setByte(a: number, byteArrayElement: number) {

    }

    readWord(addr: number): number {
        return 0;
    }

    writeWord(addr: any, w: any) {

    }

    hasRegisterAccess(): boolean {
        return false;
    }

    readRegister(number: number): number {
        return 0;
    }

    writeRegister(number: number, number2: number) {

    }

    getByte(addr: number): number {
        return 0;
    }

    getStatusString(): string {
        return '';
    }

    restoreState(ams: AMS | any) {

    }

    getState() {
        return undefined;
    }
}
