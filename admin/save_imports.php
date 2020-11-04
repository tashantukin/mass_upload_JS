<?php
$contentBodyJson = file_get_contents('php://input');
$content = json_decode($contentBodyJson, true);
$items_id = $content['items'];
$dirItems =  realpath("downloads/uploaded_items.csv");
$fh_items = fopen($dirItems, 'w');
echo json_encode(['result' => $items_id]);


foreach ($items_id as $id) {
    fputcsv($fh_items, $id);
}
//close file stream
fclose($fh_items);

// $csv = array_map('str_getcsv', file('data.csv')
