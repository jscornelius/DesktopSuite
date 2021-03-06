const $ = require('jquery');

export function init(url){
    this.isUserLoggedIn = false;
    this.getCMail = false;
    this.getBreakdowns = false;
    this.username = "";
    this.url = url;
}

export function doLogin(loginname,password,callbackfunction){
    var xmlstring = "<desktopsuite><credentials><uid>" + loginname + "</uid><pwd>" + password + "</pwd></credentials></desktopsuite>";
    var requestData = encodeURIComponent(xmlstring);
    requestData = "XMLData=" + requestData;

    $.post(this.url,requestData,function(data){
    })
    .done(function(data) {
        var $xml = $( $.parseXML(new XMLSerializer().serializeToString(data.documentElement)) );
        this.getCMail = ($xml.find("cmail")[0].textContent === '1');
        this.getBreakdowns = ($xml.find("breakdowns")[0].textContent === '1');

        // if getCmail and getBreakdowns are both 0 then this login failed
        if ((this.getCMail === false) && (this.getBreakdowns === false)){
            this.isUserLoggedIn = false;
            this.username = "";
        }else {
            this.isUserLoggedIn = true;
            this.username = loginname;
        }
        callbackfunction(false,this);
    })
    .fail(function() {
console.log("login failed");
        this.isUserLoggedIn = false;
        callbackfunction(true,this);
    })
    .always(function() {
//console.log("always do this thing");
    });
}
