// stolen from https://huynvk.dev/blog/download-files-and-zip-them-in-your-browsers-using-javascript
import JsZip from 'jszip';
import FileSaver from 'file-saver';

const download = async (url) => {
  return fetch(url).then(resp => {
  const filename = url.split('/').pop()
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
  const charfolder = zip.folder(charname)
  blobData.forEach((blob) => {
    charfolder.file(`${decodeURI(blob.filename)}`, blob.blob);
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