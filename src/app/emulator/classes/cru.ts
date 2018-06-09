export class CRU {

  private vdpInterrupt: boolean;

  setVDPInterrupt(value: boolean) {
    this.vdpInterrupt = value;
  }

    writeBit(addr: number, value: boolean) {
    }

    readBit(addr: number): boolean {
        return false;
    }

    isVDPInterrupt(): boolean {
        return undefined;
    }

    isTimerInterrupt(): boolean {
        return undefined;
    }
}
