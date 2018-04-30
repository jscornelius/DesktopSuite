//renderer context
const {ipcRenderer} = require('electron');
const electron = require('electron');
const url = require('url');
const path = require('path');
const {Howl} = require('howler');

const $ = require('jquery');

const moment = require('moment');

//const prefsWindow = electron.remote.BrowserWindow;

import * as Utils from './utils.js';

var gCMails=[];
var gCMailCount = 0;
var gNewCMailCount = 0;
var gBreakdowns=[];
var gBreakdownCount = 0;

var gMessageText = "";
var gNotificationtext = "";
var gNotify = false;

var globalTimer;
var alertTimer;

var gBreakdownDetails =[];

var firstRun = true;
var summaryTypes={
    "All":0,
    "Commercial":0,
    "Theatrical":0,
    "Stage":0,
    "Print":0,
    "Other":0
};
var UserType={
    "CmailOnly":0,
    "BreakdownOnly":1,
    "Both":2
};
var lastCount=[0,0,0,0,0,0];
var newCount=[0,0,0,0,0,0];

var UserObject = {
    loginname:"",
    password:"",
    getCmail:false,
    getBreakdowns:false,
    getFromDate:""
};

var PrefsObject={
    alert_all: true,
    alert_commercial: true,
    alert_theatrical: true,
    alert_stage: true,
    alert_print: true,
    alert_other: true,
    loginname:"",
    password:""
};

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
    PrefsObject.alert_all = localStorage.getItem('alert-all');
    PrefsObject.alert_commercial = localStorage.getItem('alert-commercial');
    PrefsObject.alert_theatrical = localStorage.getItem('alert-theatrical');
    PrefsObject.alert_stage = localStorage.getItem('alert-stage');
    PrefsObject.alert_print = localStorage.getItem('alert-print');
    PrefsObject.alert_other = localStorage.getItem('alert-other');
}

//--------------------
// set visibility of fields by contents PrefsObject
function applyPrefs(){
    readPrefs();

    var rows = 0;

    $('.row1').addClass('hidden');
    $('.row2').addClass('hidden');
    $('.row3').addClass('hidden');
    $('.row4').addClass('hidden');
    $('.row5').addClass('hidden');
    $('.row6').addClass('hidden');

//    if (PrefsObject.alert_all == "true"){$('.row1').removeClass('hidden'); rows++;}
    if (PrefsObject.alert_commercial == "true") {$('.row2').removeClass('hidden'); rows++;}
    if (PrefsObject.alert_theatrical == "true") {$('.row3').removeClass('hidden'); rows++;}
    if (PrefsObject.alert_stage == "true") {$('.row4').removeClass('hidden'); rows++;}
//    if (PrefsObject.alert_print == "true") {$('.row5').removeClass('hidden'); rows++;}
//    if (PrefsObject.alert_other == "true") {$('.row6').removeClass('hidden'); rows++;}

    document.documentElement.style.setProperty("----breakdownRowNum", rows);

    var sizeObject ={
        width:300,
        height:300
    };
    ipcRenderer.send('resizeMainWindow', sizeObject);
}
//--------------------
ipcRenderer.on('prefsUpdated', (event,arg) =>{
    applyPrefs();
});

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
    var thisUserType;

    firstRun = true;
    applyPrefs();

    UserObject = arg;
    getUserConfig(UserObject);
    if (UserObject.getBreakdowns === true){
        thisUserType = UserType.Both;
    }else {
        thisUserType = UserType.CmailOnly;
    }
    getDataForUser(thisUserType);
    globalTimer = setInterval(getDataForUser(thisUserType),5000);
});

//--------------------
// check for breakdowns menu pressed
ipcRenderer.on('menuCheckForBreakdowns', (event,arg) =>{
    getDataForUser(UserType.BreakdownOnly);
});

//--------------------
// check for breakdowns menu pressed
ipcRenderer.on('menuCheckForCMail', (event,arg) =>{
    getDataForUser(UserType.CmailOnly);
});

//--------------------
// called by timer to get data for this user
function getDataForUser(which){

    // TODO progress bar

    $('#breakdown-group').addClass('hidden');
    if ((which == UserType.BreakdownOnly) || (which == UserType.Both)){
        //$('#breakdown-group').addClass('hidden');

        if (UserObject.getBreakdowns){
            $('#breakdown-group').removeClass('hidden');
            $('#breakdown-group').addClass('breakdown-group');
            getBreakdowns(UserObject);
        }else {
            $('#breakdown-group').addClass('hidden');
        }
    }

    if ((which == UserType.CmailOnly) || (which == UserType.Both)){
        if(UserObject.getCmail){
            $('#cmailCount').toggle(true);
            getCMailCount(UserObject);
        }else {
            $('#cmailCount').toggle(false);
        }
        if (UserObject.getBreakdowns){
            $('#breakdown-group').removeClass('hidden');
        }
    }
    sendNotification(gNotificationtext);

}

//--------------------
// get user config (and mostly ignore it)
function getUserConfig(UO){//loginname,password){
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
    CMailController.getCMailCount(UO.loginname,UO.password,function(err,response){
        if (!err){
            var lastCount=gCMailCount;
            gCMails = response.CMails.clone();
            gCMailCount = gCMails.length;
            if (firstRun){
                //firstRun = false;
            }else {
                if (lastCount >0){
                    if (lastCount < gCMailCount){
                        gNewCMailCount = gCMailCount - lastCount;
                        gNotificationtext = gNewCMailCount + " new CMail messages\n";
                        gNotify = true;
                    }
                }
            }
            $('#CMailCount').html(gCMailCount);
            $('#newCMailCount').html(gNewCMailCount);
            ipcRenderer.send('updateCMailCount', gCMailCount);
        }else{
            gCMails = "";
            gCMailCount = 0;
            gNewCMailCount = 0;
            $('#CMailCount').html(gCMailCount);
            $('#newCMailCount').html(gNewCMailCount);
            console.log("error: unable to get cmails");
        }
  });
}
//--------------------
// get breakdown list
function getBreakdowns(UO){//loginname,password,getFromDate){
    BreakdownController.getBreakdownList(UO.loginname,UO.password,UO.getFromDate,function(err,response){
        if (!err){
            lastCount[0]=summaryTypes.All;
            lastCount[1]=summaryTypes.Commercial;
            lastCount[2]=summaryTypes.Theatrical;
            lastCount[3]=summaryTypes.Stage;
            lastCount[4]=summaryTypes.Print;
            lastCount[5]=summaryTypes.Other;

            summaryTypes={
                "All":0,
                "Commercial":0,
                "Theatrical":0,
                "Stage":0,
                "Print":0,
                "Other":0
            };

            gBreakdowns = BreakdownController.getBreakdowns();
            gBreakdownDetails = BreakdownController.getBreakdownDetails();

            gBreakdownDetails.forEach(function(b){
                summaryTypes.All += 1;
                summaryTypes[b.breakdown_type_summary] += 1;
            });

            if (firstRun){
                firstRun = false;
            }
            else {// every time except the first time
                if (summaryTypes.All > lastCount[0]) {// this means we have another breakdown released
                        newCount[0] += summaryTypes.All - lastCount[0];
                        if (newCount[0] > 0 ){
                            gNotificationtext = "Breakdowns:" + summaryTypes.All + " New:" + newCount[0] + "\n";
                            gNotify = true;
                        }
                        newCount[1] += summaryTypes.Commercial - lastCount[1];
                        newCount[2] += summaryTypes.Theatrical - lastCount[2];
                        newCount[3] += summaryTypes.Stage - lastCount[3];
                        newCount[4] += summaryTypes.Print - lastCount[4];
                        newCount[5] += summaryTypes.Other - lastCount[5];
                        $('#BreakdownNew').html(newCount[0]);
                        $('#CommercialNew').html(newCount[1]);
                        $('#TheatricalNew').html(newCount[2]);
                        $('#StageNew').html(newCount[3]);
                        $('#PrintNew').html(newCount[4]);
                        $('#OtherNew').html(newCount[5]);
                }
            }
            $('#breakdownCount').html(summaryTypes.All);
            ipcRenderer.send('updateBreakdownCount', summaryTypes.All);
            $('#CommercialCount').html(summaryTypes.Commercial);
            $('#TheatricalCount').html(summaryTypes.Theatrical);
            $('#StageCount').html(summaryTypes.Stage);
            $('#PrintCount').html(summaryTypes.Print);
            $('#OtherCount').html(summaryTypes.Other);

        }else{
            gBreakdowns = "";
            gBreakdownCount = 0;
            gNewBreakdownCount = 0;
            $('#breakdownCount').html(gBreakdownCount);
            $('#newBreakdownCount').html(gNewBreakdownCount);
            console.log("error: unable to get breakdowns");
        }
  });
}
