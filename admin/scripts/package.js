const scriptSrc = document.currentScript.src;
const protocol = window.location.protocol;
const packagePath = scriptSrc.replace("/scripts/package.js", "").trim();
const apiUrl = packagePath + "/upload.php";
const apiUrl_createrandom = packagePath + "/create_random.php";
const baseURL = window.location.hostname;
const adminID = $("#userGuid").val();
const token = getCookie('webapitoken');
var isValid = false;
let allcategories = [];

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
      upload_error: []
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
    onUpload: function ()
    {
      var vm = this;
     
      // console.log(vm.csvcontent);

      // var splits = vm.csvcontent[0].split("\n");
      vm.csvcontent.shift();
      // vm.csvcontent.pop();
      vm.csvcontent.forEach(function (line)
      { 
        var items = line.split("\n");
        items.forEach(function (item)
        {
          var details = item.split(",");
          
          let error_count = 0;
          let all_categories = [];
          let invalid_categories_count = 0;
          let categories;

          console.log(`all categories ${allcategories}`);

         !details[1].length == 0  ? categories = (details[1].split('/')) : categories = [];
          console.log(categories);

          if (categories.length != 0 || categories != undefined || categories != '') {
            categories.forEach(function (categoryID)
            {
            allcategories.includes(categoryID) ? allcategories.push({ 'ID': categoryID }) : invalid_categories_count++;
            })
  
          }
         
          //1. Validate empty fields
      
          switch (true) {
            case details[0] == '':
              error_count++
              vm.upload_error.push({ 'Name': details[2], 'error': 'Invalid merchant id', 'code': 'Failed' })
              break;
            case details[1] == '':
              error_count++
              vm.upload_error.push({ 'Name': details[2], 'error': 'Category is empty', 'code': 'Failed' })
              break;
            case invalid_categories_count != 0:
              vm.upload_error.push({ 'Name': details[2], 'error': `${invalid_categories_count} invalid category ID'/s`, 'code': 'Failed' })
              break;
            
            case details[2] == '':
              error_count++
              vm.upload_error.push({ 'Name': details[2], 'error': 'Item name is empty', 'code': 'Failed' })
              break;
            case details[11] == '':
              vm.upload_error.push({ 'Name': details[2], 'error': 'Price is empty', 'code': 'Failed' })
              break;
            
            default:

              var itemDetails = {
                'SKU': details[9],
                'Name': details[2],
                'BuyerDescription' : details[8],
                'SellerDescription': details[8],
                'Price' :  details[11],
                'PriceUnit' : null,
                'StockLimited' : details[13],
                'StockQuantity' : details[12],
                'IsVisibleToCustomer' : true,
                'Active' : true,
                'IsAvailable' :'',
                'CurrencyCode' : details[10],
                'Categories': all_categories,
                'ShippingMethods' : null,
                'PickupAddresses' : null,
                'Media':null,
                'Tags' : null,
                'CustomFields' : null,
                'ChildItems' : null
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
   
    },
  },
  watch: {
    messages: function (val, oldVal)
    {
      // $(".table").find("tbody tr:last").hide();
      //Scroll to bottom
    },
  },
});
