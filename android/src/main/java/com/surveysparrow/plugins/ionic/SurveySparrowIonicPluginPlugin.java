package com.surveysparrow.plugins.ionic;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.surveysparrow.ss_android_sdk.SsSurvey.CustomParam;

import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;

@CapacitorPlugin(name = "SurveySparrowIonicPlugin")
public class SurveySparrowIonicPluginPlugin extends Plugin {

    private final SurveySparrowIonicPlugin implementation = new SurveySparrowIonicPlugin();

    @PluginMethod
    public void loadFullScreenSurvey(PluginCall call) {
        String domain = call.getString("domain");
        String token = call.getString("token");
        CustomParam[] params = parseParams(call.getObject("params"));
        HashMap<String, String> properties = parseProperties(call.getObject("properties"));

        implementation.loadFullScreenSurvey(domain, token, params, properties, this.getActivity());
        call.resolve();
    }

    @PluginMethod
    public void loadFullScreenSurveyWithValidation(PluginCall call) {
        String domain = call.getString("domain");
        String token = call.getString("token");
        CustomParam[] params = parseParams(call.getObject("params"));
        HashMap<String, String> properties = parseProperties(call.getObject("properties"));

        implementation.loadFullScreenSurveyWithValidation(domain, token, params, properties, this.getActivity());
        call.resolve();
    }

    private CustomParam[] parseParams(JSObject jsParams) {
        if (jsParams == null) {
            return new CustomParam[0];
        }
    
        Iterator<String> keysIterator = jsParams.keys();
        List<CustomParam> paramsList = new ArrayList<>();
    
        while (keysIterator.hasNext()) {
            String key = keysIterator.next();
            String value = jsParams.getString(key);
            paramsList.add(new CustomParam(key, value));
        }

        return paramsList.toArray(new CustomParam[0]);
    }

    private HashMap<String, String> parseProperties(JSObject jsProperties) {
        HashMap<String, String> properties = new HashMap<>();
        if (jsProperties != null) {
            for (Iterator<String> it = jsProperties.keys(); it.hasNext(); ) {
                String key = it.next();
                properties.put(key, jsProperties.getString(key));
            }
        }
        if (!properties.containsKey("langCode")) {
            properties.put("langCode", "en");
        }
        return properties;
    }
}

