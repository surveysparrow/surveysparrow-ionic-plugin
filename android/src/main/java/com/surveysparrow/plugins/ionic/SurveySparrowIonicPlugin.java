package com.surveysparrow.plugins.ionic;

import android.util.Log;

public class SurveySparrowIonicPlugin {

    public String echo(String value) {
        Log.i("Echo", value);
        return value;
    }
}
