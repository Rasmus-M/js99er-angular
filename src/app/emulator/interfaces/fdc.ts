import {DSRCard} from "./dsr-card";
import {Stateful} from "./stateful";

export interface FDC extends DSRCard, Stateful {
    reset(): void;
}
