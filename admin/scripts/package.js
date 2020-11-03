const scriptSrc = document.currentScript.src;
const protocol = window.location.protocol;
const packagePath = scriptSrc.replace("/scripts/package.js", "").trim();
const apiUrl = packagePath + "/upload.php";
const apiUrl_createrandom = packagePath + "/create_random.php";
const baseURL = window.location.hostname;

const token = getCookie('webapitoken');
var isValid = false;
let allcategories = [];
let allcustomfields = [];

function getCookie(name){
  var value = '; ' + document.cookie;
  var parts = value.split('; ' + name + '=');
  if (parts.length === 2) {
      return parts.pop().split(';').shift();
  }
}
function createCSV()
{
  // var data = { startdate: start, enddate: end };
  var apiUrl = packagePath + "/download.php";
  $.ajax({
    url: apiUrl,
    method: "POST",
    contentType: "application/json",
    // data: JSON.stringify(data),
    success: function (result)
    {
      // console.log(JSON.stringify(result));
      console.log("csv created");
    },
    error: function (jqXHR, status, err)
    {
      toastr.error("Error!");
    },
  });
}
function loadAllCategories()
{
  axios({
    method: "GET",
    url: `${protocol}//${baseURL}/api/v2/categories/`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((response) =>
  {
    if (response.data != null) {
      if (response.data.Records.length != 0) {

       $.each(response.data.Records, function (index, category)
       {
         allcategories.push(category['ID']);
 
       });
       
      }
     
    }
  })
}
function loadAllCustomFields()
{
  var adminID = $("#userGuid").val();
  axios({
    method: "GET",
    url: `${protocol}//${baseURL}/api/v2/admins/${adminID}/custom-field-definitions`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((response) =>
  {
    if (response.data != null) {
      if (response.data.Records.length != 0) {

        $.each(response.data.Records, function (index, customfield)
        {
         customfield['ReferenceTable'] == 'Items' ?  allcustomfields.push( { 'Code' : customfield['Code'], 'Name' : customfield['Name'] }) : '';
 
        });
       
      }
    }
  })
 

}
function numberRange (start, end) {
  return new Array(end - start).fill().map((d, i) => i + start);
}
$(document).ready(function ()
{
  createCSV();
  $("#formatlink").attr({
    href: packagePath + "/downloads?file=example.csv&contentType=text/csv",
    target: "_blank",
  });

  $("#formatlink").on("click", function ()
  {
    $(this).attr("download", "_Items.csv");
  });

  $("#download_failed").attr({
    href: packagePath + "/downloads?file=failed_imports.csv&contentType=text/csv",
    target: "_blank",
  });

  $("#download_failed").on("click", function ()
  {
    $(this).attr("download", "_Failed.csv");
  });

  loadAllCategories();
  loadAllCustomFields();
});

new Vue({
  el: "#app",
  data()
  {
    return {
      channel_name: "",
      channel_fields: [],
      channel_entries: [],
      parse_header: [],
      parse_csv: [],
      failed_results: "",
      sortOrders: {},
      sortKey: "",
      count: "",
      failedcount: 1,
      csvcontent: "",
      results: "",
      upload_error: [],
      variants_header: [],
      customfields_header: [],
      all_variants: [],
      all_customfield_header: [],
      all_customfields: [],
      media: [],
      failed_items: []
      //success_upload_items: ['1','2']
    };
  },
  filters: {
    capitalize: function (str)
    {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
  },
  methods: {
    sortBy: function (key)
    {
      var vm = this;
      vm.sortKey = key;
      vm.sortOrders[key] = vm.sortOrders[key] * -1;
    },
    csvJSON(csv)
    {
      var vm = this;

      var lines = csv.split("\n");
      lines.pop();
      // lines.unshift(counter);
      // csvcontent =  lines.shift();
      vm.count = lines.length - 1;
      vm.count = vm.count;
      var result = [];
      //for failed results,
      var failed_results = [];

      var headers = lines[0].split(",");
      vm.parse_header = lines[0].split(",");

      vm.csvcontent = lines;
      lines[0].split(",").forEach(function (key)
      {
        // counter++;
        vm.sortOrders[key] = 1;
      });

      lines.map(function (line, indexLine)
      {
        if (indexLine < 1) return; // Jump header line

        var obj = {};
        var currentline = line.split(",");

        headers.map(function (header, indexHeader)
        {
          obj[header] = currentline[indexHeader];
        });

        // console.log(obj['Item Name']);

        //validate if item name is empty
        if (obj['Item Name'] == '' || obj['Category ID'] == '' || obj['Merchant ID'] == '' || obj['Price'] == '') {
          failed_results.push(obj);
          vm.failedcount++;
        }
        result.push(obj);
       
      });

      // result.pop() // remove the last item because undefined values

      return result; // JavaScript object
    },
    loadCSV(e)
    {
      var vm = this;
      if (window.FileReader) {
        var reader = new FileReader();
        reader.readAsText(e.target.files[0]);
        // Handle errors load
        reader.onload = function (event)
        {

          var csv = event.target.result;
         
          vm.parse_csv = vm.csvJSON(csv);

          console.log(`all headers ${vm.parse_header}`);
        
          //vm.failedcount - 1;

        };
        reader.onerror = function (evt)
        {
          if (evt.target.error.name == "NotReadableError") {
            alert("Cannot read file !");
          }
        };
      } else {
        alert("FileReader are not supported in this browser.");
      }
      // console.log(vm.parse_csv);
      
    },
    onFailedItem: function (items)
    {
      var vm = this;
      let data = { 'failed': items, 'headers': vm.parse_header };
      axios({
        method: "POST",
        url: `${packagePath}/download_failed.php`,
        data: JSON.stringify(data)
      }).then((response) =>
      {
        console.log(response);
         
      }).catch(function (response)
      {
        //handle error
       
      });
    },
    onSuccess: function (itemID)
    {
      var vm = this;
      let data = { 'items': itemID };
      axios({
        method: "POST",
        url: `${packagePath}/save_imports.php`,
        data: JSON.stringify(data)
      }).then((response) =>
      {
        console.log(response);
         
      }).catch(function (response)
      {
        //handle error
        console.log(response);
       
      });
    },
    onUpload: function ()
    {
      var vm = this;
      
      let success_upload_items = [];
      //let success_upload_items = [];
      //get Variant's and Cf header indexes
      vm.parse_header.forEach((header, index) =>
      {
        header.includes('Variant') ? vm.variants_header.push(index) : '';
        header.includes('Custom') ? vm.customfields_header.push(index) : '';
        header.includes('Custom') ? vm.all_customfield_header.push(header) : '';
      });
      const variant_last_index = [...vm.variants_header].pop() + 1;
      const variant_first_index = [...vm.variants_header].shift();

      const custom_last_index = [...vm.customfields_header].pop() + 1;
      const custom_first_index = [...vm.customfields_header].shift();
        
      vm.csvcontent.shift();
      vm.csvcontent.forEach(function (line)
      {
        var items = line.split("\n");
        items.forEach(function (item)
        {
          var details = item.split(",");
          vm.all_variants = [];
          vm.all_customfields = [];
          vm.variants = [];
          vm.customfields = [];

          let error_count = 0;
          let all_categories = [];
          let invalid_categories_count = 0;
          let categories;
          

          !details[1].length == 0 ? categories = (details[1].split('/')) : categories = [];
         
          if (categories.length != 0 || categories != undefined || categories != '') {
            categories.forEach(function (categoryID)
            {
              allcategories.includes(categoryID) ? all_categories.push({ 'ID': categoryID }) : invalid_categories_count++;
            });
          }

          //variants
          numberRange(variant_first_index, variant_last_index).forEach(function (variant)
          {
            
            let variants = !details[variant] == 0 ? details[variant].split("/") : null;

            if (variants != null) {
              // vm.variants.push(details[variant]);

              variants.length == 3 ? vm.all_variants.push({ 'Variants': [{ 'ID': '', 'Name': variants[1], 'GroupName': variants[0] }], 'SKU': 'random', 'Price': '0', 'StockLimited': true, 'StockQuantity': variants[2] }) : '';
              variants.length == 5 ? vm.all_variants.push({ 'Variants': [{ 'ID': '', 'Name': variants[1], 'GroupName': variants[0] }, { 'ID': '', 'Name': variants[3], 'GroupName': $variants[2] }], 'SKU': 'random', 'Price': '0', 'StockLimited': true, 'StockQuantity': variants[4] }) : '';
              variants.length == 7 ? vm.all_variants.push({ 'Variants': [{ 'ID': '', 'Name': variants[1], 'GroupName': variants[0] }, { 'ID': '', 'Name': variants[3], 'GroupName': variants[2] }, { 'ID': '', 'Name': variants[5], 'GroupName': variants[4] }], 'SKU': 'random', 'Price': '0', 'StockLimited': true, 'StockQuantity': variants[6] }) : '';
            }
          
          });
          //custom fields
          let custom_counter = 0;
          numberRange(custom_first_index, custom_last_index).forEach(function (customfield)
          {

            var customfield_name = vm.all_customfield_header[custom_counter];
            customfield_name = customfield_name.substr(customfield_name.indexOf(" ") + 1).replace(/\s/g, ' ');
            
            let customfields_values = [];
            
            !details[customfield] == '' ? customfields_values.push(details[customfield].trim()) : '';

            let custom_code = allcustomfields.filter(custom => custom.Name == customfield_name.trim())

            let customfield_code = custom_code.length > 0 ? custom_code[0]['Code'] : '';

            vm.all_customfields.push({ 'Code': customfield_code, 'Values': customfields_values });

            custom_counter++;
        
          });
          //media
          numberRange(3, 8).forEach(function (media)
          {
            !details[media] == '' ? vm.media.push({ 'MediaUrl': details[media] }) : '';

          })

          //1. Validate empty fields
          switch (true) {
            case details[0] == '':
              error_count++
              vm.upload_error.push({ 'Name': details[2], 'error': 'Invalid merchant id', 'code': 'Failed' })
              vm.failed_items.push(item.split(","));
              break;
            case details[1] == '':
              error_count++
              vm.upload_error.push({ 'Name': details[2], 'error': 'Category is empty', 'code': 'Failed' })
              vm.failed_items.push(item.split(","));
              break;
            case invalid_categories_count != 0:
              vm.upload_error.push({ 'Name': details[2], 'error': `${invalid_categories_count} invalid category ID'/s`, 'code': 'Failed' })
              vm.failed_items.push(item.split(","));
              break;
            case details[2] == '':
              error_count++
              vm.upload_error.push({ 'Name': details[2], 'error': 'Item name is empty', 'code': 'Failed' })
              vm.failed_items.push(item.split(","));
              break;
            case details[11] == '':
              vm.upload_error.push({ 'Name': details[2], 'error': 'Price is empty', 'code': 'Failed' })
              vm.failed_items.push(item.split(","));
              break;
            
            default:

              var itemDetails = {
                'SKU': details[9],
                'Name': details[2],
                'BuyerDescription': details[8],
                'SellerDescription': details[8],
                'Price': details[11],
                'PriceUnit': null,
                'StockLimited': details[13],
                'StockQuantity': details[12],
                'IsVisibleToCustomer': true,
                'Active': true,
                'IsAvailable': '',
                'CurrencyCode': details[10],
                'Categories': all_categories,
                'ShippingMethods': null,
                'PickupAddresses': null,
                'Media': vm.media,
                'Tags': null,
                'CustomFields': vm.all_customfields,
                'ChildItems': vm.all_variants
              }
    
              var data = itemDetails;

              axios({
                method: "post",
                url: `${protocol}//${baseURL}/api/v2/merchants/${details[0]}/items/`,
                data: data,
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
                .then((response) =>
                {
                  vm.results = JSON.stringify(response);
                  // console.log(response.data);
                  success_upload_items.push(response.data.ID);

                  $(".data-loader").removeClass("active");
                  vm.upload_error.push({ 'Name': details[2], 'error': '', 'code': 'Success' })
                
                })
                .catch(function (response)
                {
                  //handle error
                  // console.log(response);
                });
          }

        })
       
      })
      let data = { 'items': success_upload_items };
      axios({
        method: "POST",
        url: `${packagePath}/save_imports.php`,
        data: JSON.stringify(data)
      }).then((response) =>
      {
        console.log(response);
         
      }).catch(function (response)
      {
        //handle error
        console.log(response);
       
      });



      //send failed items for download
      vm.onFailedItem(vm.failed_items);
      //send successful upload for revert
      console.log(success_upload_items);

  
     
      // vm.onSuccess(success_upload_items);
    }
   

  },
  watch: {
    messages: function (val, oldVal)
    {
      // $(".table").find("tbody tr:last").hide();
      //Scroll to bottom
    },
  },
});
