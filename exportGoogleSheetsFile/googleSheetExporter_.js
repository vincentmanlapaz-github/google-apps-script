/**
 * A private helper function that exports a Google Sheets file to the format specified and
 * then uploads it to the designated Google Drive folder.
 * @param  {string}           sheetContents  The contents of the Google Sheets file.
 * @param  {string}           targetFilename The filename of the exported file to create.
 * @param  {DriveApp.Folder}  targetFolder   The Google Drive `Folder Id` to save export in.
 * @param  {string}           ext            The file format to export the spreadsheet to.
 */
function googleSheetExporter_(sheetContents, targetFilename, targetFolder, ext){

  let contentType;
  switch ( ext ) {
      case "tsv":
          contentType = "tab-separated-values";
          break;
      default:
          contentType = ext
          break;
  };

  let exportBlob = Utilities.newBlob(
      sheetContents,
      `text/${contentType}`,
      `${targetFilename}.${ext}`
  );

  let exportFileUrl = targetFolder.createFile(exportBlob).getUrl();

  return exportFileUrl;
  
}