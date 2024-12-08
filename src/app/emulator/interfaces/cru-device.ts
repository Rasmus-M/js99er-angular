export interface CRUDevice {
    getId(): string;
    getCruAddress(): number;
    readCruBit(bit: number): boolean;
    writeCruBit(bit: number, value: boolean): void;
}
