
<?php

include 'callAPI.php';
include 'admin_token.php';
$contentBodyJson = file_get_contents('php://input');
$content = json_decode($contentBodyJson, true);
$locationId = $content['locationId'];

$baseUrl = getMarketplaceBaseUrl();
$admin_token = getAdminToken();
$customFieldPrefix = getCustomFieldPrefix();

//get admin ID
$url = $baseUrl . '/api/v2/users/';
$result = callAPI("GET", $admin_token['access_token'], $url, false);
$admin_id = $result['ID'];

$url = $baseUrl . '/api/v2/admins/' . $admin_id . '/variant-groups/' . $locationId .'/variants' ;
$result = callAPI("GET", $admin_token['access_token'], $url, false);
echo json_encode(['result' => $result]);
