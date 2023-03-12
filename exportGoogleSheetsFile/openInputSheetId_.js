/**
 * A private helper function that checks if input is URL or File Id then opens it.
 * @param  {string}  inputSheetId The input `sheetId` to check and open.
 */
function openInputSheetId_(inputSheetId) {

    let gsheetFile;

    if ( inputSheetId.indexOf("/") > -1 ) {
        gsheetFile = SpreadsheetApp.openByUrl(inputSheetId);
    } else {
        gsheetFile = SpreadsheetApp.openById(inputSheetId);
    };

    return gsheetFile;

}
