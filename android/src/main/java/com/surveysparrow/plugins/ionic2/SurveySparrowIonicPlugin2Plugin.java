package com.surveysparrow.plugins.ionic2;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SurveySparrowIonicPlugin2")
public class SurveySparrowIonicPlugin2Plugin extends Plugin {

    private SurveySparrowIonicPlugin2 implementation = new SurveySparrowIonicPlugin2();

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", implementation.echo(value));
        call.resolve(ret);
    }
}
