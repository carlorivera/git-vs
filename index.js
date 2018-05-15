#!/usr/bin/env node
'use strict';

const util = require('util');
const url = require('url');
const path = require('path');
const opn = require("opn");
let gitP = require('simple-git/promise');
let branch = null;
let fetchUrl = null;
let teamUrl = null;

function showUsage() {
    console.log('------------------------');
    console.log('USAGE', 'git-vs', 'ui|new|pulls|work|queries');
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

if (process.argv.length < 3) {
    showUsage();
}

let verb = process.argv[2].toLowerCase();

gitP().getRemotes(true)
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

        switch (verb)
        {
            case 'new':
                createNewPr(fetchUrl);
                break;
            case 'ui':
                openWrapper(fetchUrl + "/pullrequests?_a=mine");
                break;
            case 'work':
                openWrapper(teamUrl + "/_workitems/assignedtome");
                break;
            case 'queries':
                openWrapper(teamUrl + '_queries/favorites/');
                break;
            case 'pulls':
                let u = url.parse(fetchUrl);
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