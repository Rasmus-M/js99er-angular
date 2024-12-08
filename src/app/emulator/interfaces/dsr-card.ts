import {PeripheralCard} from "./peripheral-card";

export interface DSRCard extends PeripheralCard {
    getROM(): number[];
    getROMBank(): number;
}
