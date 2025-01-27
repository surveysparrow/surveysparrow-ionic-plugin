package com.surveysparrow.plugins.ionic;

import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;

import com.surveysparrow.ss_android_sdk.OnSsResponseEventListener;
import com.surveysparrow.ss_android_sdk.OnSsValidateSurveyEventListener;
import com.surveysparrow.ss_android_sdk.SsSurvey;
import com.surveysparrow.ss_android_sdk.SsSurvey.CustomParam;
import com.surveysparrow.ss_android_sdk.SurveySparrow;
import org.json.JSONObject;
import java.util.HashMap;

public class SurveySparrowIonicPlugin implements OnSsValidateSurveyEventListener, OnSsResponseEventListener {

    private static final int SURVEY_REQUEST_CODE = 1;
    private static final int SURVEY_SCHEDULE_REQUEST_CODE = 2;

    public void loadFullScreenSurvey(String domain, String token, HashMap properties, AppCompatActivity activity) {
        if(activity == null) {
            throw new RuntimeException("Activity is null. Error fetching activity.");
        }
        CustomParam[] params = new CustomParam[0];
        SsSurvey survey = new SsSurvey(domain, token, params, properties);
        SurveySparrow surveySparrow = new SurveySparrow(activity, survey)
                .enableBackButton(true)
                .setWaitTime(2000);

        surveySparrow.startSurveyForResult(SURVEY_REQUEST_CODE);
    }

    public void loadFullScreenSurveyWithValidation(String domain, String token, CustomParam[] params, HashMap properties, AppCompatActivity activity) {
        SsSurvey survey = new SsSurvey(domain, token, params, properties);
        SurveySparrow surveySparrow = new SurveySparrow(activity, survey)
                .enableBackButton(true)
                .setWaitTime(2000);

        surveySparrow.scheduleSurvey(SURVEY_SCHEDULE_REQUEST_CODE);
        surveySparrow.setValidateSurveyListener(this);
        surveySparrow.startSurvey(SURVEY_REQUEST_CODE);
    }

    @Override
    public void onSsValidateSurvey(JSONObject jsonObject) {
        Log.v("SurveySparrow", "Survey validation error json: " + jsonObject.toString());
    }

    @Override
    public void onSsResponseEvent(JSONObject jsonObject) {
        Log.v("SurveySparrow", "Survey response received: " + jsonObject.toString());
    }
}
