//renderer context
const electron = require('electron');
const {ipcRenderer} = require('electron');

const $ = require('jquery');

var PrefsObject={
    alertType: "alertTheatrical",
    alertCMail: true,
    alertBreakdowns: true,
    loginname:"",
    password:""
};

readPrefs();

ipcRenderer.on('readPrefs', (event,arg) =>{
    readPrefs();
});

$("[name='alertType']").click(function(){
    savePrefs();
});

$("[type='checkbox']").click(function(){
    if (($('#alertCMail').is(':checked') == false) && ($('#alertBreakdowns').is(':checked') == false)){
        $('#alertCMail').prop('checked',true);
    }

    savePrefs();
});

function savePrefs (){
//console.log('savePrefs');
    localStorage.setItem('alertCMail', $('#alertCMail').is(':checked'));
    localStorage.setItem('alertBreakdowns', $('#alertBreakdowns').is(':checked'));
    localStorage.setItem('alertType', $('input[name="alertType"]:checked').val());

    PrefsObject.alertType = $('input[name="alertType"]:checked').val();
    PrefsObject.alertCMail= $('#alertCMail').is(':checked');
    PrefsObject.alertBreakdowns= $('#alertBreakdowns').is(':checked');

    ipcRenderer.send('refreshPrefs', PrefsObject);
}

function readPrefs (){
//console.log(localStorage.getItem('alertCMail'));
    var foo="";
    if (localStorage.getItem('alertType')){
        foo = "input:radio[id=alert"+localStorage.getItem('alertType')+"]";
        $(foo).prop("checked",true);
    }
    $('#alertCMail').prop('checked',(localStorage.getItem('alertCMail') == 'true'));
    $('#alertBreakdowns').prop('checked',(localStorage.getItem('alertBreakdowns') == 'true'));

    PrefsObject.alertType = $('input[name="alertType"]:checked').val();
    PrefsObject.alertCMail = (localStorage.getItem('alertCMail') == 'true');
    PrefsObject.alertBreakdowns = (localStorage.getItem('alertBreakdowns') == 'true');


    ipcRenderer.send('refreshPrefs', PrefsObject);
}
