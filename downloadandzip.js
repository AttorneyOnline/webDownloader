// stolen from https://huynvk.dev/blog/download-files-and-zip-them-in-your-browsers-using-javascript
import JsZip from 'jszip';
import FileSaver from 'file-saver';
import { BASE_URL } from './public/index';

const download = async (url) => {
  return fetch(url).then(resp => {
  const filename = url.slice(BASE_URL.length);  
  return {
    filename: filename,
    blob: resp.blob()
  }
  });
};

const exportZip = (specificName, blobData) => {
  const zip = JsZip();
  // const urlSearchParams = new URLSearchParams(window.location.search);
  const charname = specificName;
  blobData.forEach((blob) => {
    zip.file(`${decodeURI(blob.filename)}`, blob.blob);
  });

  zip.generateAsync({type: 'blob'}).then(zipFile => {
    const currentDate = new Date().getTime();
    const fileName = `${charname}.zip`;

    return FileSaver.saveAs(zipFile, fileName);
  });
}

export const downloadAndZip = (specificName, urls) => {
  Promise.all(urls.map(download)).then(blobData => exportZip(specificName, blobData)).finally(() => {
    document.getElementById('buttonText').style.display = 'block'
    document.getElementById('buttonLoading').style.display = 'none';
    document.getElementById('downloadButton').disabled = false
  })
}
export const downloadAndZipBackgrounds = (specificName, urls) => {
  Promise.all(urls.map(download)).then(blobData => exportZip(specificName, blobData)).finally(() => {
    document.getElementById('backgroundButtonText').style.display = 'block'
    document.getElementById('backgourndButtonLoading').style.display = 'none';
    document.getElementById('downloadBackgroundsButton').disabled = false
  })
}