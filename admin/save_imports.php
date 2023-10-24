<?php
$contentBodyJson = file_get_contents('php://input');
$content = json_decode($contentBodyJson, true);
$items_id = $content['items'];
$dirItems =  realpath("downloads/uploaded_items.csv");
$fh_items = fopen($dirItems, 'w');

fputcsv($fh_items, $items_id);
//$all_items = [];
// foreach ($items_id as $id) {

//     //$all_items[] = $id;

// }

//echo json_encode(['result' => $all_items]);
//close file stream
fclose($fh_items);
