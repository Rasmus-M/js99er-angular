export interface Stateful {
    getState(): any;
    restoreState(state: any);
}
