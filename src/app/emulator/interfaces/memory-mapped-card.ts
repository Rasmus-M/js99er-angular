import {PeripheralCard} from "./peripheral-card";
import {CPU} from "./cpu";

export interface MemoryMappedCard extends PeripheralCard {
    readMemoryMapped(addr: number, cpu: CPU): number;
    writeMemoryMapped(addr: number, word: number, cpu: CPU): void;
    getByte(addr: number): number;
}

