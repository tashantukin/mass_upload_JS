<?php
$contentBodyJson = file_get_contents('php://input');
$content = json_decode($contentBodyJson, true);
$csv_header = $content['headers'];
$failed_items =  $content['failed'];
//open file stream
$dirItems =  realpath("downloads/failed_imports.csv");
$fh_items = fopen($dirItems, 'w');
fputcsv($fh_items, $csv_header);

foreach ($failed_items as $failed) {
    // generate csv files for failed items
    //add all item fields
    fputcsv($fh_items, $failed);
}
//close file stream
fclose($fh_items);
