const $ = require('jquery');

export function init(url){
    this.url = url;
}

export function getBreakdownCount(loginname,password,getFromDate,callbackfunction){
    var xmlstring = "<desktopsuite><credentials><uid>" + loginname + "</uid><pwd>" + password + "</pwd></credentials><pub_date>" + getFromDate + "</pub_date></desktopsuite>";
    var requestData = encodeURIComponent(xmlstring);
    var Breakdowns;
console.log(loginname,password,getFromDate);
    requestData = "XMLData=" + requestData;

    $.post(this.url,requestData,function(data){
        })
        .done(function(data) {
//var cc = $.parseXML(new XMLSerializer().serializeToString(data.documentElement));
//console.log(cc);
            var $xml = $( $.parseXML(new XMLSerializer().serializeToString(data.documentElement)) );

            this.Breakdowns = $xml.find("breakdown");
//console.log("array of Breakdowns:",this.Breakdowns);

            callbackfunction(false,this);
        })
        .fail(function() {
            callbackfunction(true,this);
        })
        .always(function() {
//console.log("always do this thing");
    });
}
