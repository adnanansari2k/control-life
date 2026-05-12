import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Logs      from './views/Logs.vue'
import Loans     from './views/Loans.vue'
import Insights  from './views/Insights.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',         component: Dashboard },
    { path: '/logs',     component: Logs      },
    { path: '/loans',    component: Loans     },
    { path: '/insights', component: Insights  },
  ]
})

createApp(App).use(router).mount('#app')
