export interface CPU {
    reset();
    getState(): object;
    restoreState(state: object);

    addCycles(cycles: number): void;
}
