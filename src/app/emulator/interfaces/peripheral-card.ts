import {CRUDevice} from "./cru-device";

export interface PeripheralCard extends CRUDevice {
    isEnabled(): boolean;
}
