import {CruDevice} from "./cru-device";

export interface PeripheralCard extends CruDevice {
    isEnabled(): boolean;
}
