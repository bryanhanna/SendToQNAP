/* +++++++++++++++++++++++++++++++++
 Handles to DOM elements
*/

const addButton = document.querySelector("#NASpress");
const input = document.querySelector("#NAStest");
const tableDNL = document.querySelector("#NASDownloadTable");
const JobNb = document.querySelector("#NASDNLJobNb");
var NASsid="";

/* +++++++++++++++++++++++++++++++++
 Fill DOM element with retrieved Nb of download Jobs
*/
function setJobNb(newInfo)
{
  JobNb.textContent=newInfo+" Jobs in queue";
}

+NASprotocol+" "+res.NASlogin+":"+res.NASpassword+"@"+res.NASaddress+":"+res.NASport+"/"+res.NASdir
/* +++++++++++++++++++++++++++++++++
 Remove from DOM all download Jobs except first row used as header
*/
function clearDNLTable()
{
  var table = document.querySelector('#NASDownloadTable');
  var nbItem = table.rows.length;
  appendLog("Nb of items to del:"+nbItem);
  if (table.rows.length > 1) {
      for (let i=1; i< nbItem;i++) {

        appendLog("Loop2del "+i+" => item to del:"+table.rows[1].getAttribute("hash"));
        table.rows[1].remove();
      };
    }
}

/* +++++++++++++++++++++++++++++++++
 Add a new DOM element with one retrieved job defined by its QNAP hash, filename and already downloaded file
*/
function AddQNAPDNLasTable(hashFile ,filename,rateFile) {
  let newItem = filename;

  appendLog("AQD New item="+newItem);

  var attrHash = document.createAttribute("hash");
  const fileRow = document.createElement('tr');
  const fileCol1 = document.createElement('td');
  const fileCol2 = document.createElement('td');
  const fileCol3 = document.createElement('td');
  const fileCol4 = document.createElement('td');
  const listBtn = document.createElement('button');
  const fileProgress = document.createElement('progress');


  appendLog(" col1="+fileCol1);
  appendLog(" col2="+fileCol2);
  appendLog("btn="+listBtn);

  fileRow.appendChild(fileCol1);
  fileRow.id = "itemDNL";
  fileCol1.textContent = newItem;
//  fileCol1.width = "70%";

  fileProgress.textContent = rateFile;
  fileProgress.value = rateFile;
  fileProgress.max = "100";
  appendLog("fprog="+fileProgress.value+"/"+fileProgress.max+" innerHTML="+fileProgress.innerHTML);

  fileCol4.appendChild(fileProgress);
  //fileCol2.textContent = rateFile;
  fileRow.appendChild(fileCol4);

  fileCol3.appendChild(listBtn);
  listBtn.className = "Btn3D";
  fileRow.appendChild(fileCol3);
  listBtn.textContent = 'X';

  attrHash.value = hashFile;
  fileRow.setAttributeNode(attrHash);
  tableDNL.appendChild(fileRow);

  listBtn.onclick = function(e) {
    appendLog("Press Del="+hashFile);
    LogAndDelDNL(hashFile);
    //tableDNL.removeChild(fileRow);
  }

}

/* +++++++++++++++++++++++++++++++++
 Link DOM button to callback
*/
function initListSection()
{
    var refreshButton = document.querySelector("#NASrefresh");

    refreshButton.addEventListener("click", LoadAndLogAndListDNL_bis /*LoadAndLogAndListDNL*/);
}

initListSection();


/* +++++++++++++++++++++++++++++++++
Load NAS settings and call next steps
*/
function LoadAndLogAndListDNL() {
//  var gettingAllStorageItems = browser.storage.local.get(null);
/*  var gettingAllStorageItems = chrome.storage.local.get(null);
  gettingAllStorageItems.then((res) => {
      NASaddr = res.NASaddress;
      NASport = res.NASport;
      NASlogin = res.NASlogin;
      NASpassword = res.NASpassword;
      NASdir = res.NASdir;*/

    chrome.storage.local.get(null,function(res) {
      NASaddr = res.NASaddress;
      NASport = res.NASport;
      NASlogin = res.NASlogin;
      NASpassword = res.NASpassword;
      NASdir = res.NASdir;
      NASsecure = res.NASsecure;
      if (NASsecure)
      {
        NASprotocol = "https";
      }
      else {
        NASprotocol = "http";
      }

    appendLog("settings: "+NASprotocol+" "+res.NASlogin+":"+res.NASpassword+"@"+res.NASaddress+":"+res.NASport+"/"+res.NASdir);

    if (false) /*(NASsid.length > 0)*/ {
      appendLog("LLLD SID "+NASsid+" already avaialble")
      listDNL();
    }
    else {
      LogAndListDNL();
    }
  });
}


// WIP replace by asunc pattern
/* +++++++++++++++++++++++++++++++++
Load settings, Log and List DNL
*/
async function LoadAndLogAndListDNL_bis() {
    var resLogin = false;
    
    clearError();
    clearPopupError();
    await getSettings();
    appendLog(" LogAndListDNL_bis : settings: "+NASprotocol+" "+NASlogin+":"+NASpassword+"@"+NASaddr+":"+NASport+" temp="+NAStempdir+" move="+NASdir);
/*
    try
        {
        resLogin = await loginNAS();
        appendLog("LogAndListDNL_bis: called loginNAS="+resLogin);
        } 
    catch(err)
        {
            appendLog("LoadAndLogAndListDNL_bis: Bad NAS address or login")
            showPopupError("Bad NAS address or login")
        }

    if (resLogin === true)*/
    {
      // Call addUrl with SID & URL
      appendLog("LogAndListDNL_bis: async fct now calls addUrl with SID="+NASsid+" & URL");

      let resSend = await ListQNAPDNL(NASsid);
      if (resSend === true )
      {
        appendLog("LogAndListDNL_bis: ListQNAPDNL OK with ");
      }
      else
      {
        appendLog("LogAndListDNL_bis: ListQNAPDNL error");
      }
    }
}

/* +++++++++++++++++++++++++++++++++
 Add download task using SID
*/
async function ListQNAPDNL(sid) {
    appendLog("ListQNAPDNL: SID="+sid);

    appendLog("Launch QNAP Query DS Tasks");
    var requete = NASprotocol+"://"+NASaddr+":"+NASport+"/downloadstation/V4/Task/Query";
    appendLog("Request to send:"+requete);
    var data = "sid="+sid+"&limit=0&status=all&type=all";

    let response = await fetch(requete, {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        },
        body: data
        }
    )
    
    if(response.ok ) {
        var jsonData = await response.json(); //JSON.parse(this.responseText);
        appendLog("ListQNAPDNL: fetch response: "+JSON.stringify(jsonData));

        // an error occured
        if (jsonData.error > 0)
            {
                appendLog("ListQNAPDNL: error code="+jsonData.error+ " reason="+jsonData.reason);
                
                // check if session expiration error
                if ( jsonData.error === 5)
                    {
                        appendLog("ListQNAPDNL:session expired: try to relogin");
   
                    try
                        {
                        resLogin = await loginNAS();
                        appendLog("LogAndListDNL_bis: called loginNAS="+resLogin);
                        } 
                    catch(err)
                        {
                            appendLog("LoadAndLogAndListDNL_bis: Bad NAS address or login")
                            showPopupError("Bad NAS address or login");
                        }

                    if (resLogin === true)
                        {
                            let resSend = await ListQNAPDNL(NASsid);
                            if (resSend === true )
                            {
                                appendLog("LogAndListDNL_bis: ListQNAPDNL OK with ");
                            }
                            else
                            {
                                appendLog("LogAndListDNL_bis: ListQNAPDNL error");
                            }
                            return resSend;
                        }
                    }
                else // other error to report 
                {
                    showPopupError(jsonData.reason);
                    return false;
                }
            }
        
        clearDNLTable();
        appendLog("Total tasks:"+jsonData.total);
        appendLog("Total downloading:"+jsonData.status.downloading);
        setJobNb(jsonData.status.downloading);
        for (i=0; i < jsonData.total ; i++) {
            if ( jsonData.data[i].state != "5" && jsonData.data[i].state != "4") {
              appendLog("En cours ["+i+"].status : "+jsonData.data[i].state+" - "+jsonData.data[i].source_name);
              appendLog("Rate ["+i+"] : "+jsonData.data[i].total_down+" / "+jsonData.data[i].size);
              let doneDNL = parseInt(jsonData.data[i].total_down);
              let todoDNL = parseInt(jsonData.data[i].size);
              let rateDNL = 0;
              let fnDNL = getFilenameOfURL(jsonData.data[i].source);
              let hashDNL = jsonData.data[i].hash;
              if (todoDNL > 0)
              {
                rateDNL = Math.trunc(100*doneDNL/todoDNL);
              }
              else {
                rateDNL = 0;
              }

              appendLog("Rate ["+i+"] : "+rateDNL);
              appendLog("Rate"+rateDNL.toString());
//                    AddQNAPDNL(getFilenameOfURL(jsonData.data[i].source));

              let TabElt = document.querySelector("[hash=\""+hashDNL+"\"]");
              appendLog("Query Result ("+fnDNL+" - "+hashDNL+") = "+TabElt);


              if ( TabElt == null)
              {
                appendLog("Create="+fnDNL+" - "+hashDNL);
                AddQNAPDNLasTable(hashDNL,getFilenameOfURL(fnDNL),rateDNL.toString());
              }
              else {
                appendLog("Doublon="+fnDNL+" - "+hashDNL);
              }

                //AddQNAPDNL(jsonData.data[i].source_name); // Only filled if actually downloading state = 104
            }
            else {
              //appendLog("Fini["+i+"].status : "+jsonData.data[i].state+" - "+jsonData.data[i].source_name);

            }
        }
    }
    return true;
}

/* +++++++++++++++++++++++++++++++++
   return filename from URL
*/
function getFilenameOfURL(url) {
  appendLog("gFN URL="+url);

  var flna = url.split("/");
  var fileURL = flna[flna.length-1];

  appendLog("fileURL="+fileURL);

  return(fileURL);
}


/* +++++++++++++++++++++++++++++++++
Login into NAS and get SID for next step
*/
function LogAndDelDNL(hash) {
  var data = "";
  //    var data = "user=admin&pass=bm9ncm9pMDE%3D";

  // cannot share SID in that way
  if (true) //(NASsid.length == 0)
  {
    var xhr = new XMLHttpRequest();

    data = "user="+NASlogin+"&pass="+btoa(NASpassword);
    appendLog("param login ="+data);
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          appendLog(this.responseText);
          var obj = JSON.parse(this.responseText);
          appendLog("SID="+obj.sid);
          //NASsid = obj.sid;
          delDNL(obj.sid,hash);
        }
    });

    appendLog("Lancement QNAP Login DS SID");
    var requete = NASprotocol+"://"+NASaddr+":"+NASport+"/downloadstation/V4/Misc/Login";
    appendLog("Request to send:"+requete);
    xhr.open("POST", requete);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
    
    xhr.send(data);
  }
  else {
    appendLog("LDD SID "+NASsid+" already avaialble")
    //delDNL(NASsid,hash);
  }
}
/* +++++++++++++++++++++++++++++++++
 Add download task using SID
*/
function delDNL(sid,hash) {
    //var data = "sid="+sid+"&temp=Download&move=Multimedia%2FTemp&url=http%3A%2F%2Freleases.ubuntu.com%2F18.04%2Fubuntu-18.04.4-desktop-amd64.iso";
    appendLog("SID="+sid);
    appendLog("Hash="+hash);

    var data = "sid="+sid+"&hash="+hash;

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            appendLog(this.responseText);
            var jsonData = JSON.parse(this.responseText);

            appendLog("error:"+jsonData.error);

            appendLog("EndOfDel=>List (SID ="+sid+"  )")
            setTimeout( ListQNAPDNL, 500, sid);
      }

    });

    appendLog("Lancement QNAP Remove Task hash:"+hash);
    var requete = NASprotocol+"://"+NASaddr+":"+NASport+"/downloadstation/V4/Task/Remove";
    appendLog("Request to send:"+requete);
    xhr.open("POST", requete);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
    appendLog(xhr);
    xhr.send(data);

}
