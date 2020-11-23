<?php
$contentBodyJson = file_get_contents('php://input');
$content = json_decode($contentBodyJson, true);
$csv_header = preg_replace('/(^|;)"([^"]+)";/','$1$2;', $content['headers']);  
$success_items =  $content['success'];
//open file stream
$dirItems =  realpath("downloads/success_imports.csv");
$fh_items = fopen($dirItems, 'w');
fputcsv($fh_items, $csv_header);

foreach ($success_items as $success) {
    // generate csv files for failed items
    //add all item fields
    fputcsv($fh_items,  preg_replace('/(^|;)"([^"]+)";/','$1$2;',$success));
}
//close file stream
fclose($fh_items);
