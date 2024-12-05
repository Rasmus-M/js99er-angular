import {DsrCard} from "./dsr-card";
import {Stateful} from "./stateful";

export interface FDC extends DsrCard, Stateful {
    reset(): void;
}
