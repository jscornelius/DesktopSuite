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
//console.log(cc);
/*
            this.getCmail = ($xml.find("cmail")[0].textContent === '1');
            this.getBreakdowns = ($xml.find("breakdowns")[0].textContent === '1');

            // if getCmail and getBreakdowns are both 0 then this login failed
            if ((this.getCmail === false) && (this.getBreakdowns === false)){
            this.isUserLoggedIn = false;
            this.username = "";
            }else {
                this.isUserLoggedIn = true;
                this.username = loginName;
            }
*/
            callbackfunction(false,this);
        })
        .fail(function() {
            callbackfunction(true,this);
        })
        .always(function() {
//console.log("always do this thing");
    });
}
