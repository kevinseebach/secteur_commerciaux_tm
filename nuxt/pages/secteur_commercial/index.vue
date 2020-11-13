<template>
  <vlayoutBase>
    <indicatorsIndex text="Secteurs commerciaux" color="primary" :number="total" icon="business" />
    <v-col cols="12">
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        :options.sync="pagination"
        item-key="_id"
        show-select
        :server-items-length="total"
        :loading="loading"
        :footer-props="footerProps"
      >
        <template v-slot:item._id="{ item }">
          <nuxt-link :to="'/secteur_commercial/' + item._id">{{ item.name }}</nuxt-link>
        </template>
        <template v-slot:item.commercial="{ item }">
          <nuxt-link :to="'/rh/employees/' + item.commercial._id">{{ item.commercial.fullName }}</nuxt-link>
        </template>
        <template v-slot:item.departement_fr="{ item }">
          <v-chip v-for="i in item.departement_fr" :key="i.numero" class="chip--select-multi">{{ i.numero }} ({{ i.label }})</v-chip>
        </template>
        <template v-slot:item.potentiel="{ item }">{{ item.potentiel }} pharmacies</template>
      </v-data-table>
    </v-col>
    <addBtnIndex @click.stop="dialog = !dialog" />
    <createSecteur :dialog.sync="dialog" />
  </vlayoutBase>
</template>

<script>
export default {
  components: {
    indicatorsIndex: () => import('@/components/index/indicatorsIndex'),
    vlayoutBase: () => import('@/components/vlayoutBase'),
    addBtnIndex: () => import('@/components/button/addBtnIndex'),
    createSecteur: () => import('@/components/secteur_commercial/createSecteur'),
  },
  data() {
    return {
      dialog: false,
      colorChipFront: 'teal lighten-3',
      colorChipBack: 'teal darken-3',
      openConfirmModal: false,
      lastOrder: false,
      creationDate: false,
      items: [],
      loading: true,
      panel: [false],
      quickSearch: null,
      selected: [],
      total: 0,
      totalAll: {},
      pagination: {
        itemsPerPage: 25,
        page: 1,
        sortBy: ['name'],
        sortDesc: [false],
      },
      search: this.initSearch(),
      footerProps: {
        'items-per-page-options': [25, 50, 100, 500],
      },
      headers: [
        {
          text: this.$t('Name'),
          value: '_id',
          sortable: true,
          width: '10%',
          align: 'left',
        },
        {
          text: this.$t('Commercial'),
          value: 'commercial',
          sortable: true,
        },
        {
          text: this.$t('Couverture'),
          value: 'departement_fr',
          sortable: false,
        },
        {
          text: this.$t('Potentiel'),
          value: 'potentiel',
          sortable: true,
        },
      ],
    }
  },

  watch: {
    pagination: {
      handler() {
        this.find()
      },
      deep: true,
    },
    search: {
      handler() {
        this.find()
      },
      deep: true,
    },
  },

  methods: {
    find: _.debounce(function() {
      this.selected = []
      this.getDataFromApi().then(data => {
        this.items = data.items
        this.total = data.total
        this.totalAll = data.totalAll
      })
    }, 300),

    getDataFromApi() {
      this.loading = true
      const self = this
      /* eslint-disable no-unused-vars */
      return new Promise((resolve, reject) => {
        /* eslint-disable no-unused-vars */

        const { sortBy, sortDesc, page, itemsPerPage } = this.pagination

        const query = {
          quickSearch: this.quickSearch,
          viewType: 'list',
          filter: this.search,
          limit: this.pagination.itemsPerPage,
          page: this.pagination.page,
          sort: { sortBy, sortDesc },
        }

        // console.log(query)

        self.$socket.emit(
          'schema',
          {
            schema: '*SecteurCommercial --> @query',
            query,
          },
          function(response) {
            if (!response.success) return console.err('Error in load secteur_commercial list')

            const total = response.value.total
            const totalAll = response.value.totalAll
            const items = response.value.data

            self.loading = false
            resolve({
              items,
              total,
              totalAll,
            })
          }
        )
      })
    },

    initPagination() {
      this.pagination = {
        itemsPerPage: 25,
        page: 1,
        sortBy: ['name'],
        sortDesc: [false],
      }
    },

    initSearch() {
      this.creationDate = false
      this.lastOrder = false
      return {}
    },

    resetFilter() {
      this.quickSearch = null
      this.search = this.initSearch()
      this.initPagination()
      this.find()
    },
  },
  middleware: ['dict', 'secteur_commercial'],
}
</script>

<style>
.backgroundCustomers {
  background: linear-gradient(60deg, #26a69a, #00695c) !important;
}
</style>
