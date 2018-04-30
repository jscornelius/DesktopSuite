//renderer context
const electron = require('electron');
const {ipcRenderer} = require('electron');

const $ = require('jquery');

//import * as Utils from './utils.js';

console.log("are we here?");
readPrefs();

$('#save-button').on('click', function(){
    console.log("save clicked");
    ipcRenderer.send('closePrefsWindow', "");
});

ipcRenderer.on('readPrefs', (event,arg) =>{
    readPrefs();
});

$('.mastercheckbox').click(function() {
/*    if ($(this).is(':checked')) {
        $('input:checkbox').prop('checked', true);
    } else {
        $('input:checkbox').prop('checked', false);
    }
*/
    savePrefs();
});

$("input[type='checkbox'].showcheckbox").change(function(){
/*    var a = $("input[type='checkbox'].showcheckbox");
    if(a.length == a.filter(":checked").length){
        $('.mastercheckbox').prop('checked', true);
    }
    else {
        $('.mastercheckbox').prop('checked', false);
    }
*/
    savePrefs();
});

function savePrefs (){
    localStorage.setItem('alert-all', $('#alert-all-cb').prop("checked"));
    localStorage.setItem('alert-commercial', $('#alert-commercial-cb').prop("checked"));
    localStorage.setItem('alert-theatrical', $('#alert-theatrical-cb').prop("checked"));
    localStorage.setItem('alert-stage', $('#alert-stage-cb').prop("checked"));
    localStorage.setItem('alert-print', $('#alert-print-cb').prop("checked"));
    localStorage.setItem('alert-other', $('#alert-other-cb').prop("checked"));
    ipcRenderer.send('refreshPrefs', "");
}

function readPrefs (){
    $('#alert-all-cb').prop('checked', localStorage.getItem('alert-all') == "true");
    $('#alert-commercial-cb').prop('checked', localStorage.getItem('alert-commercial') == "true");
    $('#alert-theatrical-cb').prop('checked', localStorage.getItem('alert-theatrical') == "true");
    $('#alert-stage-cb').prop('checked', localStorage.getItem('alert-stage')=="true");
    $('#alert-print-cb').prop('checked', localStorage.getItem('alert-print')=="true");
    $('#alert-other-cb').prop('checked', localStorage.getItem('alert-other')=="true");
}
