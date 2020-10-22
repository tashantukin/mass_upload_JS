const scriptSrc = document.currentScript.src;
const protocol = window.location.protocol;
const packagePath = scriptSrc.replace("/scripts/package.js", "").trim();
const apiUrl = packagePath + "/upload.php";
const apiUrl_createrandom = packagePath + "/create_random.php";
var baseURL = window.location.hostname;
        var adminID = $("#userGuid").val();
        var token = getCookie('webapitoken');

function getCookie(name){
  var value = '; ' + document.cookie;
  var parts = value.split('; ' + name + '=');
  if (parts.length === 2) {
      return parts.pop().split(';').shift();
  }
}

$("body").on("click", "#createrandom", function ()
{
  createrandom();
});

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

// function addItem(item)
// {
//   item.forEach(function (detail)
//   {
//     var merchantID = detail[0];
//     console.log(merchantID);
//   })
 
// }



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
      failedcount: 0,
      csvcontent: "",
      results: "",
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
      // lines.unshift(counter);
      // csvcontent =  lines.shift();
      vm.count = lines.length - 1;
      vm.count = vm.count - 1;
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

        console.log(obj['Item Name']);

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
          vm.failedcount - 1;

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
      vm.csvcontent.forEach(function (line)
      { 
        var items = line.split("\n");
        items.forEach(function (item)
        {
          var details = item.split(",");
          // console.log(details);
          console.log(details[0]);  

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
            'Categories': [{ 'ID': details[1] }],
            'ShippingMethods' : null,
            'PickupAddresses' : null,
            'Media':null,
            'Tags' : null,
            'CustomFields' : null,
            'ChildItems' : null
          }
          var data = itemDetails;
          console.log(`${protocol}//${baseURL}/api/v2/merchants/${details[0]}/items/`);
      axios({
        method: "post",
        url: `${protocol}//${baseURL}/api/v2/merchants/${details[0]}/items/`,
        data: data,
        headers: {
          'Authorization': `Bearer ${token}`
        }
        
        // config: { headers: {'Content-Type': 'multipart/form-data' }}
      })
        .then((response) =>
        {
          // vm.results = JSON.parse(response.data).result; //original
          vm.results = JSON.stringify(response);
          console.log('results ' + vm.results);
          $(".data-loader").removeClass("active");

          // this.$nextTick(() =>
          // {
          //   $(".table").find("tbody tr:last").hide();
          //   // Scroll Down
          // });
        })
        .catch(function (response)
        {
          //handle error
          console.log(response);
        });


        })

      })

        // splits = splits.split("\n")
   

    },
  },
  watch: {
    messages: function (val, oldVal)
    {
      $(".table").find("tbody tr:last").hide();
      //Scroll to bottom
    },
  },
});
