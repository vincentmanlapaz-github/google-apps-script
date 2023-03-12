/**
 * A private helper function that applies `QUOTE_ALL` to the contents of source sheet.
 * @param  {SpreadsheetApp.Sheet}  sourceSheet The sheet in Google Sheets File where to add
 *                                             quotes on cells containing line breaks, tabs,
 *                                             or commas for pristine ETL.
 * @param  {string}                delimiter   The delimiter to use in exported file.
 */
function generateSheetContents_(sourceSheet, delimiter) {

    let sourceRange = sourceSheet.getRange(
        1,
        1,
        sourceSheet.getLastRow(),
        sourceSheet.getLastColumn()
    );
    let sourceValues = sourceRange.getDisplayValues();

    let cellValue;
    let sheetContents = "";
    for ( var row = 0 ; row < sourceValues.length ; row++ ) {
        for ( var column = 0 ; column < sourceValues[row].length ; column++ ) {
            cellValue = sourceValues[row][column];
            if ( column > 0 ) {
                sheetContents += `${delimiter}`;
            };
            if ( cellValue.indexOf('"') !== -1 ) {
                cellValue = cellValue.replace(/"/g, '""');
            };
            sheetContents += `"${cellValue}"`;
        };
        sheetContents += "\n";
    };

    return sheetContents;

}