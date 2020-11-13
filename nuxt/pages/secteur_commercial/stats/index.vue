<template>
  <div id="casecteur">
    <vlayoutBase>
      <v-col cols="12">
        <cardRounded :color="colorToolbar">
          <v-row class="ma-0 pa-0">
            <v-col cols="1">
              <v-card flat class="ml-1 mt-1 text-center" color="transparent">
                <v-img src="avatar.png" height="76" contain />
              </v-card>
            </v-col>
            <v-col cols="11">
              <toolbar height="48">
                <toolbarTitle typo="headline" title="Chiffre d'affaire par secteur" />
                <v-spacer />
                <refreshBtnToolbar color="white" @click="resetFilter()" />
              </toolbar>
            </v-col>
          </v-row>
        </cardRounded>
      </v-col>
      <v-col cols="12">
        <cardRounded>
          <v-row>
            <v-col cols="3">
              <div class="form-group form-md-line-input">
                <v-select
                  v-model="search.secteur.value[0]"
                  prepend-icon="map"
                  hide-details
                  :items="secteurList"
                  :label="$t('Secteur')"
                  item-text="name"
                  item-value="_id"
                  multiple
                />
              </div>
            </v-col>
            <v-col cols="3">
              <div class="form-group form-md-line-input">
                <v-select
                  v-model="search.entity.value"
                  prepend-icon="business"
                  hide-details
                  :items="$store.state.dict.entitiesList"
                  :label="$t('Entity')"
                  item-text="name"
                  item-value="id"
                  multiple
                />
              </div>
            </v-col>
            <v-col cols="3">
              <div class="form-group form-md-line-input">
                <v-select
                  v-model="search.month.value[1]"
                  prepend-icon="event"
                  hide-details
                  :items="periodes"
                  :label="$t('Periode')"
                  item-text="label"
                  item-value="value"
                />
              </div>
            </v-col>
            <v-col cols="3">
              <div class="form-group form-md-line-input">
                <v-select
                  v-model="search.detailBy.value"
                  prepend-icon="info"
                  hide-details
                  :items="detailList"
                  :label="$t('Détail')"
                  item-text="label"
                  item-value="value"
                />
              </div>
            </v-col>
            <v-col cols="6" offset="3">
              <v-btn block color="primary" @click="find()">Calculer le C.A.</v-btn>
            </v-col>
          </v-row>
        </cardRounded>
      </v-col>
      <v-col cols="12">
        <!-- prettier-ignore -->
        <v-simple-table>
            <thead>
              <tr border='1'>
                <th class="text-center"></th>
                <th border='1' class="text-center" colspan="2">
                    {{label[0] }}
                </th>
                <th border='1' class="text-center" colspan="3">
                    {{label[1] }}
                </th>
                <th border='1' class="text-center" colspan="3">
                    {{label[2] }}
                </th>
              </tr>
              <tr>
                <th border='1' class="text-center">
                  Nom
                </th>
                <th border='1' class="text-center">
                    Montant H.T.
                </th>
                <th border='1' class="text-center">
                  Quantité
                </th>
                <th border='1' class="text-center">
                    Montant H.T.
                </th>
                <th border='1' class="text-center">
                  Quantité
                </th>
                <th border='1' class="text-center">
                  Ecart C.A.
                </th>
                <th border='1' class="text-center">
                    Montant H.T.
                </th>
                <th border='1' class="text-center">
                  Quantité
                </th>
                <th border='1' class="text-center">
                  Ecart C.A.
                </th>
              </tr>
            </thead>
            <tbody>
            <template v-for="line in items">
            <tr :key="line">
              <td>
                <a class=" with-tooltip " :href="'/v2/rh/employee/'+line._id.salesPerson._id">
                  <i class="fa fa-user"></i>
                  {{ line._id.salesPerson.fullName }}
                </a>
                 <a v-if="line._id.product" class=" with-tooltip " ui-sref="product.show({id:line._id.product._id})"><i class="fa fa-shopping-cart"></i>
                  {{
                  line._id.product.info.SKU }} - {{ line._id.product.info.langs[0].name }}</a>
              </td>
              <td v-if="line.yearly[label[0]]" class="text-center">
                {{ line.yearly[label[0]].total_ht | currency}}
              </td><td v-else class="text-center"></td>
              <td v-if="line.yearly[label[0]]" class="text-center">
                <span v-if="line.yearly[label[0]].qty">{{ parseFloat(line.yearly[label[0]].qty).toFixed(2)}}</span>
              </td><td v-else class="text-center"></td>
              <td v-if="line.yearly[label[1]]" class="text-center">
                {{ line.yearly[label[1]].total_ht | currency}}
              </td><td v-else class="text-center"></td>
              <td v-if="line.yearly[label[1]]" class="text-center">
                <span v-if="line.yearly[label[1]].qty">{{ parseFloat(line.yearly[label[1]].qty).toFixed(2)}}</span>
              </td><td v-else class="text-center"></td>
              <td v-if="line.yearly[label[1]]" class="text-center">
                <label v-show="line.yearly[label[1]].gap" :class="{ 'text-danger':line.yearly[label[1]].gap <= 0, 'text-success':line.yearly[label[1]].gap > 0}">
                 {{ parseFloat(line.yearly[label[1]].gap).toFixed(2) }} %
                 </label>
              </td><td v-else class="text-center"></td>
              <td v-if="line.yearly[label[2]]" class="text-center">
                {{ line.yearly[label[2]].total_ht | currency}}
              </td><td v-else class="text-center"></td>
              <td v-if="line.yearly[label[2]]" class="text-center">
                <span v-if="line.yearly[label[2]].qty">{{ parseFloat(line.yearly[label[2]].qty).toFixed(2)}}</span>
              </td><td v-else class="text-center"></td>
              <td v-if="line.yearly[label[2]]" class="text-center">
                <label v-show="line.yearly[label[2]].gap" :class="{ 'text-danger':line.yearly[label[2]].gap <= 0, 'text-success':line.yearly[label[2]].gap > 0}">
                 {{ parseFloat(line.yearly[label[2]].gap).toFixed(2) }} %</label>
              </td><td v-else class="text-center"></td>
            </tr>
          </template>
                  </tbody>
          <tfoot v-if="totalAll.yearly">
            <td class="text-center">Total</td>
            <td v-if="totalAll.yearly[label[0]]"  class="text-center">{{totalAll.yearly[label[0]].total_ht | currency}}</td><td v-else class="text-center"></td>
            <td v-if="totalAll.yearly[label[0]]"  class="text-center">{{totalAll.yearly[label[0]].qty}}</td><td v-else class="text-center"></td>

            <td v-if="totalAll.yearly[label[1]]"  class="text-center">{{totalAll.yearly[label[1]].total_ht | currency}}</td><td v-else class="text-center"></td>
            <td v-if="totalAll.yearly[label[1]]" class="text-center">{{totalAll.yearly[label[1]].qty}}</td><td v-else class="text-center"></td>
            <td v-if="totalAll.yearly[label[1]]" class="text-center"><label v-show="totalAll.yearly[label[1]].gap" :class="{ 'text-danger':totalAll.yearly[label[1]].gap <= 0, 'text-success':totalAll.yearly[label[1]].gap > 0}"
               >{{ parseFloat(totalAll.yearly[label[1]].gap).toFixed(2) }} %</label></td><td v-else class="text-center"></td>

            <td v-if="totalAll.yearly[label[2]]" class="text-center">{{totalAll.yearly[label[2]].total_ht | currency}}</td><td v-else class="text-center"></td>
            <td v-if="totalAll.yearly[label[2]]" class="text-center">{{totalAll.yearly[label[2]].qty}}</td><td v-else class="text-center"></td>
            <td v-if="totalAll.yearly[label[2]]" class="text-center"><label v-show="totalAll.yearly[label[2]].gap" :class="{ 'text-danger':totalAll.yearly[label[2]].gap <= 0, 'text-success':totalAll.yearly[label[2]].gap > 0}"
               >{{ parseFloat(totalAll.yearly[label[2]].gap).toFixed(2) }} %</label></td><td v-else class="text-center"></td>
          </tfoot>
          <!-- prettier-ignore -->
        </v-simple-table>
      </v-col>
    </vlayoutBase>
  </div>
</template>

<script>
export default {
  components: {
    cardRounded: () => import('@/components/id/cardRounded'),
    toolbar: () => import('@/components/id/toolbar'),
    toolbarTitle: () => import('@/components/index/toolbarTitleWhite'),
    refreshBtnToolbar: () => import('@/components/button/refreshBtnToolbar'),
    vlayoutBase: () => import('@/components/vlayoutBase'),
  },
  data() {
    return {
      colorToolbar: 'blue-grey darken-1',
      dialog: false,
      colorChipFront: 'teal lighten-3',
      colorChipBack: 'teal darken-3',
      items: [],
      loading: true,
      panel: [false],
      quickSearch: null,
      selected: [],
      total: 0,
      totalAll: [],
      label: [],
      secteurList: [],
      detailList: [
        {
          value: '',
          label: 'Aucun',
        },
        {
          value: 'byProduct',
          label: 'Par produuit',
        },
      ],
      periodes: [
        {
          value: '',
          label: 'Année',
        },
        {
          value: 'T1',
          label: '1er trimestre',
        },
        {
          value: 'T2',
          label: '2e trimestre',
        },
        {
          value: 'T3',
          label: '3e trimestre',
        },
        {
          value: 'T4',
          label: '4e trimestre',
        },
        {
          value: '1',
          label: 'Janvier',
        },
        {
          value: '2',
          label: 'Février',
        },
        {
          value: '3',
          label: 'Mars',
        },
        {
          value: '4',
          label: 'Avril',
        },
        {
          value: '5',
          label: 'Mai',
        },
        {
          value: '6',
          label: 'Juin',
        },
        {
          value: '7',
          label: 'Juillet',
        },
        {
          value: '8',
          label: 'Août',
        },
        {
          value: '9',
          label: 'Septembre',
        },
        {
          value: '10',
          label: 'Octobre',
        },
        {
          value: '11',
          label: 'Novembre',
        },
        {
          value: '12',
          label: 'Décembre',
        },
      ],
      pagination: {
        itemsPerPage: 100,
        page: 1,
        sortBy: ['name'],
        sortDesc: [false],
      },
      search: this.initSearch(),
    }
  },

  watch: {
    pagination: {
      handler() {
        this.find()
      },
      deep: true,
    },
    // search: {
    //   handler() {
    //     this.find()
    //   },
    //   deep: true,
    // },
  },
  mounted() {
    const self = this
    self.$socket.emit(
      'schema',
      {
        schema: '*SecteurCommercial --> @query',
      },
      function(response) {
        self.secteurList = response.value.data
      }
    )
    this.resetFilter()
  },
  methods: {
    find: _.debounce(function() {
      this.selected = []
      this.getDataFromApi().then(data => {
        this.items = data.items
        this.label = data.label
        this.total = data.total
        this.totalAll = data.totalAll
      })
    }, 300),

    getDataFromApi() {
      this.loading = true
      this.items = []
      this.totalAll = []
      const self = this
      /* eslint-disable no-unused-vars */
      return new Promise((resolve, reject) => {
        /* eslint-disable no-unused-vars */
        const { sortBy, sortDesc, page, itemsPerPage } = this.pagination
        const query = {
          quickSearch: this.quickSearch,
          viewType: 'list',
          filter: this.search,
          contentType: 'secteur_commercial',
          limit: this.pagination.itemsPerPage,
          page: this.pagination.page,
          sort: { sortBy, sortDesc },
        }

        self.$socket.emit(
          'schema',
          {
            schema: '*SecteurCommercial --> @caSecteur',
            query,
          },
          function(response) {
            if (!response.success) return console.err('Error in load secteur_commercial list')
            self.loading = false
            const total = response.value.total
            const totalAll = response.value.totalAll
            const items = response.value.data
            const label = response.value.labels

            resolve({
              items,
              total,
              totalAll,
              label,
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
      /* prettier-ignore */
      return {"secteur":{"value":[]},"entity":{"value":['otcconcept']},"month":{"value":[null,""]},"detailBy":{"value":""}}
      /* prettier-ignore */
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

<!-- prettier-ignore -->
<style>
  #casecteur .text-success{
    color:green;
  }
  #casecteur .text-danger{
    color:red;
  }
  #casecteur table{
    border: 1px solid #000;
  }
  #casecteur tr,td,th{
    border :1px solid #ccc;
  }

  #casecteur th{
    background-color: #ccc;
    border-color:#000;
  }
  #casecteur thead tr:first-child th{
    font-weight: bold !important;
    font-size:1.25em !important;
    color:#000 !important;
  }

  #casecteur tbody tr:first-child td{
    border-top-color: #000;
  }
  #casecteur tbody tr:last-child td{
    border-bottom-color: #000;
  }
  #casecteur tbody tr td:first-child{
    border-left-color: #000;
  }
  #casecteur tbody tr td:last-child{
    border-right-color: #000;
  }
  #casecteur tbody tr td:nth-child(1){
    border-right-color: #000;
  }
  #casecteur tbody tr td:nth-child(2),
  #casecteur tbody tr td:nth-child(4),
  #casecteur tbody tr td:nth-child(7){
    border-left-color: #000;
  }
  #casecteur tbody tr td:nth-child(3),
  #casecteur tbody tr td:nth-child(6){
    border-right-color: #000;
  }
  #casecteur tfoot td{
    background-color: #ccc;
    font-weight: bold;
    border-color:#000;
    padding:5px;
  }
</style>
<!-- prettier-ignore -->
