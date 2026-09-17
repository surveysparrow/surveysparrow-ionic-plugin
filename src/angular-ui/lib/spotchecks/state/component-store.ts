const initialComponentState = {
  isLoaded: false,
  schemas: {
    wrapper: null as unknown,
    webviewComponent: null as unknown,
    closeButton: null as unknown,
    spotCheckButton: null as unknown,
  },
};

type ComponentStateInner = typeof initialComponentState;

let componentStateInner: ComponentStateInner = {
  ...initialComponentState,
};

const cListeners = new Set<() => void>();

export const componentStore = {
  getState(): { componentState: ComponentStateInner } {
    return { componentState: componentStateInner };
  },

  dispatch(payload: Partial<ComponentStateInner>) {
    if (payload.schemas) {
      componentStateInner = {
        ...componentStateInner,
        ...payload,
        schemas: {
          ...componentStateInner.schemas,
          ...payload.schemas,
        },
      };
    } else {
      componentStateInner = { ...componentStateInner, ...payload };
    }
    cListeners.forEach((l) => l());
  },

  subscribe(listener: () => void): () => void {
    cListeners.add(listener);
    return () => cListeners.delete(listener);
  },
};

