const $ = require('jquery');

export function init(url){
    this.url = url;
}

export function getConfig(loginname,password,callbackfunction){
    var xmlstring = "<desktopsuite><credentials><uid>" + loginname + "</uid><pwd>" + password + "</pwd></credentials></desktopsuite>";
    var requestData = encodeURIComponent(xmlstring);
    requestData = "XMLData=" + requestData;

    $.post(this.url,requestData,function(data){
        })
        .done(function(data) {
            var cc = $.parseXML(new XMLSerializer().serializeToString(data.documentElement));
            var $xml = $( $.parseXML(new XMLSerializer().serializeToString(data.documentElement)) );

            callbackfunction(false,this);
        })
        .fail(function() {
            callbackfunction(true,this);
        })
        .always(function() {
//console.log("always do this thing");
    });
}
