import {PeripheralCard} from "./peripheral-card";

export interface DsrCard extends PeripheralCard {
    getROM(): number[];
    getROMBank(): number;
}
