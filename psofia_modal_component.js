//**********************************************************************//
// Author: Caleb Faught, Email: cfaught@cityoflewisville.com            //
// Note: this component requires Vue2 and Vuetify CSS and JS libraries. //
//       as well as Axios.js                                              //
//**********************************************************************//

Vue.component('psofia-modal', {
  // The props that need to be passed to the component in the parent HTML file:
  props: {
    visible: Boolean, 
    params: Object, 
    set_date: String
  },
  data: function() {
    return {
      date: this.set_date,
      menu: false,
      loading: true,
      form: [],
      data: [],
      selectData: [],
      SectionNames: [],
    }
  },
  methods: {
    fetchFormData: function() {
      self = this;

      axios.post('https://query.cityoflewisville.com/v2/?webservice=PSOFIA/Forms',{
        Form: self.params.form_number,
// testing:       Form: 42,
        RecordNumber: self.params.record_number,
        auth_token: self.params.token
      })
      .then(function(response){
        self.form = response.data.results;
        self.buildFormDataObj(self.form);
//        console.log(self.form)
      })
      .catch(function (error) {
        console.log(error);
      });
    },
    buildFormDataObj: function(form) {
      var self = this;
      
      // Organize form data into sections and subsections
      self.SectionNames = [];
      var arrayPosition = -1;
      
      form.forEach(function(input, index) {
        if (input.NewSection === '1') {
          self.SectionNames.push({ [input.SectionName]: [] });
          arrayPosition += 1;
        }
        input.index = index;
        self.SectionNames[arrayPosition][input.SectionName].push(input);
      }); 
//      console.log(self.SectionNames)
//      console.log(Object.keys(self.SectionNames[0]))
      
      
      // organize form data into object that will be converted to json that is submitted later.
      self.data = [];
      self.selectData = [];
      var tempObj = {};
      
      // create the header for PSOFIA submit data
      tempObj = {
        "recordNumber": form[0].RecordNumber,
        "User": self.params.user,
        "Form": self.params.form_number
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
        
        if (input.FieldType === 'DATE') {
          var tempObj = {"Id": input.FieldID, "Value": self.set_date };
        } else {
          var tempObj = {"Id": input.FieldID, "Value": input.FieldValue };
        }
        
        // remove <br> from input labels
        self.form[index].FieldName = input.FieldName.split('<br>')[0];
        
        // Push object representing the input id and value onto data array
        self.data.push(tempObj);
        self.loading = false;
      });
      
      
    },
    parseDate: function(date) {
      // Converts yyyy-mm-dd to mm/dd/yyyy
      if (!date) return null

      const [month, day, year] = date.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    },
    submit: function() {
      var self = this;
      self.show = false;
      this.$emit('loading');
      
//      console.log(JSON.stringify(self.data));
      
      if (self.data[0].RecordNumber) {
        axios.post('https://query.cityoflewisville.com/v2/?webservice=PSOFIA/Submit', {
          auth_token: self.params.token, 
          data: JSON.stringify(self.data)
        }).then(function(data){
          self.$emit('fetch-data');
        }).catch(function (error) {
          console.log(error);
        });
      } else {
        axios.post('https://query.cityoflewisville.com/v2/?webservice=PSOFIA/Edit Submit', {
          auth_token: self.params.token, 
          data: JSON.stringify(self.data)
        }).then(function(data){
          self.$emit('fetch-data');
        }).catch(function (error) {
          console.log(error);
        });
      }
      
    },
  },
  computed: {
    // toggle modal as visible/hidden
    show: {
      get: function() {
        return this.visible
      },
      set (value) {
        if (!value) {
//          console.log(JSON.stringify(this.data));
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
  
  // NEED TO FIX VALUES: does not line up with data array now
  
  template: '\
      <v-layout row justify-center>\
        <v-dialog v-model="show" max-width="50%">\
          <v-card>\
            <v-card-title v-if="!loading" class="headline" id="formTitle">{{ form[0].FormName }}</v-card-title>\
            <v-card-text>\
            <v-container grid-list-lg>\
              <v-layout wrap>\
                <v-form  id="formLayout" >\
                  <v-container v-for="(section, index) in SectionNames">\
                  <v-flex v-if="Object.keys(section)[0] !== \'NoSectionName\'">\
                    <v-divider></v-divider>\
                    <h3>{{ Object.keys(section)[0] }}</h3>\
                  </v-flex>\
                  <v-container grid-list-md >\
                    <v-layout wrap>\
                      <v-flex v-for="(input, index) in section[Object.keys(section)[0]]">\
                        <v-flex v-if="input.NewSubSection && input.SectionID != 6">\
                          <v-divider></v-divider>\
                          <v-subheader inset>{{ input.SubSectionName }}</v-subheader>\
                        </v-flex>\
                        <v-menu\
                          ref="menu"\
                          v-if="input.FieldType === \'DATE\'"\
                          :close-on-content-click="false"\
                          v-model="menu"\
                          :nudge-right="40"\
                          lazy transition="scale-transition"\
                          offset-y\
                          full-width\
                          min-width="290px">\
                          <v-text-field\
                            slot="activator"\
                            v-model="data[input.index + 1].Value"\
                            :label="input.FieldName"\
                            prepend-icon="event"\
                            required\
                          ></v-text-field>\
                          <v-date-picker v-model="data[input.index + 1].Value" @input="menu = false" no-title scrollable>\
                          </v-date-picker>\
                        </v-menu>\
                        <v-text-field\
                          v-if="input.FieldType === \'TEXT\'"\
                          v-model="data[input.index + 1].Value"\
                          :label="input.FieldName"\
                          type="text"\
                          required\
                        ></v-text-field>\
                        <v-text-field\
                          v-if="input.FieldType === \'NUMBER\'"\
                          v-model="data[input.index + 1].Value"\
                          :label="input.FieldName"\
                          type="number"\
                          required\
                        ></v-text-field>\
                        <v-select\
                          v-if="input.FieldType === \'SELECT\'"\
                          :items="selectData[input.index]"\
                          v-model="data[input.index + 1].Value"\
                          label="Select"\
                          single-line\
                        ></v-select>\
                        <v-checkbox\
                          v-if="input.FieldType === \'CHECKBOX\'"\
                          v-model="data[input.index + 1].Value"\
                          :label="input.FieldName"\
                          required\
                        ></v-checkbox>\
                      </v-flex>\
                    </v-layout>\
                  </v-container>\
                  </v-container>\
                </v-form>\
              </v-layout>\
            </v-container>\
            <small>*indicates required field</small>\
          </v-card-text>\
            <v-card-actions>\
              <v-spacer></v-spacer>\
              <v-btn color="green darken-1" flat="flat" @click.native="show = false">Cancel</v-btn>\
              <v-btn color="green darken-1" flat="flat" @click.native="submit">Submit</v-btn>\
            </v-card-actions>\
          </v-card>\
        </v-dialog>\
      </v-layout>'
  // OLD WORKING TEMPLATE:
//  template: '\
//      <v-layout row justify-center>\
//        <v-dialog v-model="show" max-width="80%">\
//          <v-card>\
//            <v-card-title v-if="!loading" class="headline" id="formTitle">{{ form[0].FormName }}</v-card-title>\
//            <v-card-text>\
//            <v-container grid-list-md>\
//              <v-layout wrap>\
//                <v-form  id="formLayout" >\
//                  <v-flex v-for="(input, index) in form">\
//                    <v-flex v-if="input.NewSection && input.SectionID != 6">\
//                      <v-divider></v-divider>\
//                      <h3>{{ input.SectionName }}</h3>\
//                    </v-flex>\
//                    <v-flex v-if="input.NewSubSection && input.SectionID != 6">\
//                      <v-divider></v-divider>\
//                      <v-subheader inset>{{ input.SubSectionName }}</v-subheader>\
//                    </v-flex>\
//                    <v-menu\
//                      ref="menu"\
//                      v-if="input.FieldType === \'DATE\'"\
//                      :close-on-content-click="false"\
//                      v-model="menu"\
//                      :nudge-right="40"\
//                      lazy transition="scale-transition"\
//                      offset-y\
//                      full-width\
//                      min-width="290px">\
//                      <v-text-field\
//                        slot="activator"\
//                        v-model="data[index + 1].Value"\
//                        :label="input.FieldName"\
//                        prepend-icon="event"\
//                        required\
//                      ></v-text-field>\
//                      <v-date-picker v-model="data[index + 1].Value" @input="menu = false" no-title scrollable>\
//                      </v-date-picker>\
//                    </v-menu>\
//                    <v-text-field\
//                      v-if="input.FieldType === \'TEXT\'"\
//                      v-model="data[index + 1].Value"\
//                      :label="input.FieldName"\
//                      type="text"\
//                      required\
//                    ></v-text-field>\
//                    <v-text-field\
//                      v-if="input.FieldType === \'NUMBER\'"\
//                      v-model="data[index + 1].Value"\
//                      :label="input.FieldName"\
//                      type="number"\
//                      required\
//                    ></v-text-field>\
//                    <v-select\
//                      v-if="input.FieldType === \'SELECT\'"\
//                      :items="selectData[index]"\
//                      v-model="data[index + 1].Value"\
//                      label="Select"\
//                      single-line\
//                    ></v-select>\
//                    <v-checkbox\
//                      v-if="input.FieldType === \'CHECKBOX\'"\
//                      v-model="data[index + 1].Value"\
//                      :label="input.FieldName"\
//                      required\
//                    ></v-checkbox>\
//                  </v-flex>\
//                </v-form>\
//              </v-layout>\
//            </v-container>\
//            <small>*indicates required field</small>\
//          </v-card-text>\
//            <v-card-actions>\
//              <v-spacer></v-spacer>\
//              <v-btn color="green darken-1" flat="flat" @click.native="show = false">Cancel</v-btn>\
//              <v-btn color="green darken-1" flat="flat" @click.native="submit">Submit</v-btn>\
//            </v-card-actions>\
//          </v-card>\
//        </v-dialog>\
//      </v-layout>'
})