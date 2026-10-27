// Loads the survey page from its own domain in a separate-origin iframe (as in 2.0.3), so the
// page can never reach the host app. The SDK and the page talk only through postMessage.

export interface SurveyPageCallbacks {
  onMessage: (data: string) => void;
  onError: (error: { nativeEvent: { url: string; description: string }; message: string }) => void;
}

// Runs a backend injection with a stand-in window and keeps only the messages it dispatches.
// Scripts that touch the page DOM (CSS, re-measure) cannot cross origins and are dropped, as in 2.0.3.
const messagesFromScript = (script: string): any[] => {
  const messages: any[] = [];
  const pageWindow = {
    dispatchEvent: (event: any) => {
      if (event?.data != null) messages.push(event.data);
      return true;
    },
  };
  class PageMessageEvent {
    data: any;
    constructor(public type: string, init?: { data?: any }) {
      this.data = init?.data;
    }
  }
  try {
    // The host globals are shadowed so a DOM script fails here instead of touching the app.
    new Function('window', 'MessageEvent', 'document', 'self', 'globalThis', 'parent', 'top', script)(
      pageWindow, PageMessageEvent, undefined, pageWindow, pageWindow, pageWindow, pageWindow,
    );
  } catch {
    // DOM-only script: nothing to send.
  }
  return messages;
};

// Same list as the survey page (rtls).
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ps', 'ur'];

// The web page sends its fields at the top level; the backend reads the RN/Expo shape { type, data }.
const toBackendMessage = (message: any): any | null => {
  if (!message || typeof message !== 'object' || typeof message.type !== 'string') return null;
  if (message.type === 'resizeWindow') {
    const height = message.size?.height;
    return typeof height === 'number' ? { type: 'spotCheckData', data: { currentQuestionSize: { height } } } : null;
  }
  if ('data' in message) return message;
  const { type, ...data } = message;
  // The web languageChanged has only the code; add isRtl from the page's own RTL list.
  if (type === 'languageChanged' && typeof data.code === 'string') {
    data.isRtl = RTL_LANGUAGES.includes(data.code.split(/[-_]/)[0].toLowerCase());
  }
  return { type, data };
};

export class SurveyPage {
  readonly iframe: HTMLIFrameElement;
  private uri = '';
  private origin = '';
  private loadSeq = 0;
  private readonly onWindowMessage = (event: MessageEvent) => {
    // Only the survey page in this iframe, from the survey domain.
    if (event.source !== this.iframe.contentWindow || event.origin !== this.origin) return;
    const message = toBackendMessage(event.data);
    if (message) this.callbacks.onMessage(JSON.stringify(message));
  };

  constructor(host: HTMLElement, private callbacks: SurveyPageCallbacks) {
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('title', 'Survey');
    this.iframe.setAttribute(
      'allow',
      'camera; microphone; geolocation; display-capture; autoplay; clipboard-read; clipboard-write; fullscreen',
    );
    this.iframe.setAttribute('allowfullscreen', '');
    this.iframe.style.cssText = 'display:block;width:100%;height:100%;border:0;background:transparent;';
    host.appendChild(this.iframe);
    window.addEventListener('message', this.onWindowMessage);
  }

  load(uri: string): void {
    if (!uri || uri === this.uri) return;
    this.uri = uri;
    this.origin = new URL(uri).origin;
    const seq = ++this.loadSeq;
    // A cross-origin iframe hides HTTP errors, so check the page first to report a failed load.
    fetch(uri, { credentials: 'omit' })
      .then((response) => {
        if (!response.ok) throw new Error(`Survey page failed with status ${response.status}`);
        if (seq === this.loadSeq) this.iframe.src = uri;
      })
      .catch((error: any) => {
        if (seq !== this.loadSeq) return;
        // A later load() with the same uri retries.
        this.uri = '';
        const description = error?.message || String(error);
        // message: readable text for the Sentry report (the RN event shape has none).
        this.callbacks.onError({ nativeEvent: { url: uri, description }, message: description });
      });
  }

  // Same contract as the RN WebView ref the backend functions call; messages go by postMessage.
  injectJavaScript = (script: string): boolean => {
    const win = this.iframe.contentWindow;
    if (!win || !this.origin) return false;
    const messages = messagesFromScript(script);
    messages.forEach((data) => {
      win.postMessage(data, this.origin);
      // 2.0.3 sent the theme right after the survey state; the web page needs it to apply survey colours.
      const themeInfo = data?.type === 'RESET_STATE' ? data.state?.config?.generatedCSS : null;
      if (themeInfo) win.postMessage({ type: 'THEME_UPDATE_SPOTCHECK', themeInfo }, this.origin);
    });
    return messages.length > 0;
  };

  destroy(): void {
    this.loadSeq++;
    window.removeEventListener('message', this.onWindowMessage);
    this.iframe.remove();
  }
}
