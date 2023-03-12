/**
 * A Google Apps Script function that renames files in a specific folder.
 * @param  {string}  driveLocationId   The Google Drive Id where files to rename are located.
 * @param  {string}  filenameToReplace The substring in the file to be replaced or removed.
 * @param  {string}  [replaceWith=""]  The string to replace the substring in the filename.
 *                                     If no value is passed, removes substring.
 * @param  {boolean} [undo=false]      An optional parameter to undo renaming of files.
 */
function bulkRenameFiles(driveLocationId, filenameToReplace, replaceWith="", undo=false){

    driveLocationId = driveLocationId || "";
    if ( driveLocationId == "" ) {
        throw "ERROR: Parameter 'driveLocationId' cannot be empty.";
    };
    filenameToReplace = filenameToReplace || "";
    if ( filenameToReplace == "" ) {
        throw "ERROR: Parameter 'filenameToReplace' cannot be empty.";
    };
    if ( undo ) {
        // Swaps the values of 'filenameToReplace' and 'replaceWith' parameters.
        [filenameToReplace, replaceWith] = [replaceWith, filenameToReplace];
    };

    const driveFolder = DriveApp.getFolderById(driveLocationId);
    const driveFolderFiles = driveFolder.searchFiles(`title contains '${filenameToReplace}'`);

    try {
        let filesRenamed = 0;
        while ( driveFolderFiles.hasNext() ) {
            let driveFile = driveFolderFiles.next();
            let oldFilename = driveFile.getName();
            let newFilename = oldFilename.replace(filenameToReplace, replaceWith);
            driveFile.setName(newFilename);
            filesRenamed += 1;
        };
        Logger.log(`SUCCESS: ${filesRenamed.toString()} files have been renamed!`);
    } catch (error) {
        Logger.log(`ERROR: ${error}`);
    };

}