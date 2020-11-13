<template>
  <div>
    <v-dialog v-model="dialog" persistent width="600px">
      <v-form ref="form" v-model="valid" lazy-validation>
        <vcard>
          <toolBarDialog :title-edit="$t('MenuNewSecteurCommercial')">
            <v-spacer />
            <eraseForm @click="cleanField(object)" />
            <closeWindows @click="cancel" />
          </toolBarDialog>

          <!-- Stepper -->
          <v-stepper v-model="e1">
            <v-stepper-header>
              <v-stepper-step :complete="e1 > 1" step="1">{{ $t('SecteursInformations') }}</v-stepper-step>
            </v-stepper-header>

            <v-stepper-items>
              <!-- 1 -->
              <v-stepper-content step="1">
                <v-card flat class="mb-4" height="380px">
                  <v-card-text>
                    <v-row no-gutters>
                      <v-col cols="12" md="12">
                        <v-text-field v-model="object.name" :label="$t('Name')" :rules="[v => !!v || $t('error.required')]" />
                        <employee-autocomplete v-model="$store.state.data.salesPerson" is-sales :label="$t('Commercial')" @change="updateEmployee" />
                        <v-text-field
                          v-model.number="object.potentiel"
                          min="0"
                          max="1000000"
                          type="number"
                          :label="$t('Potential')"
                          :rules="[v => !!v || $t('error.required')]"
                        />
                        <v-select
                          v-model="object.departement_fr"
                          :items="$store.state.dict.fk_departements_francais.values"
                          :label="$t('Departements')"
                          item-text="label"
                          multiple
                          chips
                          clearable
                          return-object
                        >
                          <template v-slot:selection="data">
                            <v-chip :key="JSON.stringify(data.item)" class="chip--select-multi">{{ data.item.numero }} - {{ data.item.label }}</v-chip>
                          </template>
                          <template v-slot:item="data"> {{ data.item.numero }} - {{ data.item.label }} </template>
                        </v-select>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
                <v-card-actions>
                  <cancelBtn @click="cancel" />
                  <saveBtn @click="create" />
                </v-card-actions>
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </vcard>
      </v-form>
    </v-dialog>
  </div>
</template>

<script>
export default {
  components: {
    cancelBtn: () => import('@/components/button/cancelBtn'),
    closeWindows: () => import('@/components/button/closeWindows'),
    eraseForm: () => import('@/components/button/eraseForm'),
    saveBtn: () => import('@/components/button/saveBtn'),
    toolBarDialog: () => import('@/components/edit/toolBarDialog'),
    vcard: () => import('@/components/edit/vcard'),
    employeeAutocomplete: () => import('@/components/employeeAutocomplete'),
  },

  props: {
    dialog: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      e1: 1,
      object: this.initObject(),
      valid: false,
    }
  },

  computed: {
    route() {
      return this.$route.query.forSales
    },
  },
  methods: {
    cancel() {
      this.$emit('update:dialog', false)
      this.cleanField()
    },
    cleanField() {
      this.e1 = 1
      this.object = this.initObject()
    },
    create() {
      const self = this
      if (!this.$refs.form.validate()) return

      this.$socket.emit(
        'schema',
        {
          schema: `*SecteurCommercial --> @insert`,
          body: this.object,
        },
        function(response) {
          // console.log('397 > ', response)

          if (response.success) return self.$router.push('/secteur_commercial/' + response.value)
        }
      )
    },
    updateEmployee(val) {
      if (!val._id) return
      // console.log('247', val)

      this.object.commercial = val._id
      this.$store.state.data.salesPerson = val
    },

    initObject() {
      return {
        name: '',
        potentiel: 1,
        commercial: null,
        departement_fr: [],
      }
    },

    next(val) {
      console.log('296', val, '-', this.$refs.form.validate())
      // if (!this.$refs.form.validate()) return

      this.e1 = val
    },
  },
  middleware: ['dict', 'secteur_commercial'],
}
</script>
