<?php
$dirItems =  realpath("downloads/uploaded_items.csv");

$file = fopen($dirItems, "r");
echo json_encode(['result' => $file]);
// print_r(fgetcsv($file));
fclose($file);
