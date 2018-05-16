const $ = require('jquery');


var CMails = {};
var cmailDetails = [];

function message(id,subject){
    this.cmail_id = id;
    this.message_subject=subject;
}

export function init(url){
    this.url = url;
}

function findDetailByID(id){
    var cm;
    for (cm of cmailDetails){if (cm.cmail_id == id){return id;}}
    return -1;
}


export function getCMailCount(loginname,password,callbackfunction){
    var xmlstring = "<desktopsuite><credentials><uid>" + loginname + "</uid><pwd>" + password + "</pwd></credentials></desktopsuite>";
    var requestData = encodeURIComponent(xmlstring);
    var detailFromWebservice;

    requestData = "XMLData=" + requestData;

    $.post(this.url,requestData,function(data){
        })
        .done(function(data) {
            var $xml = $( $.parseXML(new XMLSerializer().serializeToString(data.documentElement)) );

//<cmail comcenter_msg_id="7357135" message_subject="CLIENT ADDITION: ROMNEY  VASQUEZ"/>

            this.CMails = $xml.find("cmail");
            $xml.find("cmail").each(function(){
                var cmail_id = $(this).attr('comcenter_msg_id');
                var message_subject = $(this).attr('message_subject');

                detailFromWebservice = new message(cmail_id,message_subject);
                if (findDetailByID(detailFromWebservice.cmail_id) == -1){ // don't push one we already have!!
                    cmailDetails.push(detailFromWebservice);
                }
            });

            callbackfunction(false,this);
        })
        .fail(function() {
            callbackfunction(true,this);
        })
        .always(function() {
    });
}
