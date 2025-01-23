import { SurveySparrowIonicPlugin } from 'surveysparrow-ionic-plugin';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    SurveySparrowIonicPlugin.echo({ value: inputValue })
}
