import { SurveySparrowIonicPlugin2 } from 'surveysparrow-ionic-plugin-2';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    SurveySparrowIonicPlugin2.echo({ value: inputValue })
}
