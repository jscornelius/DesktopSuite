//renderer context
const {ipcRenderer} = require('electron');
const $ = require('jquery');
//const InputMask = require('inputmask');

const moment = require('moment');
//const countdown = require('countdown');

import * as Utils from './utils.js';

var gCMails;
var gBreakdowns;
var gNotificationtext;
var globalTimer;

var gUO = {
    loginname:"",
    password:"",
    getCmail:false,
    getBreakdowns:false,
    getFromDate:""
};

import * as LoginController from './login-controller.js';
import * as ConfigController from './config-controller.js';
import * as CMailController from './cmail-controller.js';
import * as BreakdownController from './breakdown-controller.js';

LoginController.init("http://webservices.breakdownexpress.com/ds/_authenticateUser.cfm");
ConfigController.init("http://webservices.breakdownexpress.com/ds/_getAllConfigurationSettings.cfm");
CMailController.init("http://webservices.breakdownexpress.com/ds/_getCmail.cfm");
BreakdownController.init("http://webservices.breakdownexpress.com/ds/_getBreakdowns.cfm");

toggleLoginFields(true);

function loadgUO(loginname,password,getCmail,getBreakdowns,datestring){
    gUO.loginname=loginname;
    gUO.password=password;
    gUO.getCmail=getCmail;
    gUO.getBreakdowns = getBreakdowns;
    gUO.getFromDate = datestring;
}

//--------------------
// login button
$('#login-button').on('click', function(){
    var loginname=$('#loginName').val();
    var password=$('#password').val();
    LoginController.doLogin(loginname,password,function(err,loginresponse){
        if (!err){
            //gIsUserAuthenticated = response.isUserLoggedIn;
            if (loginresponse.isUserLoggedIn){
                toggleLoginFields(false);
                loadgUO(loginname,password,loginresponse.getCmail,loginresponse.getBreakdowns,moment().format('MM/DD/YYYY'));
                getDataForUser();
                globalTimer = setInterval(getDataForUser,5000);

            }else { //
                $('#loginName').addClass('invalid');
                $('#password').addClass('invalid');
                userHasLoggedOut(); // not really, but clear out the data anyway
            }
        }else{
            console.log("error: unable to login");
        }
    });

});

//--------------------
// logout button
$('#logout-button').on('click', function(){
    userHasLoggedOut();
    toggleLoginFields(true);
    //globalTimer = "";
    clearInterval(globalTimer);
});

//--------------------
// toggle fields
function toggleLoginFields(state){
    $('#logingroup').toggle(state);
    $('#datagroup').toggle(!state);
    $('login-button').toggle(state);
    $('logout-button').toggle(!state);

    if (!state){
        $('#login-button').addClass('hidden');
        $('#logout-button').removeClass('hidden');
    }else { //
        $('#logout-button').addClass('hidden');
        $('#login-button').removeClass('hidden');
        $('#loginName').removeClass('invalid');
        $('#password').removeClass('invalid');
    }
}

function userHasLoggedOut(){
    gNotificationtext = "";
}

function getDataForUser(){
    getUserConfig();
    if (gUO.getBreakdowns){
        $('#breakdowngroup').toggle(true);
        getBreakdownCount();
    }else {
        $('#breakdowngroup').toggle(false);
    }

    if(gUO.getCmail){
        $('#cmailCount').toggle(true);
        getCMailCount();//userObject.loginname,userObject.password);
    }else {
        $('#cmailCount').toggle(false);
    }
}

function getUserConfig(){//loginname,password){
    ConfigController.getConfig(gUO.loginname,gUO.password,function(err,response){
        if (!err){
//console.log("config retrieved");
        }else{
            console.log("error: unable to getConfig");
        }
  });
}

function getCMailCount(){//loginname,password,CMailCount){
    CMailController.getCMailCount(gUO.loginname,gUO.password,function(err,response){
        if (!err){
            gCMails = response.CMails.clone();
            var CMailCount = gCMails.length;
            $('#cmailCount').html(CMailCount);
//console.log(gCMails);
            gNotificationtext += "Unread CMails:" + CMailCount + "\n";
        }else{
            gCMails = "";
            $('#cmailCount').html(0);
            console.log("error: unable to get cmails");
        }
  });
}

function getBreakdownCount(){//loginname,password,getFromDate){
    BreakdownController.getBreakdownCount(gUO.loginname,gUO.password,gUO.getFromDate,function(err,response){
        if (!err){
            var BreakdownCount;
            gBreakdowns = response.Breakdowns;
            BreakdownCount = gBreakdowns.length;
            $('#breakdownCount').html(BreakdownCount);
//console.log(gBreakdowns);
            gNotificationtext = "New Breakdowns:" + BreakdownCount + "\n";
        }else{
            gBreakdowns = "";
            $('#breakdownCount').html(0);
            console.log("error: unable to get breakdowns");
        }
  });
}
