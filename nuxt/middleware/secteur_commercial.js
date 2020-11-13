// import axios from 'axios';
/* axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://test.erp-tomanage.fr:8000/";
axios.defaults.paramsSerializer = params => {
  const qs = require('qs')
  return qs.stringify(params, {
    arrayFormat: 'repeat'
  });
}; */

export default function({ app, store }) {
  if (store.state.dict.fk_departements_francais) return console.warn('Dict fk_departements_francais already loaded')
  async function loadDepFr() {
    const response = await app.$axios.$get('/erp/api/dict', {
      params: {
        dictName: ['fk_departements_francais'],
      },
    })
    return store.commit('addDict', response)
  }

  return Promise.all([loadDepFr()])
}
