const $ = require('jquery');

export function init(url){
    var CMails;
    this.url = url;
}

export function getCMailCount(loginname,password,callbackfunction){
    var xmlstring = "<desktopsuite><credentials><uid>" + loginname + "</uid><pwd>" + password + "</pwd></credentials></desktopsuite>";
    var requestData = encodeURIComponent(xmlstring);

    requestData = "XMLData=" + requestData;

    $.post(this.url,requestData,function(data){
        })
        .done(function(data) {
            var $xml = $( $.parseXML(new XMLSerializer().serializeToString(data.documentElement)) );
            this.CMails = $xml.find("cmail");
//console.log("array of CMail:",this.CMails);

            callbackfunction(false,this);
        })
        .fail(function() {
            callbackfunction(true,this);
        })
        .always(function() {
    });
}
