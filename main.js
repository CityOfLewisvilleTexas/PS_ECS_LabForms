var app = new Vue({
  el: '#app',
  data: () => ({
    start: null,
    end: null,
    dialog: false,
    loading: true,
    date1: null,
    date2: null,
    dateFormatted1: null,
    dateFormatted2: null,
    menu1: false,
    menu2: false,
    selectedItemDate: null,
    display_modal: false,
    psofia_modal_params: {
      token: localStorage.colAuthToken,
      user: localStorage.colEmail,
      record_number: '',
      form_number: '',
    },
    headers: [
      {
        text: 'Date',
        align: 'left',
        sortable: true,
        value: 'day'
      },
      {text: 'INF Flow MGD', value: 'inf_flow', sortable: false},
      {text: 'EFF Flow MGD', value: 'eff_flow', sortable: false},
      {text: 'Reuse MGD', value: 'reuse', sortable: false},
      {text: 'Total EFF MGD', value: 'total_eff_flow', sortable: false},
      {text: 'INF BOD MG/L', value: 'inf_bod', sortable: false},
      {text: 'INF TSS MG/L', value: 'inf_tss', sortable: false},
      {text: 'EFF BOD MG/L', value: 'eff_bod', sortable: false},
      {text: 'EFF TSS MG/L', value: 'eff_tss', sortable: false},
      {text: 'EFF PH MG/L', value: 'eff_ph', sortable: false},
      {text: 'EFF D.O. MG/L', value: 'eff_do', sortable: false},
      {text: 'Basin CL2 MG/L', value: 'basin_cl2', sortable: false},
      {text: 'Flume CL2 MG/L', value: 'flume_cl2', sortable: false}
    ],
    data: [],
    totalSection: [],
  }),
  props: {
    source: String
  },
  created: function() {
    this.loading = true;
//    this.record = $.QueryString["Record"];
//    this.month = $.QueryString["Month"];
//    this.year = $.QueryString["Year"];
    
    var date = new Date();
    this.start = new Date(date.getFullYear(), date.getMonth(), 1);
    this.end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.start = this.start.toLocaleDateString('en-US');
    this.end = this.end.toLocaleDateString('en-US');
    
//    this.token = localStorage.colAuthToken;
    this.fetchData();
  },
  methods: {
    fetchData: function() {
      var self = this;
      axios.post('https://query.cityoflewisville.com/v2/?webservice=PublicServices/ECS/LabForms_dateRange', {
        start: self.start,
        end: self.end
      })
      .then(function (response) {
//        console.log(response.data);
        self.data = response.data[0];
        self.totalSection = response.data[1];
        self.loading = false;
      })
      .catch(function (error) {
        console.log(error);
        self.loading = false;
      });
    },
    formatDate (date) {
      if (!date) return null

      const [year, month, day] = date.split('-')
      return `${month}/${day}/${year}`
    },
    parseDate (date) {
      if (!date) return null

      const [month, day, year] = date.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    },
    url: function(recordId, formId, date) {
      this.psofia_modal_params.record_number = recordId;
      this.psofia_modal_params.form_number = formId;
      
      this.selectedItemDate = this.parseDate(date);
      
      this.display_modal = true;
    },
    refresh: function() {
      this.fetchData();
    },
    //// DOWNLOAD TO CSV TO EXCEL /////
    
    downloadCSV: function(csv, filename) {
      var csvFile;
      var downloadLink;

      // CSV file
      csvFile = new Blob([csv], {type: "text/csv"});

      // Download link
      downloadLink = document.createElement("a");

      // File name
      downloadLink.download = filename;

      // Create a link to the file
      downloadLink.href = window.URL.createObjectURL(csvFile);

      // Hide download link
      downloadLink.style.display = "none";

      // Add the link to DOM
      document.body.appendChild(downloadLink);

      // Click download link
      downloadLink.click();
    },

    exportTableToCSV: function(filename) {
      var csv = [];
      var rows = document.querySelectorAll("table.datatable tr");
      
      for (var i = 0; i < rows.length; i++) {
          var row = [], cols = rows[i].querySelectorAll("td, th");
          
          for (var j = 0; j < cols.length; j++) 
              row.push(cols[j].innerText.replace(/,/g, ''));
          
          csv.push(row.join(","));        
      }

      // Download CSV file
      this.downloadCSV(csv.join("\n"), filename);
    },
    //////////////////////////////////////////
  },
  watch: {
    date1 (val) {
      this.start = this.formatDate(this.date1)
    },
    date2 (val) {
      this.end = this.formatDate(this.date2)
    }
  },
})
  
  
  