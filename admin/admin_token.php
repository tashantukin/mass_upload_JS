<?php 
function getAdminToken() {
    $marketplace = $_COOKIE["marketplace"];
    $protocol = $_COOKIE["protocol"];

    $baseUrl = $protocol . '://' . $marketplace;
    $client_id = '2tDzpHVPz6e0370Y3TrQpuso65dlhSCqsCrqcpCw';
    $client_secret = '1SXrbk56Zw_TKsIASWsC7Wd5Ny9G7XMI4XEuMLAKyY90cx2qc5Z';

    $url = $baseUrl . '/token';
    $body = 'grant_type=client_credentials&client_id=' . $client_id . '&client_secret=' . $client_secret . '&scope=admin';

    $curl = curl_init();

    curl_setopt($curl, CURLOPT_POST, 1);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

    $result = curl_exec($curl);
    curl_close($curl);

    return json_decode($result, true);
}

 ?>