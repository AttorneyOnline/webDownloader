import FuzzySearch from 'fuzzy-search';
const { downloadAndZip } = require("./downloadandzip")
import "./index.css";
const tempExample = document.getElementById('hintedCharacters')

// const parse = import('parse-apache-directory-index');
const BASE_URL = "https://attorneyoffline.de/base/characters/"
const IGNORE_VALUES = new Set([
    "Name",
    "Last modified",
    "Size",
    "Description",
    "Parent Directory"
])

const crawl = async (url, currentDepth, maximumDepth) => {
    if (currentDepth > maximumDepth) {
        return
    }
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
        const aTagValue = link.getAttribute('href')
        if (IGNORE_VALUES.has(link.innerHTML)) {
            continue
        }
        
        const newUrl = url + aTagValue
        // Crawl all directories,
        if (aTagValue.endsWith('/')) {
            crawl(newUrl, currentDepth+1, maximumDepth)
        } else {
            validLinks.push(newUrl)
        }
        
    }
    return validLinks
}

const getAllCharacterNames = async () => {
    const response = await fetch(`${BASE_URL}`)
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
        const aTagValue = link.getAttribute('href')
        if (IGNORE_VALUES.has(link.innerHTML)) {
            continue
        }
        
        // Crawl all directories,
        if (aTagValue.endsWith('/')) {
            validLinks.push(decodeURI(aTagValue.slice(0,-1)))
        } 
        
    }
    return validLinks
}

export const getCharacterUrls = async () => {
    tempExample.innerHTML = ""
    const characterName = document.getElementById('characterNameInput').value
    const validUrls = await crawl(`${BASE_URL}${characterName}/`, 0, 99)
    tempExample.innerHTML = "Downloading..."
    downloadAndZip(validUrls);
    tempExample.innerHTML = "Downloaded!"
    return
}
window.characters = []
const createCharactersForDropdown = async () => {
    console.log('Hold my beer')
    const allCharacterNames = await getAllCharacterNames()
    window.characters = allCharacterNames
    console.log('Done!')
}

window.sortedCharacters = []

export const searchForCharacters = () => {
    const userInput = document.getElementById('characterNameInput').value
    const searcher = new FuzzySearch(window.characters)
    window.sortedCharacters = searcher.search(userInput)
    console.log(window.sortedCharacters)
    tempExample.innerHTML = ""
    if (window.sortedCharacters.length < 100) {
        window.sortedCharacters.forEach(character => {
            tempExample.innerHTML += `<br />${character}`
        });
    } else if (window.sortedCharacters.length > 100){
        tempExample.innerHTML = "Too many characters like this! Filter better."
    } else if (window.sortedCharacters.length === 0) {
        tempExample.innerHTML = "We cant find any characters with that name."
    } 
}
window.setTimeout(function() { createCharactersForDropdown() }, 0);

