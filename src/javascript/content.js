//renderer context
const {ipcRenderer} = require('electron');
const electron = require('electron');
const url = require('url');
const path = require('path');
const {Howl} = require('howler');

const $ = require('jquery');

const moment = require('moment');

import * as Utils from './utils.js';
//import * as globals from './javascript/globaldefs.js';


var gMessageText = "";
var gNotificationtext = "";
var gNotify = false;

var globalTimer = "";
var alertTimer;

var firstRun = true;

var UserType={
    "CMailOnly":0,
    "BreakdownOnly":1,
    "Both":2
};

var thisUserType;

var lastCount=[0,0,0,0,0,0];
var newCount=[0,0,0,0,0,0];

var UserObject = {
    loginname:"",
    password:"",
    getCMail:false,
    getBreakdowns:false,
    getFromDate:""
};

var PrefsObject={
    alertType: "Theatrical",
    alertCMail: "true",
    alertBreakdowns: "true",
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

/*
ConfigController.init("http://dev-webservices.breakdownexpress.com/ds/_getAllConfigurationSettings.cfm");
CMailController.init("http://dev-webservices.breakdownexpress.com/ds/_getCmail.cfm");
BreakdownController.init("http://dev-webservices.breakdownexpress.com/ds/_getBreakdowns.cfm");
*/

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

    if (PrefsObject.alertBreakdowns == false){
        $('#breakdown-group').addClass('hidden');
    }
    else {
        if (UserObject.getBreakdowns){
            getDataForUser(UserType.BreakdownOnly);
        }
    }
    if (PrefsObject.alertCMail == false){
        if (PrefsObject.alertBreakdowns == true){ // don't hide cmail if they've already hidden breakdowns.  That would be silly
            $('#cmail-group').addClass('hidden');
        }
    }
    else {
        getDataForUser(UserType.CMailOnly);
    }
}

//--------------------
// display a message
function displayMessage(message){
    $('#messageText').html(message);
}

//--------------------
// send a system notification
function sendNotification(body) {
    if(gNotify === true){
        new Notification('Breakdown Services Desktop Suite', { body });
        alertSound.play();
    }
    gNotify = false;
}

//--------------------
// this may not be necessary
function userHasLoggedOut(){
    gNotificationtext = "";
}

//--------------------
// MAIN LOOP MAIN LOOP MAIN LOOP!!!
ipcRenderer.on('beginMainLoop', (event,arg) =>{

    firstRun = true;
    readPrefs();
    applyPrefs();

    UserObject = arg;
    getUserConfig(UserObject);
    if (UserObject.getBreakdowns === true){
        thisUserType = UserType.Both;
    }else {
        thisUserType = UserType.CMailOnly;
    }
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

//--------------------
ipcRenderer.on('prefsUpdated', (event,arg) =>{
    readPrefs();
    applyPrefs();
});

//--------------------
ipcRenderer.on('updateNewBreakdownCount', (event,arg) =>{
    $("[id='breakdowncircle']").addClass('hidden');
    gNotificationtext = "";
    gNotify = false;
});

//--------------------
// called by timer to get data for this user
function getDataForUser(which){
    var breakdownVisible = (UserObject.getBreakdowns && PrefsObject.alertBreakdowns);
    var cmailVisible = (UserObject.getCMail && PrefsObject.alertCMail);

    if (breakdownVisible){
        $('#breakdown-group').removeClass('hidden');
        $('#breakdown-group').addClass('breakdown-group');
            if (cmailVisible){
            //$('#breakdown-group').removeClass('hidden');
            //$('#breakdown-group').addClass('breakdown-group');
                $('#breakdown-group').css('grid-row', '2');
                $('#cmail-group').removeClass('hidden');
                $('#cmail-group').addClass('cmail-group');
                $('#cmail-group').css('grid-row', '1');
            }else{
                $('#breakdown-group').css('grid-row', '1/3');
            }
    }else{
        $('#breakdown-group').addClass('hidden');
        $('#cmail-group').removeClass('hidden');
        $('#cmail-group').addClass('cmail-group');
        $('#cmail-group').css('grid-row', '1/3');
        $('#content').css('grid-template-rows', '1');
    }

    if ((which == UserType.BreakdownOnly) || (which == UserType.Both)){
        if (UserObject.getBreakdowns && PrefsObject.alertBreakdowns){
            getBreakdowns(UserObject);
        }else {

        }
    }

    if ((which == UserType.CMailOnly) || (which == UserType.Both)){
        if(UserObject.getCMail && PrefsObject.alertCMail){
            getCMailCount(UserObject);
        }else {

        }
    }
    sendNotification(gNotificationtext);
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
// get Cmail list
function getCMailCount(UO){
//console.log("getCMailCount");
    var CMails = [];
    var CMailCount = 0;
    var newCMailCount = 0;

    CMailController.getCMailCount(UO.loginname,UO.password,function(err,response){
        if (!err){
            var lastCount=CMailCount;
            CMails = response.CMails.clone();
            CMailCount = CMails.length;
            if (firstRun){
                //firstRun = false;
            }else {
                if (lastCount >0){
                    if (lastCount < CMailCount){

                        $("[id='cmailcircle']").removeClass('hidden');
                        newCMailCount = CMailCount - lastCount;
                        gNotificationtext = newCMailCount + " new CMail messages\n";
                        gNotify = true;
                    }
                }
            }
            $('#CMailCount').html(CMailCount);
            $('#CMailNew').html(newCMailCount);
            ipcRenderer.send('updateCMailMenuCount', CMailCount);
        }else{
            CMails = "";
            CMailCount = 0;
            newCMailCount = 0;
            $('#CMailCount').html(CMailCount);
            $('#CMailNew').html(newCMailCount);
            console.log("error: unable to get cmails");
        }
  });
}
//--------------------
// get breakdown list
function getBreakdowns(UO){//loginname,password,getFromDate){
//console.log("getBreakdowns");
    var checkForNew = "";
    var displayValue;
    var displayTitle = "Theatrical Breakdowns:";
    var Breakdowns=[];
    var breakdownDetails =[];
    var breakdownCount = 0;
    var newBreakdownCount = 0;
    var alertCount = 0;

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
                if (b.breakdown_type_summary == PrefsObject.alertType){
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
                $("[id='breakdowncircle']").removeClass('hidden');

                gNotificationtext = "New breakdowns:" + newBreakdownCount + "\n";
                if (alertCount > 0){
                    gNotify = true;
                }

                // mark these as no longer new, since we've seen them
                //updateBreakdownDetailsLocalStorage();
            }
            else{
                $("[id='breakdowncircle']").addClass('hidden');
                gNotificationtext = "";
                gNotify = false;
            }

            $('#breakdownCount').html(breakdownCount);
            ipcRenderer.send('_updateBreakdownMenuCount', newBreakdownCount);
            ipcRenderer.send('_updateBreakdownList', "");
        }else{
            Breakdowns = "";
            BreakdownCount = 0;
            newBreakdownCount = 0;
            $('#breakdownCount').html(BreakdownCount);
            $('#breakdownNew').html(newBreakdownCount);
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
        if (bd.breakdown_type_summary == alertType) {
            bd.isnew = false;
        }
    }
    breakdownDetails.sort((a, b) => (a.date_published < b.date_published) ? 1 : ((a.date_published > b.date_published) ? -1 : 0));
    localStorage.setItem('breakdownDetails', JSON.stringify(breakdownDetails));
}
