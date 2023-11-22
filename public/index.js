import FuzzySearch from 'fuzzy-search';
import ini from 'ini';
import { downloadAndZip, downloadAndZipBackgrounds } from '../downloadandzip';
import "./index.css";
const hintedCharacters = document.getElementById('hintedCharacters')
const hintedBackgrounds = document.getElementById('hintedBackgrounds')

export const BASE_URL = "https://attorneyoffline.de/base/"
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
            validLinks.push(...await crawl(newUrl, currentDepth+1, maximumDepth))
        } else {
            validLinks.push(newUrl)
        }   
    }
    return validLinks
}

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

    // include blip sound, SoundN and frameSFX files
    await fetch(`${BASE_CHARACTERS_URL}${characterName}/char.ini`).then(resp => resp.blob()).then(blob => blob.text()).then(text => {
      const charIni = ini.parse(text.toLowerCase());

      const blip = (charIni.options.blips != null) ? charIni.options.blips : (charIni.options.gender != null) ? charIni.options.gender : null;
      if (blip !== null)
        validUrls.push(`${BASE_SOUNDS_URL}` + "blips/" + blip + ".opus");

      for (const key in charIni) {
        if (key !== "soundn" && !key.endsWith("_framesfx"))
          continue;

        for (const value in charIni[key]) {
          const sfx = charIni[key][value];
          const sfxUrl = `${BASE_SOUNDS_URL}` + "general/" + sfx + ".opus";
          if (sfx != null && sfx.length > 1 && !validUrls.find((existing) => existing == sfxUrl))
            validUrls.push(sfxUrl);
        }
      }
    });

    await downloadAndZip(characterName, validUrls);
    return
}
document.getElementById('downloadButton').onclick = getCharacterUrls

window.characters = []
const createCharactersForDropdown = async () => {
    const allCharacterNames = await getAllCharacterNames()
    const uniqueNames = new Set(allCharacterNames)

    window.characters = Array.from(uniqueNames)
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

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if(urlParams.has('char')) {
    const characterName = urlParams.get('char')
    document.getElementById('characterNameInput').value = characterName
    const validUrls = await crawl(`${BASE_CHARACTERS_URL}${characterName}/`, 0, 99)
    document.getElementById('downloadButton').disabled = true
    document.getElementById('buttonText').style.display = 'none'
    document.getElementById('buttonLoading').style.display = 'block';
    await downloadAndZip(characterName, validUrls);
}