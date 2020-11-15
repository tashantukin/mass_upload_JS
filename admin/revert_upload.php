<?php
$dirItems =  realpath("downloads/uploaded_items.csv");

$file = fopen($dirItems, "r");
echo json_encode(['result' => $file]);
// print_r(fgetcsv($file));
fclose($file);




// Open the file for reading
// $all_items = [];
// if (($h = fopen($dirItems, "r")) !== FALSE) {
//     // Convert each line into the local $data variable
//     while (($data = fgetcsv($h, 1000)) !== FALSE) {
//         $all_items[] = $data;
//         // Read the data from a single line
//     }

//     // Close the file
//     fclose($h);
//     echo json_encode(['result' => $all_items]);
// }







// $csv = array_map('str_getcsv', file($dirItems));
