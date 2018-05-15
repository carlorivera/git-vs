#!/usr/bin/env node
'use strict';

const util = require('util');
const url = require('url');
const path = require('path');
const opn = require("opn");
let gitP = require('simple-git/promise');
const cmd = require('cmd-executor');
const git = require('cmd-executor').git
let branch = null;
let fetchUrl = null;
let teamUrl = null;

;(async () => {
 
    // any attributes/functions/parameters you call on `cmd` will be parsed
    // into a command string and executed. For example:
   
    // will call `touch a.txt`
    //await cmd.touch('a.txt')
  
    //let status = await cmd.git('status')
    let status = await git.branch("-vv");
    console.log(status);

})();
return;





function showUsage() {
    console.log('------------------------');
    console.log('USAGE', 'git-vs', 'ui|new|pulls|work|queries');
    console.log('Install as git alias with:  git config --global alias.vs "!git-vs" ');
    console.log('------------------------');
    process.exit(1);
}

function createNewPr(fetchUrl)
{
    gitP().status().then(status => { 
            branch = status.current;
            if (branch == "master") {
                console.log("Cannot create a pull request when you are on master");
                process.exit(1);
            }

            console.log("Pushing " + branch + " to remote...");
            return gitP().push('origin', status.current, {'--set-upstream': null }); 
        })
        .then(() => {
            let uriNewPR = fetchUrl + "/pullrequestcreate?sourceRef=" + branch + "&targetRef=master";
            console.log("Opening Pull Request UI.");
            openWrapper(uriNewPR);
        });
}

function openWrapper(uri) {
    console.log("Opening browser...");
    console.log(uri);
    opn(uri);
}

function getVsUrls() {
    return gitP().getRemotes(true)
        .then(remotes =>  {
            let origin = remotes.filter(r => r.name === 'origin')[0];
            
            if (!origin) {
                return Promise.reject('Cannot find remote origin');
            }
            
            fetchUrl =  origin.refs.fetch;
            if (fetchUrl.indexOf("visualstudio") === -1) {
                return Promise.reject("Origin is not a visual studio domain... FetchUrl = " + fetchUrl);
            }

            teamUrl = fetchUrl.replace(/_git\/.*/, "");
            return Promise.resolve(
                {
                    "teamUrl": teamUrl,
                    "fetchUrl": fetchUrl
                });
        });
}

function pruneCompleted() {

    //git remote prune origin; git branch -vv | where {$_ -match '\[origin/.*: gone\]'} | foreach {git branch -D ($_.split(" ", [StringSplitOptions]'RemoveEmptyEntries')[0])}

    gitP().raw(
        [
            "remote",
            "prune",
            "origin"
            //, "--dry-run"
        ]).then(() => {
           gitP().branch("-vv").then(data => {
               console.log(data);
           });
        });
}

// *******************************************************************
// Main
// *******************************************************************
if (process.argv.length < 3) {
    showUsage();
}

//pruneCompleted();

return;

let verb = process.argv[2].toLowerCase();

getVsUrls().then(urls => {
    switch (verb)
    {
        case 'new':
            createNewPr(urls.fetchUrl);
            break;
        case 'ui':
            openWrapper(urls.fetchUrl + "/pullrequests?_a=mine");
            break;
        case 'work':
            openWrapper(urls.teamUrl + "/_workitems/assignedtome");
            break;
        case 'queries':
            openWrapper(urls.teamUrl + '_queries/favorites/');
            break;
        case 'pulls':
            let u = url.parse(urls.fetchUrl);
            openWrapper(u.protocol + "//" + u.hostname + "/_pulls");
            break;
        default:
            showUsage();      
    }
})
.catch(error => {
    console.error('ERROR', error)
    process.exit(1);
});

/**/