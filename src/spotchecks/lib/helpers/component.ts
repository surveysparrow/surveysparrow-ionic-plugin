import {
  OnInit,
  Component,
  Input,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { closeSpotCheck, closeSpotCheckAndHandleSurveyEnd, handleSurveyEnd } from '../services';
import { SpotcheckState } from './types';
import { getSpotcheckStateService } from '../services';
import { SpotcheckStateService } from '../services/SpotcheckStateService';

@Component({
  selector: 'WebViewComponent',
  template: `
    <div style="overflow: hidden; height: 100%;">
      <iframe
        #iframeRef
        [src]="safeUrl"
        style="width: 100%; height: 100%; display: block;"
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

  safeUrl: SafeResourceUrl | null = null;
  @ViewChild('iframeRef') iframe!: ElementRef<HTMLIFrameElement>;

  constructor(private sanitizer: DomSanitizer) {}
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
      const stateService = getSpotcheckStateService();
      if (this.webviewType === 'classic') {
        stateService.setState({ isClassicLoading: false });
      } else {
        stateService.setState({ isChatLoading: false });
      }
    });
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
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
        closeSpotCheckAndHandleSurveyEnd();
        // spotchecksListener.emitSurveyCompleted(data.response);
        break;

      case 'surveyLoadStarted':
        // spotchecksListener.emitSurveyLoadStarted(data.surveyDetails);
        break;

      default:
        break;
    }
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
  
  constructor() {
    this.stateService = getSpotcheckStateService();
    this.state = this.stateService.getState();
    this.updateComponentState();

    this.stateSubscription = this.stateService.state$.subscribe(
      (newState: SpotcheckState) => {
        this.state = newState;
        this.updateComponentState();
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
  }

  onClick = async () => {
    await closeSpotCheck();
    handleSurveyEnd();
  };
}