const {ipcRenderer} = require('electron');
const electron = require('electron');
const $ = require('jquery');
const moment = require('moment');

import * as Utils from './utils.js';

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
    docked: true,
    loginname:"",
    password:""
};

var loginInProgess = false;

import * as LoginController from './login-controller.js';

LoginController.init("https://webservices.breakdownexpress.com/ds/_authenticateUser.cfm");
//LoginController.init("http://dev-webservices.breakdownexpress.com/ds/_authenticateUser.cfm");

displayMessage("");

// load the login and password
UserObject.loginname = localStorage.getItem('loginname');
UserObject.password = localStorage.getItem('password');

$('#loginName').val(UserObject.loginname);
$('#password').val(localStorage.getItem('password'));

//--------------------
// read prefs Object
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
// load a UserObject
function loadUserObject(loginname,password,getCMail,getBreakdowns,datestring){
    UserObject.loginname=loginname;
    UserObject.password=password;
    UserObject.getCMail=getCMail;
    UserObject.getBreakdowns = getBreakdowns;
    UserObject.getFromDate = datestring;
}
//--------------------
// display a message to the user
function displayMessage(message){
    $('#messageText').html(message);
}

//--------------------
// get the UserObject from main
ipcRenderer.on('setUserObject', (event,arg) =>{
    UserObject = arg;
});

$(window).on('keydown', function(event) {
    if (event.keyCode === 13) {
        $('#login-button').trigger('click');
        event.preventDefault();
    }
});

//--------------------
// login button
$('#login-button').on('click', function(){
//console.log("login-button pressed!");
    if (loginInProgess === true){ //  prevent double clicking...
        return;
    }
    loginInProgess = true;

    displayMessage("Authenticating...");
    $('#loginName').removeClass('invalid');
    $('#password').removeClass('invalid');

    var loginname=$('#loginName').val();
    var password=$('#password').val();
    LoginController.doLogin(loginname,password,function(err,loginresponse){
        if (!err){
            if (loginresponse.isUserLoggedIn){
                loadUserObject(loginname,password,loginresponse.getCMail,loginresponse.getBreakdowns,moment().format('MM/DD/YYYY'));
                localStorage.setItem('getCMail',loginresponse.getCMail);
                localStorage.setItem('getBreakdowns',loginresponse.getBreakdowns);
                if ($('#remember-me').prop("checked")){
                    localStorage.setItem('loginname', UserObject.loginname);
                    localStorage.setItem('password', UserObject.password);
                }else {
                    localStorage.setItem('loginname', "");
                    localStorage.setItem('password', "");
                }
//                readPrefs();
//                ipcRenderer.send('refreshPrefs', PrefsObject);
                // pass the UserObject back to Main
                ipcRenderer.send('userIsLoggedIn', UserObject);
            }else { //
                $('#loginName').addClass('invalid');
                $('#password').addClass('invalid');
                loginInProgess = false;
                displayMessage("Login Failed.  Check your username and password.");
                //userHasLoggedOut(); // not really, but clear out the data anyway
            }
        }else{
            displayMessage("error: unable to login");
            console.log("error: unable to login");
            ipcRenderer.send('loginFailed', "");
        }
    });
});
