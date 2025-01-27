package com.surveysparrow.plugins.ionic;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.surveysparrow.ss_android_sdk.SsSurvey.CustomParam;
import org.json.JSONException;
import java.util.HashMap;
import java.util.Iterator;

@CapacitorPlugin(name = "SurveySparrowIonicPlugin")
public class SurveySparrowIonicPluginPlugin extends Plugin {

    private final SurveySparrowIonicPlugin implementation = new SurveySparrowIonicPlugin(this.getActivity());

    @PluginMethod
    public void loadFullScreenSurvey(PluginCall call) {
        String domain = call.getString("domain");
        String token = call.getString("token");
        CustomParam[] params = parseParams(call.getObject("params"));
        HashMap<String, String> properties = parseProperties(call.getObject("properties"));

        implementation.loadFullScreenSurvey(domain, token, params, properties);
        call.resolve();
    }

    @PluginMethod
    public void loadFullScreenSurveyWithValidation(PluginCall call) {
        String domain = call.getString("domain");
        String token = call.getString("token");
        CustomParam[] params = parseParams(call.getObject("params"));
        HashMap<String, String> properties = parseProperties(call.getObject("properties"));

        implementation.loadFullScreenSurveyWithValidation(domain, token, params, properties);
        call.resolve();
    }

    private CustomParam[] parseParams(JSObject jsParams) {
        if (jsParams == null || jsParams.keys().length == 0) {
            return new CustomParam[0];
        }
    
        String[] keys = jsParams.keys();
        CustomParam[] params = new CustomParam[keys.length];
    
        for (int i = 0; i < keys.length; i++) {
            try {
                String key = keys[i];
                String value = jsParams.getString(key);
                params[i] = new CustomParam(key, value);
            } catch (JSONException e) {
                throw new RuntimeException("Invalid parameter for key: " + keys[i], e);
            }
        }

        return params;
    }

    private HashMap<String, String> parseProperties(JSObject jsProperties) {
        HashMap<String, String> properties = new HashMap<>();
        if (jsProperties != null) {
            for (Iterator<String> it = jsProperties.keys(); it.hasNext(); ) {
                String key = it.next();
                properties.put(key, jsProperties.getString(key));
            }
        }
        return properties;
    }
}

