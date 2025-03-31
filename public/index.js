import FuzzySearch from 'fuzzy-search';
import ini from 'ini';
import { downloadAndZip, downloadAndZipBackgrounds } from '../downloadandzip';
import "./index.css";
const hintedCharacters = document.getElementById('hintedCharacters')
const hintedBackgrounds = document.getElementById('hintedBackgrounds')

/* eslint @typescript-eslint/no-explicit-any: "warn" */

/*
interface QueryParams {
    ip: string;
    connect: string;
    mode: string;
    asset: string;
    theme: string;
    serverName: string;
}
*/

const urlParams = new URLSearchParams(window.location.search);

export const BASE_URL = urlParams.get("asset") || "https://attorneyoffline.de/base/"
export const urlURL = new URL(BASE_URL);
export const BASE_CHARACTERS_URL = BASE_URL + "characters/"
export const BASE_BACKGROUND_URL = BASE_URL + "background/"
export const BASE_SOUNDS_URL = BASE_URL + "sounds/"
const IGNORE_VALUES = new Set([
    "Name",
    "Last modified",
    "Size",
    "Description",
    "Parent Directory"
])

const crawl = async (baseUrl, currentDepth, maximumDepth, visited = new Set()) => {
    if (currentDepth > maximumDepth || visited.has(baseUrl)) {
        return [];
    }

    visited.add(baseUrl);
    console.log(`Crawling: ${baseUrl}`);

    try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
            console.log(`Failed to fetch ${baseUrl}: ${response.statusText}`);
            return [];
        }

        const websiteDirectoryPage = await response.text();
        const tempPage = document.createElement("html");
        tempPage.innerHTML = websiteDirectoryPage;

        const validLinks = [];
        const tags = tempPage.getElementsByTagName('a');
        const baseUrlObj = new URL(baseUrl);
        const basePath = baseUrlObj.pathname;

        for (const link of tags) {
            const href = link.getAttribute('href');
            if (!href) continue;

            try {
                const absoluteUrl = new URL(href, baseUrl).href;
                const urlObj = new URL(absoluteUrl);

                // Check if the URL is within the same subfolder
                if (urlObj.pathname.startsWith(basePath)) {
                    if (absoluteUrl.endsWith('/')) {
                        validLinks.push(...await crawl(absoluteUrl, currentDepth + 1, maximumDepth, visited));
                    } else {
                        validLinks.push(absoluteUrl);
                    }
                }
            } catch (e) {
                console.log(`Invalid URL: ${href}`);
            }
        }

        return validLinks;
    } catch (error) {
        console.error(`Error crawling ${baseUrl}:`, error);
        return [];
    }
};

const getAllCharacterNames = async () => {
    const response = await fetch(`${BASE_CHARACTERS_URL}`)
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
const getAllSfxs = async (url) => {
    const response = await fetch(url)
    if (response.status === 404) {
        return
    }

    // Create a fake webpage
    const websiteDirectoryPage = await response.text()
    const tempPage = document.createElement("html");
    tempPage.innerHTML = websiteDirectoryPage;

    const tags = tempPage.getElementsByTagName('a')
    var validLinks = []
    for (const link of tags) {
        const aTagValue = link.getAttribute('href')
        if (IGNORE_VALUES.has(link.innerHTML) || aTagValue == "music/") {
            continue
        }

        // Crawl all directories,
        if (aTagValue.endsWith('/')) {
            const extraLinks = await getAllSfxs(url + aTagValue);
            if (extraLinks != null)
                validLinks = validLinks.concat(extraLinks);
        } else
            validLinks.push(decodeURI(url + aTagValue));
    }
    return validLinks
}

const getAllBackgroundNames = async () => {
    const response = await fetch(`${BASE_BACKGROUND_URL}`)
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

const failureText = document.getElementById('downloadFeedback')
export const getCharacterUrls = async () => {
    failureText.innerHTML = ""
    const characterName = document.getElementById('characterNameInput').value
    if (window.sortedCharacters.length === 0) {
        failureText.innerHTML = "Please select a valid character name" 
        return
    } else if (!window.sortedCharacters.includes(characterName)) {
        failureText.innerHTML = "Please choose a valid name from the dropdown provided."
        return
    }
    // Disable button so cant click multiple times
    document.getElementById('downloadButton').disabled = true
    document.getElementById('buttonText').style.display = 'none'
    document.getElementById('buttonLoading').style.display = 'block';
    const validUrls = await crawl(`${BASE_CHARACTERS_URL}${characterName}/`, 0, 99)
    console.log(validUrls);
    // include blip sound, SoundN and frameSFX files
    await fetch(`${BASE_CHARACTERS_URL}${characterName}/char.ini`).then(resp => resp.blob()).then(blob => blob.text()).then(text => {
        const charIni = ini.parse(text.toLowerCase());
        console.log(charIni);
        const blip = (charIni.options.blips != null) ? charIni.options.blips : (charIni.options.gender != null) ? charIni.options.gender : null;
        if (blip !== null && window.sfx.find((element) => element.includes(blip)))
            validUrls.push(`${BASE_SOUNDS_URL}` + "blips/" + blip + ".opus");

        for (const key in charIni) {
            if (key !== "soundn" && !key.endsWith("_framesfx"))
                continue;

            for (const value in charIni[key]) {
                const sfx = charIni[key][value];
                const sfxUrl = `${BASE_SOUNDS_URL}` + "general/" + sfx + ".opus";

                if (sfx != null && sfx.length > 1 && !validUrls.find((existing) => existing == sfxUrl) && window.sfx.find((element) => element.includes(sfx)))
                {
                    validUrls.push(sfxUrl);
                }
            }
        }
    });

    await downloadAndZip(characterName, validUrls);
    return
}
document.getElementById('downloadButton').onclick = getCharacterUrls

window.characters = []
window.sfx = []
const createCharactersForDropdown = async () => {
    const allCharacterNames = await getAllCharacterNames()
    const uniqueNames = new Set(allCharacterNames)

    document.getElementById('loadingCharactersText').style.display = "none";
    document.getElementById('loadingSfxText').style.display = "block";
    const allSfxNames = await getAllSfxs(`${BASE_SOUNDS_URL}`)
    const uniqueSfx = new Set(allSfxNames)

    window.characters = Array.from(uniqueNames)
    window.sfx = Array.from(uniqueSfx)
    document.getElementById('loadingContainer').style.display = 'none'
    document.getElementById('searchCharacter').style.display = "block"
}
window.backgrounds = []
const createBackgroundsForDropdown = async () => {
    const allBackgroundNames = await getAllBackgroundNames()
    const uniqueNames = new Set(allBackgroundNames)

    window.backgrounds = Array.from(uniqueNames)
    document.getElementById('loadingBackgroundContainer').style.display = 'none'
    document.getElementById('searchBackground').style.display = "block"
}

window.sortedCharacters = []
export const searchForCharacters = () => {
    const userInput = document.getElementById('characterNameInput').value
    const searcher = new FuzzySearch(window.characters)
    window.sortedCharacters = searcher.search(userInput)
    hintedCharacters.innerHTML = ""
    document.getElementById('characterSearchResults').innerHTML = `${window.sortedCharacters.length} / ${window.characters.length}`
    if (window.sortedCharacters.length < 100) {
        window.sortedCharacters.forEach(character => {
            hintedCharacters.innerHTML += `<option value="${character}"></option>`
        });
    } else if (window.sortedCharacters.length > 100){
        hintedCharacters.innerHTML = "Too many characters like this! Filter better."
    } else if (window.sortedCharacters.length === 0) {
        hintedCharacters.innerHTML = "We cant find any characters with that name."
    } 
}
window.sortedBackgrounds = []
export const searchForBackgrounds = () => {
    const userInput = document.getElementById('backgroundNameInput').value
    const searcher = new FuzzySearch(window.backgrounds)
    window.sortedBackgrounds = searcher.search(userInput)
    hintedBackgrounds.innerHTML = ""
    document.getElementById('backgroundSearchResults').innerHTML = `${window.sortedBackgrounds.length} / ${window.backgrounds.length}`
    if (window.sortedBackgrounds.length < 100) {
        window.sortedBackgrounds.forEach(background => {
            hintedBackgrounds.innerHTML += `<option value="${background}"></option>`
        });
    } else if (window.sortedBackgrounds.length > 100){
        hintedBackgrounds.innerHTML = "Too many backgrounds like this! Filter better."
    } else if (window.sortedBackgrounds.length === 0) {
        hintedBackgrounds.innerHTML = "We cant find any backgrounds with that name."
    } 
}
const backgroundsFailureDiv = document.getElementById('backgroundDownloadFeedback')
export const getBackgroundUrls = async () => {
    backgroundsFailureDiv.innerHTML = ""
    const backgroundName = document.getElementById('backgroundNameInput').value
    if (window.sortedBackgrounds.length === 0) {
        backgroundsFailureDiv.innerHTML = "Please select a valid background name" 
        return
    } else if (!window.sortedBackgrounds.includes(backgroundName)) {
        backgroundsFailureDiv.innerHTML = "Please choose a valid background from the dropdown provided."
        return
    }
    // Disable button so cant click multiple times
    document.getElementById('downloadBackgroundsButton').disabled = true
    document.getElementById('backgroundButtonText').style.display = 'none'
    document.getElementById('backgourndButtonLoading').style.display = 'block';
    const validUrls = await crawl(`${BASE_BACKGROUND_URL}${backgroundName}/`, 0, 99)
    await downloadAndZipBackgrounds(backgroundName, validUrls);
    return
}
document.getElementById('downloadBackgroundsButton').onclick = getBackgroundUrls

document.getElementById('characterNameInput').oninput = searchForCharacters
document.getElementById('backgroundNameInput').oninput = searchForBackgrounds

createCharactersForDropdown()
createBackgroundsForDropdown()

if(urlParams.has('char')) {
    const characterName = urlParams.get('char')
    document.getElementById('characterNameInput').value = characterName
    const validUrls = await crawl(`${BASE_CHARACTERS_URL}${characterName}/`, 0, 99)
    document.getElementById('downloadButton').disabled = true
    document.getElementById('buttonText').style.display = 'none'
    document.getElementById('buttonLoading').style.display = 'block';
    await downloadAndZip(characterName, validUrls);
}
