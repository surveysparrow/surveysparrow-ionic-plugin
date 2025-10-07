import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { CloseButtonComponent, WebViewComponent } from "../helpers/component";
import { SpotcheckState } from "../helpers/types";
import { SpotcheckStateService } from "../services/SpotcheckStateService";
import { Subscription } from "rxjs";
import { getSpotcheckStateService, getSpotcheckComponentCssStyles } from "../services";
import axios from "axios";
import { ischatSurvey } from "../services";

@Component({
  selector: 'spotcheck',
  templateUrl: './spotcheck.component.html',
  standalone: true,
  imports: [CommonModule, WebViewComponent, CloseButtonComponent],
})
export class SpotCheck implements OnInit, OnDestroy {
  state: SpotcheckState;
  private spotcheckStateService: SpotcheckStateService;
  private stateSubscription: Subscription;
  componentStyles: any = {};
  avatarUrl: string = '';

  constructor() {
    this.spotcheckStateService = getSpotcheckStateService();
    this.state = this.spotcheckStateService.getState();
    this.updateComponentStyles();

    this.stateSubscription = this.spotcheckStateService.state$.subscribe(
      (newState: SpotcheckState) => {
        this.state = newState;
        this.updateComponentStyles();
        this.avatarUrl = this.state.avatarUrl || "https://static.surveysparrow.com/application/images/profile.png";
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
      const response = await axios.get(
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
