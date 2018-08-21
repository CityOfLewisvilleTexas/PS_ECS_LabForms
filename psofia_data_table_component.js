//**********************************************************************//
// Author: Caleb Faught, Email: cfaught@cityoflewisville.com            //
// Note: this component requires Vue2 and Vuetify CSS and JS libraries. //
//       as well as Axios.js                                            //
//**********************************************************************//

Vue.component('psofia-modal', {
  props: ['visible', 'token', 'record_number', 'form_number', 'user'],
  data: function() {
    return {
      date: null,
      menu: false,
      loading: true,
      form: [],
      data: [],
      selectData: [],
    }
  },
  methods: {
    fetchFormData: function() {
      self = this;
//      console.log(self.form_number)
//      console.log(self.record_number)
//      console.log(self.token)
      
      axios.post('https://query.cityoflewisville.com/v2/?webservice=PSOFIA/Forms',{
        Form: self.form_number,
        RecordNumber: self.record_number,
        auth_token: self.token
      })
      .then(function(response){
        console.log(response.data);
        //self.convertHTML(response.data);
        //self.buildForm(response.data);
        
        self.form = response.data.results;
        self.buildFormDataObj(self.form);
        console.log(self.form);
        
      })
      .catch(function (error) {
        console.log(error);
      });
    },
    buildFormDataObj: function(form) {
      var self = this;
      
      self.data = [];
      self.selectData = [];
      
      var tempObj = {
        "RecordNumber": self.record_number,
        "User": self.user,
        "Form": self.form_number
      }
      self.data.push(tempObj);
      
      form.forEach(function(input, index) {
        // Pull select items if input type is select:
        if (input.FieldType === 'SELECT') {
          self.selectData[index] = input.HTML.split(/<[^>]+>/ig).filter(function(value) {
            return /^(?!\s*$).+/g.test(value);
          })
          self.selectData[index] = self.selectData[index].slice(1);
        }
        
        // Push object representing the input id and value onto data array
        var tempObj = {"Id": input.FieldID, "Value": null };
        self.data.push(tempObj);
      });
      
      self.loading = false;
    },
    parseDate: function(date) {
      if (!date) return null

      const [month, day, year] = date.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    },
    log: function() {
      console.log(this.data);
    },
  },
  computed: {
    show: {
      get: function() {
        return this.visible
      },
      set (value) {
        if (!value) {
          console.log(this.data)
          this.$emit('close')
        }
      }
    }
  },
  watch: {
    visible: function(val) {
      if (val) {
        this.loading = true;
        this.fetchFormData();
      }
    }
  },
  template: '\
      <v-layout row justify-center>\
        <v-dialog v-model="show" max-width="80%">\
          <v-card>\
            <v-card-title v-if="!loading" class="headline" id="formTitle">{{ form[0].FormName }}</v-card-title>\
            <v-card-text>\
            <v-container grid-list-md>\
              <v-layout wrap>\
                <v-form  id="formLayout" >\
                  <v-flex v-for="(input, index) in form">\
                    <v-menu\
                      ref="menu"\
                      v-if="input.FieldType === \'DATE\'"\
                      :close-on-content-click="false"\
                      v-model="menu"\
                      :nudge-right="40"\
                      lazy transition="scale-transition"\
                      offset-y\
                      full-width\
                      readonly\
                      min-width="290px">\
                      <v-text-field\
                        slot="activator"\
                        v-model="data[index + 1].Value"\
                        label="Picker in menu"\
                        prepend-icon="event"\
                        readonly \
                        required\
                      ></v-text-field>\
                      <v-date-picker v-model="data[index + 1].Value" @input="menu = false" readonly no-title scrollable>\
                      </v-date-picker>\
                    </v-menu>\
                    <v-text-field\
                      v-if="input.FieldType === \'TEXT\'"\
                      v-model="data[index + 1].Value"\
                      :label="input.FieldName"\
                      type="text"\
                      required\
                    ></v-text-field>\
                    <v-text-field\
                      v-if="input.FieldType === \'NUMBER\'"\
                      v-model="data[index + 1].Value"\
                      :label="input.FieldName"\
                      type="number"\
                      required\
                    ></v-text-field>\
                    <v-select\
                      v-if="input.FieldType === \'SELECT\'"\
                      :items="selectData[index]"\
                      v-model="data[index + 1].Value"\
                      label="Select"\
                      single-line\
                    ></v-select>\
                  </v-flex>\
                </v-form>\
              </v-layout>\
            </v-container>\
            <small>*indicates required field</small>\
          </v-card-text>\
            <v-card-actions>\
              <v-spacer></v-spacer>\
              <v-btn color="green darken-1" flat="flat" @click.native="show = false">Cancel</v-btn>\
              <v-btn color="green darken-1" flat="flat" @click.native="log">Submit</v-btn>\
            </v-card-actions>\
          </v-card>\
        </v-dialog>\
      </v-layout>'
})