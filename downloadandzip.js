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

const exportZip = blobData => {
  const zip = JsZip();
  const charfolder = zip.folder(document.getElementById('characterNameInput').value)
  console.log(charfolder)
  blobData.forEach((blob) => {
    charfolder.file(`${blob.filename}`, blob.blob);
  });
  zip.generateAsync({type: 'blob'}).then(zipFile => {
    const currentDate = new Date().getTime();
    const fileName = `combined-${currentDate}.zip`;
    return FileSaver.saveAs(zipFile, fileName);
  });
}

export const downloadAndZip = urls => {
  Promise.all(urls.map(download)).then(exportZip)
}