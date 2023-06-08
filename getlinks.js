// stolen from https://gomakethings.com/getting-html-with-fetch-in-vanilla-js/

const parse = require('parse-apache-directory-index');

function getIndex(charname)
{
    fetch('https://attorneyoffline.de/base/characters/'+charname+'/').then(function (response) {
        // The API call was successful!
        return response.text();
    }).then(function (html) {
        // This is the HTML from our response as a text string
        parsed = parse(html);
        return parsed
    }).catch(function (err) {
        // There was an error
        console.warn('Something went wrong.', err);
    });
}
