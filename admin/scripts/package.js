const scriptSrc = document.currentScript.src;
const protocol = window.location.protocol;
const packagePath = scriptSrc.replace("/scripts/package.js", "").trim();
const apiUrl = packagePath + "/upload.php";
const apiUrl_createrandom = packagePath + "/create_random.php";
const baseURL = window.location.hostname;
var locationId;

const token = getCookie('webapitoken');
var isValid = false;
let allcategories = [];
let allcustomfields = [];
let allLocationVariants = [];
let categoryData = [];
let parentMerchantId =  "";


function getCookie(name){
  var value = '; ' + document.cookie;
  var parts = value.split('; ' + name + '=');
  if (parts.length === 2) {
      return parts.pop().split(';').shift();
  }
}
function isNumeric(num){
  return !isNaN(num)
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
         categoryData.push({'ID': category['ID'], 'Name' : category['Name'] })

         console.log(categoryData)
       });
       
      }
     
    }
  })
}

function findCategoryId(categoryName){

  return categoryData.find(item => {
    return item.Name.toLowerCase() == categoryName
 })
}

function loadLocationVariants(locationId)
{
  var data = { locationId };
  $.ajax({
    url: packagePath + "/get_variants.php",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    success: function (response)
    {
      
      custom = $.parseJSON(response);
      console.log(custom.result)
      
             $.each(custom.result, function (index, variant)
             {
              
               allLocationVariants.push({ 'Name': variant['Name'], 'ID' : variant['ID']});
       
             });
      console.log({ allLocationVariants });
     

     
    },
  });

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

function getMarketplaceCustomFields(callback)
{
  var apiUrl = "/api/v2/marketplaces";
  $.ajax({
    url: apiUrl,
    method: "GET",
    contentType: "application/json",
    success: function (result)
    {
      if (result) {
        callback(result.CustomFields);
      }
    },
  });
}

function numberRange (start, end) {
  return new Array(end - start).fill().map((d, i) => i + start);
}
$(document).ready(function ()
{
  createCSV();

  getMarketplaceCustomFields(function(result) {
    $.each(result, function(index, cf) {
        if (cf.Name == 'Location ID' ) {
             code = cf.Code;
            locationId = cf.Values[0]; 
          loadLocationVariants(locationId);
        }
        
    })
  });
  


  
  
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

  $("#download_success").attr({
    href: packagePath + "/downloads?file=success_imports.csv&contentType=text/csv",
    target: "_blank",
  });

  $("#download_success").on("click", function ()
  {
    $(this).attr("download", "_Success.csv");
  });
//for testing only
  $("#download_id").attr({
    href: packagePath + "/downloads?file=uploaded_items.csv&contentType=text/csv",
    target: "_blank",
  });

  $("#download_id").on("click", function ()
  {
    $(this).attr("download", "_success_id.csv");
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
      count: 0,
      current_count: 0,
      failedcount: 1,
      csvcontent: "",
      results: "",
      upload_error: [],
      variants_header: [],
      customfields_header: [],
      all_variants: [],
      all_customfield_header: [],
      all_customfields: [],
      all_items: [],
      //tags
      tags_header: [],
      all_tags: [],
      media: [],
      failed_items: [],
      success_items: [],
      item_success: [], 
      success_all: 0,
      failed_all: 0,
      isActive: false,
      isUpload: "",
      success_upload: [],
      revert_counter: 0,
      revert_total: 0,
      isPriceValid: 1,
      invalidPriceCount: 0,
      invalidCategoryCount: 0,
      parentMerchantId: "",
      noImage: 0
      
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
    parseCSV: function (data)
    {
      var allTextLines = data.split(/\r\n|\n/);
      var entries = allTextLines[0].split(',');
      console.log(entries);
      return entries;
    },

    async callItemsAPI(merchantID, data, action)
    {
      try {
        vm = this;
        const response = await axios({
          method: action,
          url: action == 'POST' ? `${protocol}//${baseURL}/api/v2/merchants/${merchantID}/items/` : `${protocol}//${baseURL}/api/v2/merchants/${merchantID}/items/${data}`,
          data: data,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const items = await response
        action == 'DELETE' ? vm.revert_counter++ : '';
        console.log(`${vm.revert_counter} - ${vm.revert_total}`);
          vm.revert_total ==  vm.revert_counter ? $('#brnd_preloader').hide() : '';
        // console.log('res ' + JSON.stringify(items));
        return items
       
      } catch (error) {
        console.log("error", error);
      }
      },

    async uploadBulk(merchantID, data, action){
      try {
        vm = this;
        const response = await axios({
          method: action,
          url: action == 'POST' ? `${protocol}//${baseURL}/api/v2/merchants/${merchantID}/items/bulk-create` : '',
          data: data,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const items = await response
        action == 'DELETE' ? vm.revert_counter++ : '';
        console.log(`${vm.revert_counter} - ${vm.revert_total}`);
          vm.revert_total ==  vm.revert_counter ? $('#brnd_preloader').hide() : '';
        // console.log('res ' + JSON.stringify(items));
        return items
       
      } catch (error) {
        console.log("error", error);
      }

    },

    csvJSON(csv)
    {
      var vm = this;

      var lines = csv.data //csv.split("\n")
      console.log({ lines });
       lines.pop();
     
      vm.count = lines.length;
     
      var result = [];
      //for failed results,
      var failed_results = [];

      var headers = csv.meta['fields']
      console.log({headers})
      vm.parse_header = headers;

      vm.csvcontent = lines;

        headers .forEach(function (key)
      {
        // counter++;
        vm.sortOrders[key] = 1;
        });
      
      $.each(lines, function (i, el)
      {
      
        result.push(el);
        vm.parentMerchantId = el['Merchant ID'];
    
          //validate if item name is empty
        if ((el['Item Name'] == '' || el['Item Name'] == null) || (el['Category ID'] == '' || el['Category ID'] == null) || (el['Merchant ID'] == '' || el['Stock Quantity'] == '')) {
          // el['Merchant ID'] == null) || (el['Price'] == '' ||  el['Price'] == null 
          failed_results.push(el);
          vm.failedcount++;
          vm.failed_all++;
        }
        if (!isNumeric(el['Price'])) {
         // vm.isPriceValid = 0;
          vm.invalidPriceCount++;
        
        }

        !el['Category ID'].length == 0 ? categories = (el['Category ID'].split('/')) : categories = [];
        if (categories.length != 0 || categories != undefined || categories != '') {
          categories.forEach(function (categoryID)
          {
            //console.log({categoryID})

            
            let categoryId = findCategoryId(categoryID.toLowerCase());

            console.log({categoryId})

            if(!categoryId) {
              //allcategories.includes(categoryId.ID) ? all_categories.push({ 'ID': categoryId.ID }) :  vm.invalidCategoryCount++;
              vm.invalidCategoryCount++
              vm.failed_all++;
            }
           // }else {
             
           // }

           if ( el['Image 1'] == null && el['Image 2'] == null  && el['Image 3'] == null && el['Image 4'] == null &&  el['Image 5'] == null ){

             vm.failedcount++;
             vm.failed_all++;
           }
          
            
          });
        }
      })
    

      return result; // JavaScript object
    },
    loadCSV(e)
    {
      var vm = this;
      var file = e.target.files[0];
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
          data = results;
          console.log({data});
          vm.parse_csv = vm.csvJSON(data);

         
        }
      });

      
      vm.upload_error = [];
      // var rowpos = $('#item_list tr:last').position();
      // $('.csv-extractor').scrollTop(rowpos.top);
      // console.log(vm.parse_csv);
      
    },
    onRevert()
    {
      $('#brnd_preloader').show();
      var vm = this;
      $.ajax({
        type: "GET",
        url: `${packagePath}/downloads?file=uploaded_items.csv&contentType=text/csv`,
        dataType: "text",
        success: function (data)
        {
          let itemIDs = vm.parseCSV(data);
          //delete the items
          vm.onDelete(itemIDs);
        },
        error: function (jqXHR, status, err)
        {
          console.log(err);
        }
     });
    },
    onDelete(data)
    {
      var vm = this;
      vm.revert_total = data.length;
      data.forEach((item) =>
      {
        let itemInfo = item.split("/");
        vm.callItemsAPI(itemInfo[1], itemInfo[0], "DELETE")
      });
     
    },
    onFailedItem: function (items)
    {
      var vm = this;
      console.log(vm.parse_header);
    
    //  vm.parse_header = vm.parse_header[x] = vm.parse_header[x].replace('"', '');
      console.log(vm.parse_header);
      console.log(items);
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

    onSuccessItem: function (items)
    {
      var vm = this;
      console.log(vm.parse_header);
    
    //  vm.parse_header = vm.parse_header[x] = vm.parse_header[x].replace('"', '');
      console.log(vm.parse_header);
      console.log(items);
      let data = { 'success': items, 'headers': vm.parse_header };
      axios({
        method: "POST",
        url: `${packagePath}/download_success.php`,
        data: JSON.stringify(data)
      }).then((response) =>
      {
        console.log(response);
         
      }).catch(function (response)
      {
        //handle error
       
      });
    },

    onItemSuccess: function (itemID)
    {
      let data = { 'items': itemID };
      axios({
        method: "POST",
        url: `${packagePath}/save_imports.php`,
        data: JSON.stringify(data)
      }).then((response) =>
      {
        // console.log(response);
      //  vm.onRevert();
         
      }).catch(function (response)
      {
      });

    },
    onUpload: function ()
    {
      var vm = this;
      vm.isUpload = true
      var rowpos = $('#item_list tr:first').position();
      $('.csv-extractor').scrollTop(rowpos.top);

      //disable the table
      $(".csv-extractor").prop("disabled", true);
      $(".data-loader").addClass("active");
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
    
      
      var allPromises = [];
    
   
      vm.csvcontent.forEach(function (line)
      {
        
        var items = line;
        //var allItems = [];
        
          vm.isActive = true
          vm.current_count++;
      
          var details = items;
          console.log({ details });
          vm.all_variants = [];
          vm.all_customfields = [];
          vm.variants = [];
          vm.customfields = [];
          vm.media = [];

          let error_count = 0;
          let all_categories = [];
          let invalid_categories_count = 0;
          let categories;
          
          !details['Category ID'].length == 0 ? categories = (details['Category ID'].split('/')) : categories = [];
         
          if (categories.length != 0 || categories != undefined || categories != '') {
            categories.forEach(function (categoryID)
            {
              //console.log({categoryID})
              let categoryId = findCategoryId(categoryID.toLowerCase());

              console.log({categoryId})

              if(categoryId) {
                allcategories.includes(categoryId.ID) ? all_categories.push({ 'ID': categoryId.ID }) : invalid_categories_count++;
              }
            
              
            });
          }
          //variants
          numberRange(variant_first_index, variant_last_index).forEach(function (variant)
          {
            
            let variants = !details[Object.keys(details)[variant]] == 0 ? details[Object.keys(details)[variant]].split("/") : null;

            //console.log(`var len ${variants.length}`);
           // console.log(`${variants[3]}`)
           // console.log(`${variants[5]}`)
           // console.log(`${variants[7]}`)

            if (variants != null) {

              variants.length == 9 ? vm.all_variants.push({ 'Variants': [{ 'ID': '', 'Name': variants[1], 'GroupName': variants[0] }], 'SKU': variants[4] , 'Price': isNaN(variants[3]) == false ? variants[3] : 0, 'StockLimited': true, 'StockQuantity': isNaN(variants[2]) == false ? variants[2] :0, 'Weight': isNaN(variants[8]) == false ? variants[8] : 0, 'Length': isNaN(variants[5]) == false ? variants[5] : 0, 'Width': isNaN(variants[6]) == false ?  variants[6] : 0 , 'Height' : isNaN(variants[7]) == false ? variants[7] : 0   }) : '';
              variants.length == 11 ? vm.all_variants.push({ 'Variants': [{ 'ID': '', 'Name': variants[1], 'GroupName': variants[0] }, { 'ID': '', 'Name': variants[3], 'GroupName': variants[2] }],  'SKU': variants[6], 'Price': isNaN(variants[5]) == false ? variants[5] : 0, 'StockLimited': true, 'StockQuantity': isNaN(variants[4]) == false ? variants[4] : 0, 'Weight': isNaN(variants[10]) == false ?  variants[10] : 0, 'Length' : isNaN(variants[7]) == false ? variants[7] : 0, 'Width': isNaN(variants[8]) == false ? variants[8] : 0 , 'Height' : isNaN(variants[9]) == false ? variants[9] : 0 }) : '';
              variants.length == 13 ? vm.all_variants.push({ 'Variants': [{ 'ID': '', 'Name': variants[1], 'GroupName': variants[0] }, { 'ID': '', 'Name': variants[3], 'GroupName': variants[2] }, { 'ID': '', 'Name': variants[5], 'GroupName': variants[4] }], 'SKU': variants[8], 'Price': isNaN(variants[7]) == false ? variants[7] : 0, 'StockLimited': true, 'StockQuantity': isNaN(variants[6]) == false ? variants[6] :0 , 'Weight': isNaN(variants[12]) == false ? variants[12] :0, 'Length' : isNaN(variants[9]) == false ? variants[9] :0, 'Width': isNaN(variants[10]) == false ? variants[10] : 0, 'Height' : isNaN(variants[11])== false ? variants[11] :0 }) : '';

            }

           // console.log(`all_variants  ${vm.all_variants}`);
          
          });
          //custom fields
          // let custom_counter = 0;
          // numberRange(custom_first_index, custom_last_index).forEach(function (customfield)
          // {

          //   var customfield_name = vm.all_customfield_header[custom_counter];
          //   customfield_name = customfield_name.substr(customfield_name.indexOf(" ") + 1).replace(/\s/g, ' ');
            
          //   let customfields_values = [];
            
          //   !details[Object.keys(details)[customfield]] == '' ? customfields_values.push(details[Object.keys(details)[customfield]]) : '';

          //   let custom_code = allcustomfields.filter(custom => custom.Name == customfield_name)

          //   let customfield_code = custom_code.length > 0 ? custom_code[0]['Code'] : '';

          //   vm.all_customfields.push({ 'Code': customfield_code, 'Values': customfields_values });

          //   custom_counter++;
        
          // });
          //media
          numberRange(3, 8).forEach(function (media)
          {
            !details[Object.keys(details)[media]] == '' ? vm.media.push({ 'MediaUrl': details[Object.keys(details)[media]] }) : '';

          })

          //1. Validate empty fields
          switch (true) {
            case details[Object.keys(details)[0]] == '':
              error_count++
              vm.upload_error.push({ 'Name': details['Item Name'], 'error': 'Invalid merchant id', 'code': 'Failed' })
              vm.failed_items.push(items);
              vm.failed_all++;
              break;
            case details[Object.keys(details)[1]] == '':
              error_count++
              vm.upload_error.push({ 'Name': details['Item Name'], 'error': 'Category is empty', 'code': 'Failed' })
              vm.failed_items.push(items);
              vm.failed_all++;
              break;
            case invalid_categories_count != 0:
              vm.upload_error.push({ 'Name': details['Item Name'], 'error': `${invalid_categories_count} invalid category ID'/s`, 'code': 'Failed' })
              vm.failed_items.push(items);
              vm.failed_all++;
              break;
            case details[Object.keys(details)[2]] == '':
              error_count++
              vm.upload_error.push({ 'Name': details['Item Name'], 'error': 'Item name is empty', 'code': 'Failed' })
              vm.failed_items.push(items);
              vm.failed_all++;
              break;
            // case details[Object.keys(details)[11]] == '':
            //   vm.upload_error.push({ 'Name': details['Item Name'], 'error': 'Price is empty', 'code': 'Failed' })
            //   vm.failed_items.push(items);
            //   vm.failed_all++;
            //   break;
            case details['Stock Quantity'] == '':
              error_count++
              vm.upload_error.push({ 'Name': details['Item Name'], 'error': 'Stock qty is invalid', 'code': 'Failed' })
              vm.failed_items.push(items);
              vm.failed_all++;
            
            default:

              vm.success_items.push(items);
              console.log(`tags ${details['Tags']}`)
              var itemDetails = {
                'SKU': details['SKU'],
                'Name': details['Item Name'],
                'BuyerDescription': details['Item Description'],
                'SellerDescription': details['Item Description'],
                'Price': details['Price'],
                'Weight': details['Weight'],
                'Length': details['Length'],
                'Width' : details['Width'],
                'Height' : details['Height'],
                'PriceUnit': null,
                'StockLimited': 'true', //details['Stock Limited'],
                'StockQuantity': details['Stock Quantity'],
                'IsVisibleToCustomer': true,
                'Active': true,
                'IsAvailable': '',
                'CurrencyCode': 'PHP',
                'Categories': all_categories,
                'ShippingMethods': null,
                'PickupAddresses': null,
                'Media': vm.media,
                'Tags': details['Tags']  ? details['Tags'].split('/') : '',
                //'CustomFields': vm.all_customfields,
                'ChildItems': vm.all_variants
              }
              
              var itemdata = itemDetails;
           
             // allPromises.push(vm.callItemsAPI(details['Merchant ID'], itemdata, "POST"));

              vm.success_all++;

              vm.upload_error.push({ 'Name': details['Item Name'], 'error': '', 'code': 'Success' })

              vm.all_items.push(itemdata);
             

          }
          

       // })
    
      })

      vm.uploadBulk(vm.parentMerchantId, vm.all_items, "POST")
      var promises = Promise.all(allPromises);
      promises.then(function(data) {
     
        $(".data-loader").removeClass("active")
        $(".mass-upload-browser").find(".table-responsive").css({ overflow: "auto" });

        data.forEach(function (text)
        {
          vm.success_upload.push(`${text.data.ID}/${text.data.MerchantDetail.ID}`);
        });
        
      // send successful upload for revert
        vm.onItemSuccess(vm.success_upload);
      });

    //send failed items for download
      vm.onFailedItem(vm.failed_items);
      // send success items for download
      vm.onSuccessItem(vm.success_items);
    
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
