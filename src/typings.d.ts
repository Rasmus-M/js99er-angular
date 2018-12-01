/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
}
