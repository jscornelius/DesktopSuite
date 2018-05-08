
const $ = require('jquery');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

var Breakdowns = {};
var breakdownDetails = [];
var myurl;

export function init(url){
    myurl = url;
}

function bd(id,type,summary,name,date,title,viewed){
    this.breakdown_id = id;
    this.breakdown_type=type;
    this.breakdown_type_summary=summary;
    this.casting_director_display_name=name;
    this.date_published=date;
    this.title=title;
    this.viewed=viewed;

}

function writeBreakdownDetailsToLocalStorage(){
    breakdownDetails.sort((a, b) => (a.date_published < b.date_published) ? 1 : ((a.date_published > b.date_published) ? -1 : 0));
    localStorage.setItem('breakdownDetails', JSON.stringify(breakdownDetails));
}

function readBreakdownDetails(getFromDate){
    var bd;
    //var datepublished;
    //var d;
    var comparedate;

    if (localStorage.getItem('breakdownDetails') == null ){return;}

    breakdownDetails = JSON.parse(localStorage.getItem('breakdownDetails'));
    for (bd of breakdownDetails){
        //datepublished = bd.date_published;
        //d = moment(bd.date_publishe);
        comparedate = moment(bd.date_published).format("MM/DD/YYYY");

        if (comparedate != getFromDate){
            breakdownDetails = [];
            return;
        }
        else {
            return;
        }
    }
}

export function getBreakdownList(loginname,password,getFromDate,callbackfunction){
    getBreakdownWebservice(loginname,password,getFromDate,callbackfunction);
//    getBreakdownTestFromFile(loginname,password,getFromDate,callbackfunction);
}


function getBreakdownWebservice(loginname,password,getFromDate,callbackfunction){
    var xmlstring = "<desktopsuite><credentials><uid>" + loginname + "</uid><pwd>" + password + "</pwd></credentials><pub_date>" + getFromDate + "</pub_date></desktopsuite>";
    var requestData = encodeURIComponent(xmlstring);
    var detailFromWebservice;

    requestData = "XMLData=" + requestData;

    $.post(myurl,requestData,function(data){
        })
        .done(function(data) {
            var $xml = $( $.parseXML(new XMLSerializer().serializeToString(data.documentElement)) );
            Breakdowns = $xml.find("breakdown");

            // read breakdowndetails from the localstorage
            readBreakdownDetails(getFromDate);

            $xml.find("breakdown").each(function(){
                var id = $(this).attr('breakdown_id');
                var type = $(this).attr('breakdown_type');
                var summary = getSummaryTypeFromType(type);
                var name = $(this).attr('casting_director_display_name');
                var published = $(this).attr('date_published');
                var title = $(this).attr('title');

                detailFromWebservice = new bd(id,type,summary,name,published,title,false);

                if (findDetailByID(detailFromWebservice.breakdown_id) == -1){ // don't push one we already have!!
                    breakdownDetails.push(detailFromWebservice);
                }
            });

            writeBreakdownDetailsToLocalStorage();
            callbackfunction(false,this);
        })
        .fail(function() {
            callbackfunction(true,this);
        })
        .always(function() {
    });
}


function findDetailByID(id){
    var bd;
    for (bd of breakdownDetails){if (bd.breakdown_id == id){return id;}}
    return -1;
}

export function getBreakdowns(){
    return Breakdowns;
}

/*
export function getBreakdownDetails(){
    return breakdownDetails;
}
*/
function getSummaryTypeFromType(type){
    if (type === ""){ return "Other";}

    if (type === "Music Video"){ return "Theatrical";}
    if (type === "Episodic"){ return "Theatrical";}
    if (type === "Student Film"){ return "Theatrical";}
    if (type === "Pilot"){ return "Theatrical";}
    if (type === "Feature Film"){ return "Theatrical";}
    if (type === "Director\'s Reel"){ return "Theatrical";}
    if (type === "Short Film"){ return "Theatrical";}
    if (type === "Interactive Project"){ return "Theatrical";}
    if (type === "Movie for Television"){ return "Theatrical";}
    if (type === "Voice Over"){ return "Theatrical";}
    if (type === "Video"){ return "Theatrical";}
    if (type === "Documentary"){ return "Theatrical";}
    if (type === "Special"){ return "Theatrical";}
    if (type === "Trailer"){ return "Theatrical";}
    if (type === "Non-Union Short Film"){ return "Theatrical";}
    if (type === "Reality TV"){ return "Theatrical";}
    if (type === "Miniseries"){ return "Theatrical";}
    if (type === "Cable"){ return "Theatrical";}
    if (type === "Non-Union Feature Film"){ return "Theatrical";}
    if (type === "Non-Union Episodic"){ return "Theatrical";}
    if (type === "Non-Union Pilot"){ return "Theatrical";}
    if (type === "Pilot Presentation"){ return "Theatrical";}
    if (type === "Radio"){ return "Theatrical";}
    if (type === "."){ return "Theatrical";}
    if (type === "Webisode"){ return "Theatrical";}
    if (type === "Internet Project"){ return "Theatrical";}
    if (type === "Mobisode"){ return "Theatrical";}
    if (type === "Animation"){ return "Theatrical";}
    if (type === "Long Form Program"){ return "Theatrical";}
    if (type === "On Air Series"){ return "Theatrical";}
    if (type === "Pilot - Straight to Series"){ return "Theatrical";}
    if (type === "Variety Show"){ return "Theatrical";}
    if (type === "Web Series"){ return "Theatrical";}
    if (type === "New Media"){ return "Theatrical";}
    if (type === "Cable Feature"){ return "Theatrical";}
    if (type === "Video Game"){ return "Theatrical";}
    if (type === "Motion Capture"){ return "Theatrical";}
    if (type === "Sizzle Reel"){ return "Theatrical";}
    if (type === "1/2 Hour Episodic"){ return "Theatrical";}
    if (type === "1 Hr. Episodic"){ return "Theatrical";}
    if (type === "Podcast"){ return "Theatrical";}
    if (type === "MOW"){ return "Theatrical";}
    if (type === "Disney Direct to Consumer Platform"){ return "Theatrical";}

    if (type === "Commercial"){ return "Commercial";}
    if (type === "Industrial"){ return "Commercial";}
    if (type === "Infomercial"){ return "Commercial";}
    if (type === "Promo"){ return "Commercial";}
    if (type === "PSA"){ return "Commercial";}
    if (type === "Interstitials"){ return "Commercial";}
    if (type === "Ad Campaign"){ return "Commercial";}
    if (type === "Spec Commercial"){ return "Commercial";}

    if (type === "Fundraiser/Benefit"){ return "Stage";}
    if (type === "Workshop"){ return "Stage";}
    if (type === "Developmental Theater"){ return "Stage";}
    if (type === "Student Project"){ return "Stage";}
    if (type === "Theatre"){ return "Stage";}
    if (type === "Live Project"){ return "Stage";}
    if (type === "Showcase"){ return "Stage";}
    if (type === "Non-Union Theatre"){ return "Stage";}
    if (type === "Staged Reading"){ return "Stage";}

    if (type === "Stock Photo"){ return "Print";}
    if (type === "Print"){ return "Print";}
    if (type === "Photo Shoot"){ return "Print";}

    if (type === "MEMO"){ return "Other";}
    if (type === "Talent Link"){ return "Other";}
    if (type === "Announcement from Breakdown Services"){ return "Other";}
    if (type === "Updates/New Features"){ return "Other";}
    if (type === "New Media Contract (SAG or AFTRA Jurisdiction)"){ return "Other";}
    if (type === "Dues Paying Membership"){ return "Other";}
    if (type === "Talent Agency Seeking Actors"){ return "Other";}
    if (type === "Advertisement"){ return "Other";}
    if (type === "Non-Union"){ return "Other";}
    if (type === "Still Photo Shoot"){ return "Other";}
    if (type === "Open Call"){ return "Other";}
    if (type === "SAG-AFTRA"){ return "Other";}

    return "Other";
}
