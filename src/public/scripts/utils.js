//a bunch of utility functions

function getCompanyId(){
    return localStorage.company_id || sessionStorage.company_id
}

//get the value of the url parameter of the current address
function getUrlParameter(sParam){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return decodeURI(sParameterName[1]);
        }
    }
}