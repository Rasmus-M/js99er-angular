import {Stateful} from "../interfaces/stateful";

export class GROMArray implements Stateful {

    private data: Uint8Array;
    private address: number;
    private prefetch: number;
    private access: number;

    constructor() {
        this.data = new Uint8Array(0x10000);
        this.address = 0;
        this.prefetch = 0;
        this.access = 0;
    }

    public setData(data: Uint8Array, offset: number) {
        for (let i = 0; i < data.length; i++) {
            this.data[i + offset] = data[i];
        }
    }

    public readData(): number {
        this.access = 2;
        const w = this.prefetch << 8;
        this.prefetchAndIncrementAddress();
        return w;
    }

    public readAddress(): number {
        this.access = 2;
        const wa = this.address & 0xff00;
        this.address = ((this.address << 8) | this.address & 0xff) & 0xffff;
        return wa;
    }

    public writeData(w: number): void {
        this.access = 2;
        this.data[this.address - 1] = w >> 8;
        this.prefetchAndIncrementAddress();
    }

    public writeAddress(w: number): void {
        this.address = ((this.address << 8) | w >> 8) & 0xffff;
        this.access--;
        if (this.access === 0) {
            this.access = 2;
            this.prefetchAndIncrementAddress();
        }
    }

    public prefetchAndIncrementAddress() {
        this.prefetch = this.data[this.address];
        const bankAddress = this.address & 0xe000;
        this.address = ((++this.address) & 0x1fff) | bankAddress;
    }

    public getByte(addr: number) {
        return this.data[addr];
    }

    public setByte(addr: number, value: number) {
        this.data[addr] = value;
    }

    public getAddress() {
        return this.address;
    }

    getState(): any {
        return {
            data: this.data,
            address: this.address,
            prefetch: this.prefetch,
            access: this.access
        };
    }

    restoreState(state: any): void {
        this.data.set(state.data);
        this.address = state.address;
        this.prefetch = state.prefetch;
        this.access = state.access;
    }
}
