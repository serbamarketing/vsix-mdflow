interface VsCodeApi {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

declare function acquireVsCodeApi(): VsCodeApi;

class VSCodeApiWrapper {
  private readonly api: VsCodeApi | undefined;

  constructor() {
    if (typeof acquireVsCodeApi === 'function') {
      this.api = acquireVsCodeApi();
    }
  }

  postMessage(message: unknown) {
    if (this.api) {
      this.api.postMessage(message);
    }
  }
}

export const vscode = new VSCodeApiWrapper();
