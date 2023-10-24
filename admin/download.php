<?php
include 'callAPI.php';
include 'admin_token.php';
$contentBodyJson = file_get_contents('php://input');
$content = json_decode($contentBodyJson, true);

$baseUrl = getMarketplaceBaseUrl();
$admin_token = getAdminToken();
$customFieldPrefix = getCustomFieldPrefix();
// Query to get marketplace id
$url = $baseUrl . '/api/v2/marketplaces/';
$marketplaceInfo = callAPI("GET", null, $url, false);

$url = $baseUrl . '/api/developer-packages/custom-fields?packageId=' . getPackageID();
$packageCustomFields = callAPI("GET", null, $url, false);

//get admin ID
$url = $baseUrl . '/api/v2/users/';
$result = callAPI("GET", $admin_token['access_token'], $url, false);
$admin_id = $result['ID'];

$random_merchant = [];
$random_category = [];
$random_limit = ['True', 'False'];

$currencycode = $marketplaceInfo['CurrencyCode'];
// print_r($currencycode);

// 1. get all merchant id's
$url = $baseUrl . '/api/v2/admins/' . $admin_id . '/users/?role=merchant';
$result = callAPI("GET", $admin_token['access_token'], $url, false);
foreach ($result['Records'] as $merchants) {
  $merchant_id =  $merchants['ID'];
  // print_r($merchant_id);
  $random_merchant[] = $merchant_id;
}

var_dump($random_merchant);
//2. get all category id's
$url = $baseUrl . '/api/v2/admins/' . $admin_id . '/categories';
$result = callAPI("GET", $admin_token['access_token'], $url, false);
foreach ($result['Records'] as $category) {
  $category_id =  $category['ID'];
  $random_category[] = $category_id;
}
var_dump($random_category);

$dirItems =  realpath("downloads/example.csv");

$fh_items = fopen($dirItems, 'w');
echo json_encode(['cat' => $random_category]);
echo json_encode(['merch' => $random_merchant]);


//ADDING CUSTOM FIELDS

$customfield_headers = [];
$url = $baseUrl . '/api/v2/admins/' . $admin_id . '/custom-field-definitions';
$result = callAPI("GET", $admin_token['access_token'], $url, false);
foreach ($result['Records'] as $customfield) {
  //validate if the custom field is referenced for Items
  $referencetable  =  $customfield['ReferenceTable'];

  $referencetable == 'Items' ? $customfield_headers[] = 'Custom ' .  $customfield['Name'] : '';
}

$default_headers = array('Merchant ID', 'Category ID', 'Item Name', 'Image 1', 'Image 2', 'Image 3', 'Image 4', 'Image 5', 'Item Description', 'SKU', 'Tags', 'Price', 'Stock Quantity', 'Stock Limited', 'Weight', 'Length', 'Width', 'Height', 'Variant 1', 'Variant 2', 'Variant 3');

$all_headers = $default_headers;

// generate headers
fputcsv($fh_items, $all_headers);

for ($x = 1; $x <= 10; $x++) {

  // $itemID = '*';
  $merchants_id = $random_merchant[array_rand($random_merchant)];
  $cats_id = 'sneakers';
  $item_name = 'Sample new Item ' . time() . $x;
  $image_1 = 'https://down-my.img.susercontent.com/file/sg-11134201-23030-64aodgrnygov67';
  $image_2 = 'https://img.giglio.com/images/prodPage/E18077.001_1.jpg';
  $image_3 = 'https://havanna-shoes.dk/cdn/shop/files/TRINITY_BEIGE2_jpg.png?v=1687247781';
  $image_4 = 'sample url link';
  $image_5 = 'sample url link';
  $item_desc = 'Item Description, supports, adding, a comma now' . $x;
  $SKU = 'Item SKU ' . $x;
  $currency = 'Tag ' . $x ;
  $price = 0;
  $stock_qty = 10 * $x;
  //$stock_limited = $random_limit[array_rand($random_limit)];
  $weight = 'parent item weight';
  $length = 0;
  $width = 0;
  $height = 0;
  $variant1 = 'Color/Red/Size/M/Type/B/STOCKS/10/SKU/1/2/2/1';
  $variant2 = 'Color/Blue/Size/S/Type/A/STOCKS/10/SKU/1/2/3/1';
  $variant3 = 'Color/Green/Size/L/Type/A/STOCKS/10/SKU/1/2/3/1';

  $itemsRows = array($merchants_id,  $cats_id, $item_name, $image_1, $image_2, $image_3,  $image_4, $image_5, $item_desc, $SKU, $currency, $price, $stock_qty,  $weight, $length,  $width, $height, $variant1, $variant2, $variant3);
  fputcsv($fh_items,  $itemsRows);

  echo json_encode(['rows' => $itemsRows]);
}
fclose($fh_items);
