/**
 * A Google Apps Script function that exports a Google Sheets file into a `csv` or `tsv` format.
 * @param  {string}  sheetId              The source Google Sheets URL or `Spreadsheet Id` to export.
 * @param  {string}  sheetName            The name of the sheet in file to export.
 * @param  {string}  targetFolderId       The Google Drive `Folder Id` where to upload exported file.
 * @param  {string}  [format="csv"]       The file format to export the file as.
 *                                        If no argument is passed, defaults to `csv`.
 * @param  {string}  [delimiter=","|"\t"] An optional parameter to apply custom delimiter.
 *                                        If no argument is passed, defaults to `toFormat` delimiter.
 */
function exportGoogleSheetsFile(sheetId, sheetName, targetFolderId, toFormat="csv", delimiter) {

    sheetId = sheetId || "";
    if ( sheetId == "" ) {
        throw "ERROR: Parameter 'sheetId' cannot be empty.";
    };
    sheetName = sheetName || "";
    if ( sheetName == "" ) {
        throw "ERROR: Parameter 'sheetName' cannot be empty.";
    };
    targetFolderId = targetFolderId || "";
    if ( targetFolderId == "" ) {
        throw "ERROR: Parameter 'targetFolderId' cannot be empty.";
    };

    const driveFolder = DriveApp.getFolderById(targetFolderId);
    const gsheetsFile = openInputSheetId_(sheetId);

    try {
        let exportedFileUrl;
        switch ( toFormat.toLowerCase() ) {
            case "csv":
                exportedFileUrl = exportToCSV_(gsheetsFile, sheetName, driveFolder, delimiter);
                break;
            case "tsv":
                exportedFileUrl = exportToTSV_(gsheetsFile, sheetName, driveFolder, delimiter);
                break;
            default:
                throw `Input file format '${toFormat}' is not supported.`;
                break;
        };
        Logger.log(`SUCCESS: File exported as ${toFormat}, ${exportedFileUrl}`);
    } catch (error) {
        Logger.log(`ERROR: ${error}`);
    };

}