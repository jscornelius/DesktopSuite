//renderer context
const {ipcRenderer} = require('electron');
const electron = require('electron');
const $ = require('jquery');

import * as Utils from './utils.js';

function displayMessage(message){
//    $('#messageText').toggle(false);
    $('#messageText').html(message);
//    $('#messageText').toggle(true);
}

ipcRenderer.on('alertSetMessage', (event,arg) =>{
console.log(arg);
        displayMessage(arg);
});

//--------------------
// login button
/*$('#login-button').on('click', function(){

});
*/
