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

var gMessageText = "";
var gNotificationtext = "";
var gNotify = false;

var globalTimer = "";
var alertTimer;

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
    alertType: "alertTheatrical",
    alertCMail: "true",
    alertBreakdowns: "true",
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
    if (localStorage.getItem('alertType')){
        PrefsObject.alertType = localStorage.getItem('alertType');
    }else {
        PrefsObject.alertType = 'alertTheatrical';
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
ipcRenderer.on('prefsUpdated', (event,arg) =>{
    readPrefs();
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
            ipcRenderer.send('updateCMailCount', CMailCount);
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

    BreakdownController.getBreakdownList(UO.loginname,UO.password,UO.getFromDate,function(err,response){
        if (!err){

/*            lastCount[0]=summaryTypes.All;
            lastCount[1]=summaryTypes.Commercial;
            lastCount[2]=summaryTypes.Theatrical;
            lastCount[3]=summaryTypes.Stage;
            lastCount[4]=summaryTypes.Print;
            lastCount[5]=summaryTypes.Other;
*/
/*            summaryTypes={
                "All":0,
                "Commercial":0,
                "Theatrical":0,
                "Stage":0,
                "Print":0,
                "Other":0
            };
*/
            Breakdowns = BreakdownController.getBreakdowns();
            breakdownDetails = JSON.parse(localStorage.getItem('breakdownDetails'));
            //BreakdownController.getBreakdownDetails();

            newBreakdownCount = 0;
            breakdownCount = 0;
            breakdownDetails.forEach(function(b){
console.log(b.viewed);
                if (b.breakdown_type_summary == PrefsObject.alertType){
                    breakdownCount+=1;
                    if (b.viewed == false){
                        newBreakdownCount+=1;
                    }
                }

//                summaryTypes.All += 1;
//                summaryTypes[b.breakdown_type_summary] += 1;
            });

/*            newCount[0] += summaryTypes.All - lastCount[0];
            newCount[1] += summaryTypes.Commercial - lastCount[1];
            newCount[2] += summaryTypes.Theatrical - lastCount[2];
            newCount[3] += summaryTypes.Stage - lastCount[3];
            newCount[4] += summaryTypes.Print - lastCount[4];
            newCount[5] += summaryTypes.Other - lastCount[5];

            if (PrefsObject.alertType == 'Theatrical'){
                displayValue = 2;
                checkForNew = summaryTypes.Theatrical;
                //displayTitle = "Theatrical Breakdowns:";
            }
            if (PrefsObject.alertType == 'Commercial'){
                displayValue = 1;
                checkForNew = summaryTypes.Commercial;
                //displayTitle = "Commercial Breakdowns:";
            }
            if (PrefsObject.alertType == 'Stage'){
                displayValue = 3;
                checkForNew = summaryTypes.Stage;
                //displayTitle = "Stage Breakdowns:";
            }
*/
            //$('#BreakdownGroupHeader').text(displayTitle);
//            if (firstRun){
//                firstRun = false;
//            }
//            else {
                if (newBreakdownCount > 0) {// this means we have another breakdown released
                    $('#breakdownNew').html(newBreakdownCount);
//                    if (newCount[displayValue] > 0 ){

                        $("[id='breakdowncircle']").removeClass('hidden');

                        gNotificationtext = "Breakdowns released today:" + breakdownCount + "\n New breakdowns:" + newBreakdownCount + "\n";
                        gNotify = true;
//                    }
                }
//            }

            $('#breakdownCount').html(breakdownCount);
            ipcRenderer.send('updateBreakdownCount', breakdownCount);
            ipcRenderer.send('updateBreakdownList', "");
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
