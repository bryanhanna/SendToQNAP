
async function getSettings()
{
    let storedItems = new Promise(function(resolve, reject) {
    chrome.storage.local.get( null, resolve ) } ) ;
    
    let res = await storedItems;
    
    appendLog("getSettings res="+res);

    NASaddr = res.NASaddress;
    NASport = res.NASport;
    NASlogin = res.NASlogin;
    NASpassword = res.NASpassword;
    NAStempdir = res.NAStempdir;
    NASdir = res.NASdir;
    NASsecure = res.NASsecure;
    if (NASsecure)
    {
    NASprotocol = "https";
    }
    else {
    NASprotocol = "http";
    }
    var a = document.getElementById('StationLink');
    a.href =  NASprotocol+"://"+NASaddr+":"+NASport+"/downloadstation/";
}


/* +++++++++++++++++++++++++++++++++
 Open NAS session to get session ID SID
*/
async function loginNAS()
{
    let data = "user="+NASlogin+"&pass="+btoa(NASpassword);
    appendLog("async loginNAS: param login ="+data);
    
    let requete = NASprotocol+"://"+NASaddr+":"+NASport+"/downloadstation/V4/Misc/Login";
// TODO retrun false/throw err if bad URL , port or login/pwd
    let response = await fetch(requete, {
        method: 'POST',
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        },
        body: data,
        credentials: 'include' 
    });
        
    appendLog("loginNAS fetch response ok ="+response.ok +" status="+response.status);

    if (response.ok) {
        let responseData = await response.json();
        appendLog("loginNAS fetch response = "+JSON.stringify(responseData) );
        if (responseData.error == 0)
            {
                appendLog("SID="+responseData.sid);
                NASsid = responseData.sid;
                return true;
            }
        else
            {
                appendLog("loginNAS error = "+responseData.error);
                showError("Err");
                showPopupError("Failed to login")
                return false;
            }

    }
    else {
        console.error("loginNAS failed response ok ="+response.ok +" status="+response.status);
        showError("Err");
        showPopupError("Failed to reach NAS during login")
        return false;
    }

}



/* +++++++++++++++++++++++++++++++++
 Get download tasks list
*/
async function getQNAPDNLList(sid) {
    appendLog("getQNAPDNLList SID="+sid);

    var data = "sid="+sid+"&limit=0&status=all&type=all";

    appendLog("Lauch QNAP Query DS Tasks");
    var requete = NASprotocol+"://"+NASaddr+":"+NASport+"/downloadstation/V4/Task/Query";
    appendLog("Request to send:"+requete);

    try {
        let response = await fetch(requete, {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
            },
            body: data,
            credentials: 'include'
        });

        // if HTTP retiurn code is not 2xx
        if ( !response.ok) {
            throw new Error("getQNAPDNLList: HTTP Error ${response.status}, ${response.statusText}");
        }

        let responseData = await response.json();

        if (response.ok && responseData.error == 0) {
            appendLog("getQNAPDNLList: reponse ok = "+responseData);
            return(responseData);
        }
        else {
            appendLog("getQNAPDNLList: reponse error = "+responseData.error+"error reason = "+responseData.reason);
            throw(responseData.reason);
            return [];
        }

    } catch (e) {
        appendLog(e);
    }
    

}

/* +++++++++++++++++++++++++++++++++
 Get download tasks list
*/
async function getQNAPDNLNb(sid) {
    let DNLList = await getQNAPDNLList(sid);
    return DNLList.status.downloading;
}

// permet d'attendre le délai indiqué
function timeout(ms) {
  let timeoutId;
  return new Promise(res => {
    timeoutId = setTimeout(() => res(timeoutId), ms);
  });
}


//==================
function showMessage(msg)
{
  appendLog(msg);
// To replace with err storage as popup not present
//      document.querySelector("#ErrMsg").textContent = msg;
  chrome.browserAction.setBadgeText({text:msg});
}

function showError(msg)
{
  appendLog(msg);
//      document.querySelector("#ErrMsg").textContent = msg;
  chrome.browserAction.setBadgeText({text:msg});
}

function clearError()
{
  appendLog("Clear Error");
//      document.querySelector("#ErrMsg").textContent = "";
  chrome.browserAction.setBadgeText({text:""});
//      document.querySelector("#NASpasswordLabel").style.color = "black";
}

function clearMessage()
{
  appendLog("Clear Message");
//      document.querySelector("#ErrMsg").textContent = "";
  chrome.browserAction.setBadgeText({text:""});
//      document.querySelector("#NASpasswordLabel").style.color = "black";
}



//==================
// Show messages in bar popup
//==================
function showPopupMessage(msg)
{
  appendLog("Show msg: "+msg);
  document.querySelector("#ErrMsg").textContent = msg;
  chrome.browserAction.setBadgeText({text:"Msg"});

}
function clearPopupMessage()
{
  appendLog("Clear msg");
  document.querySelector("#ErrMsg").textContent = "";
  chrome.browserAction.setBadgeText({text:""});
}

function showPopupError(msg)
{
  appendLog("Show error: "+msg);
  document.querySelector("#ErrMsg").textContent = msg;
  chrome.browserAction.setBadgeText({text:"Err"});
}

function clearPopupError()
{
  appendLog("Clear Error");
  document.querySelector("#ErrMsg").textContent = "";
  chrome.browserAction.setBadgeText({text:""});
  document.querySelector("#NASpasswordLabel").style.color = "black";
}

//==================
// Show messages in Debug Log popup
//==================
//function resetLog() {
//  appendLog("Clear Logs");    document.getElementById('DebugLog').innerHTML = "";
//}

function appendLog(msg) {
    let logDiv = document.getElementById('DebugLog')

    if (logDiv)
        logDiv.innerHTML += "<br>" + msg;

	console.log(msg);
}
