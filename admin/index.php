<link rel="stylesheet" href="css/mass-upload.css">

<!-- <div class="col-sm-9 main-content" id="main"> -->

<div class="page-content" id="app">
  <div class="top-note page-topnav">
    <p>Mass upload items to your marketplace using the special csv. <a href="#" id="formatlink">Get the format here.</a></p>

  </div>
  <div class="page-topnav secondnary-topnav">
    <div class="mass-upload-browser">
      <div class="d-flex">
        <div class="browse-element">
          <div class="form-group">
            <input type="file" name="file-7[]" id="file-7" accept=".csv" class="inputfile" data-multiple-caption="{count} Upload File" multiple @change="loadCSV($event)">
            <label for="file-7"><span class="archive-name">Upload File</span><span class="btn-inputfile"> Browse</span></label><span class="btn-inputfileclear">Clear</span><span class="result-found" style="color:green">{{ count }} Items Found.</span><span class="result-found" style="color:red">{{ failedcount }} Warning/s (empty Fields).</span>
          </div>
        </div>
      </div>
      <div class="table-responsive csv-extractor">
        <table class="table" v-if='parse_csv'>
          <thead class="thead-dark">
            <tr>
              <!-- <th v-for="(key,itemkey) in parse_header"> {{itemkey + 1}} </th> -->
              <th v-for="key in parse_header" :class="{ active: sortKey == key }">
                {{ key | capitalize }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="csv in parse_csv">
              <td v-for="key in parse_header">
                {{csv[key]}}
              </td>

            </tr>
          </tbody>
        </table>
        <div class="data-loader">
          <div class="round-load"></div>
        </div>
      </div>
    </div>
    <div class="upload-section mt-30 active">
      <button v-on:click=onUpload>Upload</button>
    </div>
    <div class="upload-section mt-30 active">
      <p>Failed Uploads.</p> <a href="#" id="download_failed"> Download failed imports.</a>
    </div>
  </div>

  <div class="table-responsive csv-extractor">
    <table class="table">
      <thead class="thead-dark">
        <tr>
          <th> Count</th>
          <th> Item Name</th>
          <th> Upload Errors</th>
          <th> Upload Result</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item,itemkey) in results">
          <td> {{itemkey + 1}} </td>
          <td> {{ item.Name }} </td>
          <!-- <td> {{ item.Error.length == 0 ? item.Error : 'No Errors' }}  </td> -->
          <td> {{ item.Error }} </td>
          <td> {{ item.code }} </td>
        </tr>

      </tbody>
    </table>
  </div>

</div>
</div>

<!-- </div> -->
<div class="clearfix"></div>
</div>



<!-- </div>  -->
<script type="text/javascript" src="https://bootstrap.arcadier.com/adminportal/js/jquery-1.11.3.min.js"></script>
<script type="text/javascript">
  (function($, window, document, undefined) {

    $('.inputfile').each(function() {
      var $input = $(this),
        $label = $input.next('label'),
        labelVal = $label.html();

      function inputchange() {
        $input.on('change', function(e) {
          var fileName = '';

          if (this.files && this.files.length > 1)
            fileName = (this.getAttribute('data-multiple-caption') || '').replace('{count}', this.files.length);
          else if (e.target.value)
            fileName = e.target.value.split('\\').pop();

          if (fileName)
            $label.find('.archive-name').html(fileName);
          else
            $label.html(labelVal);
          $('.result-found').text(this.files.length);
        });
      }

      // Firefox bug fix
      $input
        .on('focus', function() {
          $input.addClass('has-focus');
        })
        .on('blur', function() {
          $input.removeClass('has-focus');
        });
    });
  })(jQuery, window, document);
  $(document).ready(function() {
    $("body").on("click", ".upload-section.active button", function() {
      $(".data-loader").addClass("active");
    });
    setTimeout(function() {
      $('.data-loader').removeClass('active')
    }, 3000);
    $("body").on("click", ".btn-inputfileclear", function() {
      $(".csv-extractor .table tbody tr").remove();
      $(".csv-extractor .table tbody").html("<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>");
      $(".csv-extractor > table").addClass("empty");

      location.reload();
    });


  });
</script>

<!-- <script type="text/javascript" src="scripts/package.js"></script> -->

<script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.17-beta.0/vue.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.2/axios.js"></script>
<script type="text/javascript" src="scripts/package.js"></script>

<script type="text/javascript">

</script>