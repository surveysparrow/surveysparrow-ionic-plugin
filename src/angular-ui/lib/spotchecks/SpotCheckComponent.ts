import {
  OnInit,
  Component,
  Input,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { closeSpotCheck, closeSpotCheckAndHandleSurveyEnd, getSpotcheckComponentCssStyles, handleSurveyEnd, ischatSurvey } from './helpers';
import { SpotcheckState } from './types';
import { getSpotcheckStateService } from './helpers';
import { SpotcheckStateService } from './SpotcheckStateService';
import { getSpotCheckEventListener } from './SpotCheckEventListener';
import axios from 'axios';

@Component({
  selector: 'WebViewComponent',
  template: `
    <div style="overflow: hidden; height: 100%; border-radius: {{isMiniCard ? 12 : 0}}px; padding-left: {{isMiniCard ? 12 : 0}}px; padding-right: {{isMiniCard ? 12 : 0}}px; box-sizing: border-box;">
      <iframe
        allow="camera; microphone; geolocation; display-capture; autoplay; clipboard-read; clipboard-write; fullscreen"
        allowfullscreen
        #iframeRef
        [src]="safeUrl"
        style="width: 100%; height: 100%; display: block; border-radius: {{isMiniCard ? 12 : 0}}px;"
        frameborder="0"
      >
      </iframe>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class WebViewComponent implements OnInit, AfterViewInit {
  @Input() url: string = '';
  @Input() webviewType: 'classic' | 'chat' = 'classic';
  @Input() isMiniCard: boolean = false;

  safeUrl: SafeResourceUrl | null = null;
  @ViewChild('iframeRef') iframe!: ElementRef<HTMLIFrameElement>;

  constructor(
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) { }
  ngOnInit() {
    if (this.url) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
    }
  }

  ngAfterViewInit() {
    const stateService = getSpotcheckStateService();
    const webViewRef = this.iframe.nativeElement;

    if (this.webviewType === 'classic') {
      stateService.setState({
        classicWebViewRef: webViewRef,
        isClassicLoading: false,
      });
    } else {
      stateService.setState({
        chatWebViewRef: webViewRef,
        isChatLoading: false,
      });
    }
    this.setupIframeLoadListener();
  }

  private setupIframeLoadListener() {
    const iframe = this.iframe.nativeElement;
    iframe.addEventListener('load', () => {
      this.ngZone.run(() => {
        this.injectNativeBridgeAdapters(iframe);
        const stateService = getSpotcheckStateService();
        if (this.webviewType === 'classic') {
          stateService.setState({ isClassicLoading: false });
        } else {
          stateService.setState({ isChatLoading: false });
        }
      });
    });
  }

  private injectNativeBridgeAdapters(iframe: HTMLIFrameElement) {
    if (iframe && iframe.contentWindow) {
      try {
        const iframeWindow = iframe.contentWindow as any;

        if (!iframeWindow.SsAndroidSdk) {
          iframeWindow.SsAndroidSdk = {
            shareData: function () { },
            sendPartialSubmissionData: function () { }
          };
        }

        if (!iframeWindow.Android) {
          iframeWindow.Android = {
            onMessageReceive: function () { }
          };
        }

        if (!iframeWindow.webkit) {
          iframeWindow.webkit = {
            messageHandlers: {
              surveyResponse: {
                postMessage: function () { }
              },
              spotCheckData: {
                postMessage: function () { }
              },
              flutterSpotCheckData: {
                postMessage: function () { }
              }
            }
          };
        }

        if (!iframeWindow.flutterSpotCheckData) {
          iframeWindow.flutterSpotCheckData = {
            postMessage: function () { }
          };
        }
      } catch (error) { }
    }
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    this.ngZone.run(() => {
      const stateService = getSpotcheckStateService();
      const { data } = event;
      switch (data.type) {
        case 'slideInFrame':
          if (data.mounted) {
            stateService.setState({ isMounted: true });
          }
          break;

        case 'resizeWindow':
          if (data.size) {
            stateService.setState({
              currentQuestionHeight: data.size.height,
            });
          } else if (data.isCloseButtonEnabled) {
            stateService.setState({
              isCloseButtonEnabled: data.isCloseButtonEnabled,
            });
          }
          break;

        case 'surveyCompleted':
          closeSpotCheckAndHandleSurveyEnd().then(() => {
            getSpotCheckEventListener().emit('surveyCompleted', data.response);
            this.cdr.detectChanges();
          });
          break;

        case 'surveyLoadStarted':
          getSpotCheckEventListener().emit('surveyLoadStarted', data.surveyDetails);
          break;


        case 'classicLoadEvent':
          stateService.setState({ isClassicLoadEventReceived: true });
          break;

        case 'chatLoadEvent':
          stateService.setState({ isChatLoadEventReceived: true });
          break;

        default:
          break;
      }
      this.cdr.detectChanges();
    });
  }
}

@Component({
  selector: 'close-svg',
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="https://www.w3.org/2000/svg"
    >
      <path
        d="M10.6665 10.667L21.3332 21.3337M21.3332 10.667L10.6665 21.3337"
        [attr.stroke]="stroke"
        [attr.stroke-width]="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class CloseSVGComponent {
  @Input() size: number = 32;
  @Input() stroke: string = '#919191';
  @Input() strokeWidth: number = 1.5;
}

@Component({
  selector: 'spotcheck-close-button',
  template: `
      <div style="position: absolute; top: -36px; right: 16px; z-index: 100001; cursor: pointer; background-color: white; border-radius: 50px;" (click)="onClick()" *ngIf="isVisible && isMiniCard">
        <close-svg [size]="size" [stroke]="stroke" [strokeWidth]="strokeWidth" style="display: flex; align-items: center; justify-content: center;"/>
      </div>
      <div style="position: absolute; top: 16px; right: 16px; z-index: 100001; cursor: pointer;" (click)="onClick()" *ngIf="isVisible && !isMiniCard">
        <close-svg [size]="size" [stroke]="stroke" [strokeWidth]="strokeWidth"/>
      </div>
  `,
  standalone: true,
  imports: [CommonModule, CloseSVGComponent],
})
export class CloseButtonComponent implements OnDestroy {
  @Input() size: number = 30;
  @Input() strokeWidth: number = 1.2;

  state: SpotcheckState;
  private stateService: SpotcheckStateService;
  private stateSubscription!: Subscription;

  isVisible: boolean = false;
  isMiniCard: boolean = false;
  stroke: string = 'black';
  private isClosing: boolean = false;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    this.stateService = getSpotcheckStateService();
    this.state = this.stateService.getState();
    this.updateComponentState();

    this.stateSubscription = this.stateService.state$.subscribe(
      (newState: SpotcheckState) => {
        this.ngZone.run(() => {
          this.state = newState;
          this.updateComponentState();
          this.cdr.detectChanges();
        });
      }
    );
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  private updateComponentState(): void {
    this.isVisible =
      this.state.isCloseButtonEnabled &&
      ((this.state.currentQuestionHeight > 0 && !this.state.isFullScreenMode) ||
        (this.state.isFullScreenMode &&
          ((!this.state.isClassicLoading &&
            this.state.spotCheckType === 'classic') ||
            (!this.state.isChatLoading &&
              this.state.spotCheckType === 'chat'))));
    this.isMiniCard = this.state.spotChecksMode === 'miniCard';
    this.stroke = this.isMiniCard ? 'black' : this.state.closeButtonStyle?.['ctaButton'] || 'black';
    if (this.isVisible) {
      this.isClosing = false;
    }
  }

  onClick = async () => {
    if (this.isClosing) {
      return;
    }
    this.isClosing = true;
    await closeSpotCheck();
    handleSurveyEnd();
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  };
}


@Component({
  selector: 'SpotCheckComponent',
  templateUrl: './SpotCheckComponent.html',
  styleUrls: ['./SpotCheckComponent.css'],
  standalone: true,
  imports: [CommonModule, WebViewComponent, CloseButtonComponent],
})
export class SpotCheckComponent implements OnInit, OnDestroy {
  state: SpotcheckState;
  private spotcheckStateService: SpotcheckStateService;
  private stateSubscription: Subscription;
  componentStyles: any = {};
  avatarUrl: string = '';

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    this.spotcheckStateService = getSpotcheckStateService();
    this.state = this.spotcheckStateService.getState();
    this.updateComponentStyles();

    this.stateSubscription = this.spotcheckStateService.state$.subscribe(
      (newState: SpotcheckState) => {
        this.ngZone.run(() => {
          this.state = newState;
          this.updateComponentStyles();
          this.avatarUrl = this.state.avatarUrl || "https://static.surveysparrow.com/application/images/profile.png";
          this.cdr.detectChanges();
        });
      }
    );
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  private updateComponentStyles(): void {
    this.componentStyles = getSpotcheckComponentCssStyles(this.state);
  }

  initializeComponent = async () => {
    try {
      const domainName = this.state.domainName;
      const targetToken = this.state.targetToken;

      const response = await axios.get<any>(
        `https://${domainName}/api/internal/spotcheck/widget/${targetToken}/init`
      );

      const data = response.data;

      if (data.filteredSpotChecks && data.filteredSpotChecks.length > 0) {
        let classicIframe = false;
        let chatIframe = false;

        data.filteredSpotChecks.forEach((spotcheck: any) => {
          if (
            spotcheck.appearance.mode === 'fullScreen' &&
            ischatSurvey(spotcheck?.survey?.surveyType)
          ) {
            chatIframe = true;
          } else {
            classicIframe = true;
          }
        });

        const newClassicUrl = classicIframe
          ? `https://${domainName}/eui-template/classic`
          : '';
        const newChatUrl = chatIframe
          ? `https://${domainName}/eui-template/chat`
          : '';

        this.spotcheckStateService.setState({
          filteredSpotChecks: data.filteredSpotChecks,
          classicUrl: newClassicUrl,
          chatUrl: newChatUrl,
        });
      }
    } catch (error) {
      console.log('Error initializing widget:', JSON.stringify(error));
    }
  };
}
