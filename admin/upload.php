<?php
include 'callAPI.php';
include 'admin_token.php';
$contentBodyJson = file_get_contents('php://input');
$content = json_decode($contentBodyJson, true);
// date_default_timezone_set($timezone_name);
$timestamp = date("d/m/Y H:i");

$baseUrl = getMarketplaceBaseUrl();
$GLOBALS['baseUrl'] = $baseUrl;
$admin_token = getAdminToken();
$GLOBALS['admin_token '] = $admin_token;
$customFieldPrefix = getCustomFieldPrefix();
// Query to get marketplace id
$url = $baseUrl . '/api/v2/marketplaces/';
$marketplaceInfo = callAPI("GET", null, $url, false);
// Query to get package custom fields
$url = $baseUrl . '/api/developer-packages/custom-fields?packageId=' . getPackageID();
$packageCustomFields = callAPI("GET", null, $url, false);
$csvdata = $content['data'];

//get admin ID
$url = $baseUrl . '/api/v2/users/';
$result = callAPI("GET", $admin_token['access_token'], $url, false);
$admin_id = $result['ID'];

function get_http_response_code($domain1)
{
  $headers = get_headers($domain1);
  return substr($headers[0], 9, 3);
}
$categoryfound = 0;
function isCategoryValid($catID)
{
  $url =  $GLOBALS['baseUrl'] . '/api/v2/categories';
  $result =  callAPI("GET", $GLOBALS['admin_token']['access_token'], $url, false);
  foreach ($result['Records'] as $categoryId) {
    // echo json_encode(['cat1' =>  $catID]); 
    if ($categoryId['ID'] == $catID) {
      return true;
    }
    continue;
  }
}
function isShippingValid($shippingId, $merchantId)
{
  $url =  $GLOBALS['baseUrl'] . '/api/v2/merchants/' . $merchantId . '/shipping-methods/';
  $result =  callAPI("GET", $GLOBALS['admin_token']['access_token'], $url, false);
  foreach ($result['Records'] as $shippingID) {
    if ($shippingID['ID'] == $shippingId) {
      return true;
    }
    continue;
  }
}
$csv = array_map('str_getcsv', $csvdata);

//header management

//loop through each headers for Customfields
$all_headers = [];
$all_customfields = [];
$headers_line = [];
$headers_indexes = [];
foreach ($csv[0] as $index => $header) {

  strpos($header, 'Custom') !== false ? $headers_line[] = $header . ' ' .  $index : '';
  $all_headers[] = $header;
}
//get starting index of the custom fields
$custom_start = explode(' ', current($headers_line));
$custom_start_index = $custom_start[2];
$headers_indexes[] = $custom_start_index;
//get the ending index of the custom fields
$custom_end = explode(' ', end($headers_line));
$custom_end_index = $custom_end[2];

$headers_indexes[] = $custom_end_index;

//header management ends

//Variants header management
$variants_line = [];
$variants_indexes = [];

foreach ($csv[0] as $index => $header) {

  strpos($header, 'Variant') !== false ? $variants_line[] = $index : '';
}
$variant_start_index = current($variants_line);
$variant_end_index = end($variants_line);

//Variants header management ends

array_shift($csv); //remove the headers $csv = 
$upload_result = [];

$upload_counter = 0;
$success_counter = 0;
$failed_counter = 0;

$dirItems =  realpath("downloads/failed_imports.csv");
$fh_items = fopen($dirItems, 'w');
fputcsv($fh_items, $all_headers);

foreach ($csv as $line) {

  $all_variants = [];

  $upload_error = [];
  $category_error_count = 0;
  $shipping_error_count = 0;
  $allimages = [];
  $allvariants = [];
  $child_items = [];

  //category check
  $categories  = !strlen($line[1]) == 0 ? explode('/', $line[1]) : $category_error_count++;
  $allcategories = [];
  foreach ($categories as $category) {
    isCategoryValid($category) ? $allcategories[] = array('ID'  =>  $category) : $category_error_count++;
    $failed_counter++;
  }

  //image check
  foreach (range(3, 7) as $eachimage) {
    !strlen($line[$eachimage]) == 0 ?  $allimages[] = array('MediaUrl' => $line[$eachimage]) : '';
  }
  //check if no images found
  empty($allimages) ? $upload_error[] = 'No Media found.' : '';
  $category_error_count != 0 ? $upload_error[] = $category_error_count . ' Category ID error/s found' : '';
  $shipping_error_count != 0 ? $upload_error[] = $shipping_error_count . ' Shipping ID error/s found' : '';

  //variants
  foreach (range($variant_start_index, $variant_end_index) as $eachvariant) {

    $variants = !strlen($line[$eachvariant]) == 0 ? explode('/', $line[$eachvariant]) : null;

    if ($variants != null) {

      count($variants) == 3 ?  $allvariants[] = array('Variants' => [array('ID' => '', 'Name' => $variants[1], 'GroupName' => $variants[0])], 'SKU' => 'random', 'Price' => '0', 'StockLimited' => true, 'StockQuantity' => $variants[2]) : '';
      count($variants) == 5 ?  $allvariants[] = array('Variants' => [array('ID' => '', 'Name' => $variants[1], 'GroupName' => $variants[0]), array('ID' => '', 'Name' => $variants[3], 'GroupName' => $variants[2])],  'SKU' => 'random', 'Price' => '0', 'StockLimited' => true, 'StockQuantity' => $variants[4]) : '';
      count($variants) == 7 ?  $allvariants[] = array('Variants' => [array('ID' => '', 'Name' => $variants[1], 'GroupName' => $variants[0]), array('ID' => '', 'Name' => $variants[3], 'GroupName' => $variants[2]), array('ID' => '', 'Name' => $variants[5], 'GroupName' => $variants[4])],  'SKU' => 'random', 'Price' => '0', 'StockLimited' => true, 'StockQuantity' => $variants[6]) : '';
    }

    $all_variants[] = $line[$eachvariant];
  }
  //Custom Fields
  $custom_fields = [];
  $all_custom_fields = [];
  $counter = 0;
  foreach (range($custom_start_index, $custom_end_index) as $customfield) {

    $all_customfields[] = $line[$customfield];

    $customfield_code;

    $custom_details = explode(' ', $headers_line[$counter]);

    $customfield_name_header = $custom_details[1];
    //get the custom field code referencing the header name
    $url = $baseUrl . '/api/v2/admins/' . $admin_id . '/custom-field-definitions';
    $result = callAPI("GET", $admin_token['access_token'], $url, false);

    foreach ($result['Records'] as $customfields) {
      //validate if the custom field is referenced for Items
      $customfield_name  =  $customfields['Name'];
      if ($customfield_name_header == $customfield_name) {
        $customfield_code = $customfields['Code'];
        break;
      }
    }
    //insert validations here for each custom fields

    $custom_fields[] = array('Code' => $customfield_code, 'Values' => array($line[$customfield]));

    $counter++;
  }

  //validate empty fields, 
  // do not upload
  // generate csv files for failed items

  if ($line[0] == '' || $line[2] == '' || $line[11] == '' || $line[1] == '') {
    if ($line[1] == '') {
      $upload_error[] = '';
    } else {
      $upload_error[] = 'Merchant ID, Item Name, Category or Price cannot be blank.';
    }

    $upload_result[0]['Total'] = $upload_counter;

    $upload_result[] = array('Name' => $line[2], 'Error' => $upload_error, 'code' =>  'Failed');


    // generate csv files for failed items
    //add all item fields
    $merchants_id = $line[0];
    $cats_id =  $line[1];
    $item_name = $line[2];
    $image_1 = $line[3];
    $image_2 = $line[4];
    $image_3 = $line[5];
    $image_4 = $line[6];
    $image_5 = $line[7];
    $item_desc = $line[8];
    $SKU = $line[9];
    $currency = $line[10];
    $price = $line[11];
    $stock_qty = $line[12];
    $stock_limited = $line[13];

    $default_rows = array($merchants_id,  $cats_id, $item_name, $image_1, $image_2, $image_3,  $image_4, $image_5, $item_desc, $SKU, $currency, $price, $stock_qty, $stock_limited);

    $all_rows = array_merge($default_rows, $all_variants, $all_customfields);

    fputcsv($fh_items, $all_rows);
  } else {
    $item_details = array(
      'SKU' =>  $line[9],
      'Name' => $line[2],
      'BuyerDescription' => $line[8],
      'SellerDescription' => $line[8],
      'Price' => $line[11],
      'PriceUnit' => null,
      'StockLimited' => $line[13],
      'StockQuantity' =>  $line[12],
      'IsVisibleToCustomer' => true,
      'Active' => true,
      'IsAvailable' => '',
      'CurrencyCode' =>  $line[10],
      'Categories' =>  $allcategories,
      'ShippingMethods'  => null,
      'PickupAddresses' => null,
      'Media' => $allimages,
      'Tags' => null,
      'CustomFields' => $custom_fields,
      'ChildItems' => $allvariants,

    );

    $url =  $baseUrl . '/api/v2/merchants/' . $line[0] . '/items';
    $result =  callAPI("POST", $admin_token['access_token'], $url, $item_details);
    $result1 = json_encode(['err' => $result]);


    $upload_counter++;
    $itemresult =  array_key_exists("Message", $result) ? $result['InnerErrors'][0]['Message'] : 'Success'; //if meerchant ID is invalid

    $upload_result[] = array('Name' => $line[2], 'Error' => $upload_error, 'code' =>  $itemresult);
  }
}

fclose($fh_items);
$upload_result[0]['Total'] = $upload_counter;
echo json_encode(['result' => $upload_result]);
