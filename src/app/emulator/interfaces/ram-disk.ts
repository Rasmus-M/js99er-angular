import {DSRCard} from "./dsr-card";
import {Stateful} from "./stateful";

export interface RAMDisk extends DSRCard, Stateful {
    reset(): void;
    setDSR(dsr: number[]): void;
    getRAM(): Uint8Array;
    setRAM(ram: Uint8Array): void;
}
