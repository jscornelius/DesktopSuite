//renderer context
const {ipcRenderer} = require('electron');
const electron = require('electron');
const {shell} = require('electron');

const $ = require('jquery');
const moment = require('moment');
import * as Utils from './utils.js';

var breakdownDetails = [];

function bd(id,type,summary,name,date,title,viewed){
    this.breakdown_id = id;
    this.breakdown_type=type;
    this.breakdown_type_summary=summary;
    this.casting_director_display_name=name;
    this.date_published=date;
    this.title=title;
    this.viewed=viewed;
}

//--------------------
ipcRenderer.on('populateBreakdownDetails', (event,arg) =>{
    var alertType = localStorage.getItem('alertType');
    $('#released-on').html(alertType+' Breakdowns Released '+ moment().format('MMMM Do YYYY'));
    //clearBreakdownList();
    readBreakdownDetailsFromLocalStorage();
});

//--------------------
ipcRenderer.on('prefsUpdated', (event,arg) =>{
    writeBreakdownDetailsToLocalStorage();
    clearBreakdownList();
    readBreakdownDetailsFromLocalStorage();
});

ipcRenderer.on('updateBreakdownDetails', (event,arg) =>{ //  update the breakdowns when this window closes
    writeBreakdownDetailsToLocalStorage();
});

window.addEventListener('beforeunload', function(event){
    //breakdownWindow.webContents.send("updateBreakdownDetails");
    writeBreakdownDetailsToLocalStorage();
});

function writeBreakdownDetailsToLocalStorage(){
    var alertType = localStorage.getItem('alertType');
    var bd;
console.log("updating breakdown details");

    for (bd of breakdownDetails){
        if (bd.breakdown_type_summary == alertType) {
            bd.viewed = true;
        }
    }
    breakdownDetails.sort((a, b) => (a.date_published < b.date_published) ? 1 : ((a.date_published > b.date_published) ? -1 : 0));
    localStorage.setItem('breakdownDetails', JSON.stringify(breakdownDetails));
}
//--------------------
function readBreakdownDetailsFromLocalStorage(){
    var alertType = localStorage.getItem('alertType');
    var bd;

    breakdownDetails = JSON.parse(localStorage.getItem('breakdownDetails'));
    breakdownDetails.sort((a, b) => (a.date_published < b.date_published) ? 1 : ((a.date_published > b.date_published) ? -1 : 0));

    for (bd of breakdownDetails){
        if (addListItem(bd,alertType)){
        }
    }
    //writeBreakdownDetailsToLocalStorage();
}

function clearBreakdownList(){
    var ul = document.getElementById("breakdown-list");
    var lines = document.getElementsByClassName("breakdown-list-item");

    while (lines[0]){
        lines[0].parentNode.removeChild(lines[0]);
    }
}

export function browseToBreakdown(breakdownID){
    shell.openExternal('https://www.breakdownexpress.com//projects/?view=breakdowns&action=details&breakdown=' + breakdownID);
}

function addListItem(breakdownDetail, alertType){

    var line = document.getElementById(breakdownDetail.breakdown_id);
    if (line) return false;

    if (breakdownDetail.breakdown_type_summary != alertType) return false;

    var ul = document.getElementById("breakdown-list");
    var li = document.createElement("li");
    li.setAttribute('id',breakdownDetail.breakdown_id);
    li.setAttribute('class','breakdown-list-item');
    li.onclick = function() {
        browseToBreakdown(breakdownDetail.breakdown_id);
    };

    var datelabel = document.createElement("label");
    var datepublished = breakdownDetail.date_published;
    var t = moment(datepublished);
    datelabel.innerHTML = t.format("hh:mm A");
    datelabel.setAttribute('class','breakdown-column');
    li.appendChild(datelabel);

    var titlelabel = document.createElement("label");
    titlelabel.innerHTML = breakdownDetail.title;
    titlelabel.setAttribute('class','breakdown-column');
    li.appendChild(titlelabel);

    var typelabel = document.createElement("label");
    typelabel.innerHTML = breakdownDetail.breakdown_type;
    typelabel.setAttribute('class','breakdown-column');
    li.appendChild(typelabel);

    var castinglabel = document.createElement("label");
    castinglabel.innerHTML = breakdownDetail.casting_director_display_name;
    castinglabel.setAttribute('class','breakdown-column');
    li.appendChild(castinglabel);

    var viewedlabel = document.createElement("label");
    viewedlabel.innerHTML = breakdownDetail.viewed;
    viewedlabel.setAttribute('class','breakdown-column');
    li.appendChild(viewedlabel);

    ul.appendChild(li);

    return true;

}
