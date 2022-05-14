// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import 'leaflet/dist/leaflet.css'
import * as L from 'leaflet'
import 'leaflet.pm'
import 'leaflet.pm/dist/leaflet.pm.css'
import mapBoxGl from 'mapbox-gl'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import Axios from 'axios'

Vue.use(ElementUI);

Vue.config.productionTip = false
Vue.prototype.$mapboxgl = mapBoxGl
Vue.prototype.$map = { _leaflet_id: -1 }

window.L = Vue.L = Vue.prototype.$L = L

window.axios = Vue.prototype.$axios = Axios

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
