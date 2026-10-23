// Loads the survey template into a same-origin iframe so the page talks to the SDK the
// same way it talks to the React Native / Expo WebView (no survey page change needed).
let bridgeSeq = 0;

export interface SurveyPageCallbacks {
  onMessage: (data: string) => void;
  onError: (error: { nativeEvent: { url: string; description: string } }) => void;
  getPageScript: () => string;
}

const escapeScript = (js: string) => js.replace(/<\/script/gi, '<\\/script');

export class SurveyPage {
  readonly iframe: HTMLIFrameElement;
  private readonly bridgeName = `__ssSpotcheckBridge${++bridgeSeq}`;
  private uri = '';
  private loadSeq = 0;

  constructor(host: HTMLElement, private callbacks: SurveyPageCallbacks) {
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('title', 'Survey');
    this.iframe.setAttribute(
      'allow',
      'camera; microphone; geolocation; display-capture; autoplay; clipboard-read; clipboard-write; fullscreen',
    );
    this.iframe.style.cssText = 'display:block;width:100%;height:100%;border:0;background:transparent;';
    host.appendChild(this.iframe);
    (window as any)[this.bridgeName] = (data: string) => this.callbacks.onMessage(data);
  }

  load(uri: string): void {
    if (!uri || uri === this.uri) return;
    this.uri = uri;
    const seq = ++this.loadSeq;
    fetch(uri, { credentials: 'omit' })
      .then((response) => {
        if (!response.ok) throw new Error(`Survey page failed with status ${response.status}`);
        return response.text();
      })
      .then((html) => {
        if (seq !== this.loadSeq) return;
        this.write(uri, html);
      })
      .catch((error: any) => {
        if (seq !== this.loadSeq) return;
        // A later load() with the same uri retries.
        this.uri = '';
        this.callbacks.onError({ nativeEvent: { url: uri, description: error?.message || String(error) } });
      });
  }

  // Same contract as the RN WebView ref the backend functions call.
  injectJavaScript = (script: string): boolean => {
    const win: any = this.iframe.contentWindow;
    if (!win) return false;
    try {
      win.eval(script);
      return true;
    } catch (error) {
      console.error('[SpotCheck] page script failed', error);
      return false;
    }
  };

  destroy(): void {
    this.loadSeq++;
    delete (window as any)[this.bridgeName];
    this.iframe.remove();
  }

  private write(uri: string, html: string): void {
    const doc = this.iframe.contentDocument;
    if (!doc) return;
    const url = new URL(uri);
    const pagePath = JSON.stringify(url.pathname + url.search);
    // Relative URLs load from the survey domain; the page sees its own path (?isSpotCheck=true).
    // Mobile events go to ReactNativeWebView / flutterSpotCheckData, as in the RN and Expo SDKs.
    const head = `<base href="${url.origin}/"><script>(function(){
  var post = function (d) {
    try { window.parent[${JSON.stringify(this.bridgeName)}](typeof d === 'string' ? d : JSON.stringify(d)); } catch (e) {}
  };
  try {
    var p = window.parent.location;
    history.replaceState(history.state, '', p.protocol + '//' + p.host + ${pagePath});
  } catch (e) {}
  window.ReactNativeWebView = { postMessage: post };
  window.flutterSpotCheckData = { postMessage: post };
})();</script>`;
    const pageScript = this.callbacks.getPageScript();
    const tail = pageScript ? `<script>${escapeScript(pageScript)}</script>` : '';

    let page = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (tag) => tag + head) : head + html;
    page = /<\/body>/i.test(page) ? page.replace(/<\/body>(?![\s\S]*<\/body>)/i, () => `${tail}</body>`) : page + tail;

    doc.open();
    doc.write(page);
    doc.close();
  }
}
