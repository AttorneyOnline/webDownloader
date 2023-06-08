const { downloadAndZip } = require("./downloadandzip")

// stolen from https://gomakethings.com/getting-html-with-fetch-in-vanilla-js/

// const parse = import('parse-apache-directory-index');
const BASE_URL = "https://attorneyoffline.de/base/characters/"
const IGNORE_VALUES = new Set([
    "Name",
    "Last modified",
    "Size",
    "Description",
    "Parent Directory"
])
const crawl = async (url) => {
    const response = await fetch(`${url}`)
    if (response.status === 404) {
        return
    }

    // Create a fake webpage
    const websiteDirectoryPage = await response.text()
    const tempPage = document.createElement("html");
    tempPage.innerHTML = websiteDirectoryPage;

    const tags = tempPage.getElementsByTagName('a')
    const validLinks = []
    for (const link of tags) {
        const aTagValue = link.innerHTML
        if (IGNORE_VALUES.has(aTagValue)) {
            continue
        }

        const newUrl = url + aTagValue
        // Crawl all directories,
        if (aTagValue.endsWith('/')) {
            crawl(newUrl)
        } else {
            validLinks.push(newUrl)
        }
        
    }
    return validLinks
}

export const getCharacterUrls = async () => {
    const characterName = document.getElementById('characterNameInput').value
    const validUrls = await crawl(`${BASE_URL}${characterName}/`)

    // const values = (await response.()).matchAll(`<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1`)
    console.log(validUrls);
    validUrls.forEach(url => {
        document.body.innerHTML += "<br />" +url
    })
    downloadAndZip(validUrls);
    return
}
