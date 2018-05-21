//renderer context
const {ipcRenderer} = require('electron');
const electron = require('electron');
const url = require('url');
const path = require('path');
const {Howl} = require('howler');

const $ = require('jquery');

const moment = require('moment');

import * as Utils from './utils.js';

var globalTimer = "";
var alertTimer;

var cmailSectionHeight = 50;
var breakdownSectionHeight = 50;

var firstRun = true;
var resize=false;

var UserType={
    "CMailOnly":0,
    "BreakdownOnly":1,
    "Both":2
};

var thisUserType;

var lastCMailCount = 0;
var CMailCount = 0;

var UserObject = {
    loginname:"",
    password:"",
    getCMail:true,
    getBreakdowns:true,
    getFromDate:""
};

var PrefsObject={
    alertType: "All",
    alertCMail: "true",
    alertBreakdowns: "true",
    docked: true,
    loginname:"",
    password:""
};

var breakdownDetails=[];

var alertSound = new Howl({ src: ['./assets/sounds/lowping.mp3'] });

import * as ConfigController from './config-controller.js';
import * as CMailController from './cmail-controller.js';
import * as BreakdownController from './breakdown-controller.js';


ConfigController.init("http://webservices.breakdownexpress.com/ds/_getAllConfigurationSettings.cfm");
CMailController.init("http://webservices.breakdownexpress.com/ds/_getCmail.cfm");
BreakdownController.init("http://webservices.breakdownexpress.com/ds/_getBreakdowns.cfm");

//--------------------
// read prefs into PrefsObject
function readPrefs(){
    if (localStorage.getItem('alertType')){
        PrefsObject.alertType = localStorage.getItem('alertType');
    }else {
        PrefsObject.alertType = 'Theatrical';
        localStorage.setItem('alertType', PrefsObject.alertType);
    }
    if (localStorage.getItem('alertCMail')){
        PrefsObject.alertCMail = (localStorage.getItem('alertCMail') == "true");
    }else{
        PrefsObject.alertCMail = true;
        localStorage.setItem('alertCMail', 'true');
    }
    if (localStorage.getItem('alertBreakdowns')){
        PrefsObject.alertBreakdowns = (localStorage.getItem('alertBreakdowns') == "true");
    }else{
        PrefsObject.alertBreakdowns = true;
        localStorage.setItem('alertBreakdowns', 'true');
    }

    PrefsObject.loginname = localStorage.getItem('loginname');
    PrefsObject.password = localStorage.getItem('password');
}

//--------------------
// set visibility of fields by contents PrefsObject
function applyPrefs(){
    var breakdownVisible = (UserObject.getBreakdowns && PrefsObject.alertBreakdowns);
    var cmailVisible = (UserObject.getCMail && PrefsObject.alertCMail);

    if(resize){
        resizer('#cmail-group',1);
        resizer('#breakdown-group',1);
    }

    if (breakdownVisible){ // show breakdown
        $('#breakdown-group').show();
        if (cmailVisible){ // show cmail
            $('#breakdown-group').css('grid-row', '2');
            $('#breakdown-group').css('margin','0px 10px 10px 10px');

            $('#cmail-group').css('grid-row', '1');
            $('#cmail-group').css('margin', '10px 10px 0px 10px');
            $('#cmail-group').show();
        }else{ // or, only show breakdown
            $('#cmail-group').hide();
            $('#breakdown-group').show();
            $('#breakdown-group').css('grid-row', '1/3');
            $('#breakdown-group').css('margin','10px 10px 10px 10px');
        }
    }else{ // no breakdown, show cmail
        $('#breakdown-group').hide();
        $('#cmail-group').show();
        $('#cmail-group').css('grid-row', '1/3');
        $('#cmail-group').css('margin', '10px 10px 10px 10px');
        $('#content').css('grid-template-rows', '1');
    }

}

//--------------------
// display a message
function displayMessage(message){
    $('#messageText').html(message);
}

//--------------------
// send a system notification
function sendNotification(message) {
    new Notification('Breakdown Services Desktop Suite', { body: message });
    alertSound.play();
}

//--------------------
// this may not be necessary
function userHasLoggedOut(){

}

//--------------------
// MAIN LOOP MAIN LOOP MAIN LOOP!!!
ipcRenderer.on('beginMainLoop', (event,arg) =>{
    UserObject = arg;
    getUserConfig(UserObject);
    if (UserObject.getBreakdowns === true){
        thisUserType = UserType.Both;
    }else {
        thisUserType = UserType.CMailOnly;
    }
    firstRun = true;
    readPrefs();
    applyPrefs();
    CMailCount = 0;
    getDataForUser(thisUserType);

    globalTimer = setInterval(() => getDataForUser(thisUserType),24000);
});

//--------------------
// stop the global timer
ipcRenderer.on('stopTimer', (event,arg) =>{
    clearInterval(globalTimer);
});
//--------------------
// check for breakdowns menu pressed
ipcRenderer.on('menuCheckForBreakdowns', (event,arg) =>{
    if (UserObject.getBreakdowns){
        getDataForUser(UserType.BreakdownOnly);
    }
});

//--------------------
// check for breakdowns menu pressed
ipcRenderer.on('menuCheckForCMail', (event,arg) =>{
    getDataForUser(UserType.CMailOnly);
});

$('#viewbreakdown').on('click', function(){
    ipcRenderer.send('createBreakdownWindow', "");
});
$('#viewcmail').on('click', function(){
    ipcRenderer.send('viewCmails', "");
});
$('#refreshbreakdown').on('click', function(){
    if (UserObject.getBreakdowns){
        getDataForUser(UserType.BreakdownOnly);
    }
    //console.log("clickity click refreshbreakdown");
});
$('#refreshcmail').on('click', function(){
    getDataForUser(UserType.CMailOnly);
    //console.log("clickity click refreshcmail");
});
//--------------------
ipcRenderer.on('prefsUpdated', (event,arg) =>{
    readPrefs();
    applyPrefs();
    getDataForUser(UserType.Both);
});

//--------------------
ipcRenderer.on('updateNewBreakdownCount', (event,arg) =>{
});

//--------------------
// called by timer to get data for this user
function getDataForUser(which){
    if ((which == UserType.BreakdownOnly) || (which == UserType.Both)){
        if (UserObject.getBreakdowns && PrefsObject.alertBreakdowns){
            $('#breakdownNew').html("");
            $('#BreakdownGroupHeader').html("checking for Breakdowns...");
            getBreakdowns(UserObject);
        }
    }

    if ((which == UserType.CMailOnly) || (which == UserType.Both)){
        if(UserObject.getCMail && PrefsObject.alertCMail){
            $('#CMailNew').html("");
            $('#CMailGroupHeader').html("checking for cmail...");
            getCMailCount(UserObject);
        }
    }
}

//--------------------
// get user config (and mostly ignore it)
function getUserConfig(UO){//loginname,password){
//console.log("getUserConfig");
    ConfigController.getConfig(UO.loginname,UO.password,function(err,response){
        if (!err){
        }else{
            console.log("error: unable to getConfig");
        }
  });
}
//--------------------
// resize window and sections
function resizer(section, size){
    //return;

    if (size == 1){
        size = 60;
    }

    $(section).animate({height: size},1000, function(){
        var b = $('#breakdown-group').height();
        var c = $('#cmail-group').height();
        if (b < 60){
            if (c < 60){
                ipcRenderer.send('resizeMainWindow', 25);
            }
            else{
                ipcRenderer.send('resizeMainWindow', 92);
            }
        }
        else{
            ipcRenderer.send('resizeMainWindow', 172);
        }
    });
}
//--------------------
// get Cmail list
function getCMailCount(UO){
    var CMails = [];
    var newCMailCount = 0;
    var CMailText = "";

    CMailController.getCMailCount(UO.loginname,UO.password,function(err,response){
        if (!err){
            lastCMailCount=CMailCount;
            CMails = response.CMails.clone();
            CMailCount = CMails.length;

                if (lastCMailCount >0){
                    if (CMailCount > lastCMailCount){
                        newCMailCount = CMailCount - lastCMailCount;
                        CMailText = newCMailCount;

                        if(resize){
                            resizer('#cmail-group',1);
                        }
                        $('#CMailNew').html(CMailText);
                        $('#CMailGroupHeader').html("New CMail");
                        sendNotification(newCMailCount + " new CMail\n");
                    }
                    else {
                        if(resize){
                            resizer('#cmail-group',0);
                            $('#CMailNew').html("");
                            $('#CMailGroupHeader').html("New CMail");
                        }else{
                            $('#CMailNew').html("No ");
                            $('#CMailGroupHeader').html("New CMail");
                        }
                    }
                }else{
                    $('#CMailNew').html("No ");
                    $('#CMailGroupHeader').html("New CMail");
                }
            ipcRenderer.send('updateCMailMenuCount', CMailCount);
        }else{
            console.log("error: unable to get cmails");
        }
  });
}
//--------------------
// get breakdown list
function getBreakdowns(UO){//loginname,password,getFromDate){
    var displayValue;
    var displayTitle = "Theatrical Breakdowns:";
    var Breakdowns=[];
    var breakdownCount = 0;
    var newBreakdownCount = 0;
    var alertCount = 0;
    var breakdownText;

    updateBreakdownDetailsLocalStorage();
    BreakdownController.getBreakdownList(UO.loginname,UO.password,UO.getFromDate,function(err,response){
        if (!err){

            Breakdowns = BreakdownController.getBreakdowns();
            var b = localStorage.getItem('breakdownDetails');
            if (b != null){
                breakdownDetails = JSON.parse(b);
            }

            newBreakdownCount = 0;
            breakdownCount = 0;
            alertCount = 0;
            breakdownDetails.forEach(function(b){
                if ((PrefsObject.alertType == "All") || (b.breakdown_type_summary == PrefsObject.alertType)){
                    breakdownCount+=1;
                    if (b.isnew == true){
                        newBreakdownCount+=1;
                        if (b.alerted == false){
                            alertCount+=1;
                            updateAlertStatus(b.breakdown_id);
                        }
                    }
                }
            });
            if (newBreakdownCount > 0) {// this means we have another breakdown released
                $('#breakdownNew').html(newBreakdownCount);

                breakdownText = " New Breakdowns";
                if (newBreakdownCount == 1)
                {
                    breakdownText = " New Breakdown";
                }

                $('#BreakdownGroupHeader').html(breakdownText);
                if (alertCount > 0){
                    if (resize){
                        resizer('#breakdown-group',1);
                    }
                    sendNotification(newBreakdownCount + breakdownText);
                }
            }
            else{
                if (resize){
                    resizer('#breakdown-group',0);
                    $('#breakdownNew').html("");
                    $('#BreakdownGroupHeader').html("");
                }else{
                    $('#breakdownNew').html("No ");
                    $('#BreakdownGroupHeader').html("New Breakdowns");
                }

            }
            ipcRenderer.send('_updateBreakdownMenuCount', breakdownCount);
            ipcRenderer.send('_updateBreakdownList', "");

        }else{
            console.log("error: unable to get breakdowns");
        }
    });
}

function updateAlertStatus(breakdownID){
    var bd;
    var localStorageBreakdownList;

    localStorageBreakdownList=localStorage.getItem('breakdownDetails');
    if (localStorageBreakdownList == null){return;}
    breakdownDetails = JSON.parse(localStorageBreakdownList);

    for (bd of breakdownDetails){
        if (bd.breakdown_id == breakdownID) {
            bd.alerted = true;
        }
    }
    breakdownDetails.sort((a, b) => (a.date_published < b.date_published) ? 1 : ((a.date_published > b.date_published) ? -1 : 0));
    localStorage.setItem('breakdownDetails', JSON.stringify(breakdownDetails));
}


//--------------------
// update new status of breakdown list
function updateBreakdownDetailsLocalStorage(){
    var alertType = localStorage.getItem('alertType');
    var bd;
    var localStorageBreakdownList;

    localStorageBreakdownList=localStorage.getItem('breakdownDetails');
    if (localStorageBreakdownList == null){return;}
    breakdownDetails = JSON.parse(localStorageBreakdownList);

    for (bd of breakdownDetails){
        if ((alertType == 'All') || (bd.breakdown_type_summary == alertType)) {
            bd.isnew = false;
        }
    }
    breakdownDetails.sort((a, b) => (a.date_published < b.date_published) ? 1 : ((a.date_published > b.date_published) ? -1 : 0));
    localStorage.setItem('breakdownDetails', JSON.stringify(breakdownDetails));
}
