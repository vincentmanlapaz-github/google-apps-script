/**
 * A Google Apps Script function that exports a Google Sheets file to TSV in a target folder.
 * @param  {SpreadsheetApp.Spreadsheet}  sourceGSheet     The Google Sheets File to export.
 * @param  {string}                      sheetName        The name of the sheet in file to export.
 * @param  {DriveApp.Folder}             targetFolder     The Google Drive Folder to save export in.
 * @param  {string}                      [delimiter="\t"] An optional parameter to apply custom delimiter.
 */
function exportTempToTSV_(sourceGSheet, sheetName, targetFolder, delimiter) {

    delimiter = delimiter || "\t";

    const sourceFilename = sourceGSheet.getName();
    const sourceSheet = sourceGSheet.getSheetByName(sheetName);

    let gsheetsContent = generateSheetContents_(sourceSheet, delimiter);
    let exportFileUrl = googleSheetExporter_(
        gsheetsContent,
        `${sourceFilename} - ${sheetName}`,
        targetFolder,
        "tsv"
    );

    return exportFileUrl;

}
