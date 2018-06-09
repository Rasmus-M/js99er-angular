export interface State {
    getState(): object;
    restoreState(state: any);
}
