<template>
  <div class="page" style="padding-top:4px">
    <div class="ph" style="padding-right:48px">
      <div class="pt">Logs</div>
      <div class="mono" style="font-size:13px;font-weight:700;color:var(--text-muted)">
        {{ filteredLogs.length }} entries
      </div>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <!-- Type filter -->
      <div class="s-scroll" style="margin-bottom:10px">
        <button
          v-for="f in typeFilters" :key="f.v"
          class="filter-chip"
          :class="{ 'fc-active': typeFilter===f.v }"
          @click="typeFilter = typeFilter===f.v ? '' : f.v"
        >{{ f.label }}</button>
      </div>

      <!-- Tag filter -->
      <div class="s-scroll" style="margin-bottom:10px">
        <button
          v-for="t in allTagsUsed" :key="t"
          class="filter-chip fc-tag"
          :class="{ 'fc-tag-active': tagFilter===t }"
          @click="tagFilter = tagFilter===t ? '' : t"
        >{{ t }}</button>
      </div>

      <!-- Date filter -->
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button v-for="d in dateFilters" :key="d.v" class="filter-chip" :class="{ 'fc-active': dateFilter===d.v }" @click="dateFilter=d.v">{{ d.label }}</button>
        <input v-if="dateFilter==='custom'" v-model="customDate" type="date" class="input" style="width:150px;padding:6px 10px;font-size:13px" />
      </div>
    </div>

    <!-- Summary for current filter -->
    <div v-if="filteredLogs.length > 0" class="filter-summary">
      <div class="fs-item">
        <span class="fs-label">Total Spent</span>
        <span class="mono fs-val" style="color:var(--red)">₹{{ filterSpend.toLocaleString('en-IN') }}</span>
      </div>
      <div class="fs-item">
        <span class="fs-label">Income</span>
        <span class="mono fs-val" style="color:var(--green)">₹{{ filterIncome.toLocaleString('en-IN') }}</span>
      </div>
      <div class="fs-item">
        <span class="fs-label">Food</span>
        <span class="mono fs-val" style="color:var(--amber)">{{ filterFood }}</span>
      </div>
    </div>

    <!-- Log list -->
    <div v-if="filteredLogs.length === 0" class="empty">
      <div class="empty-icon">📋</div>
      No logs match this filter
    </div>

    <TransitionGroup name="list" tag="div">
      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="log-card"
        :style="{ borderLeftColor: typeColor(log.type) }"
      >
        <!-- Top row -->
        <div class="lc-top">
          <span class="lc-icon">{{ typeIcon(log.type) }}</span>
          <div style="flex:1;min-width:0">
            <div class="lc-title">{{ log.title }}</div>
            <div class="lc-meta">
              <span v-if="log.category" class="chip chip-dim" style="font-size:10px;padding:2px 8px">{{ log.category }}</span>
              <span style="font-size:10px;color:var(--text-muted)">{{ log.date }} · {{ log.timeSlot }}</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span class="mono lc-amount" :style="{ color: log.type==='income'?'var(--green)':log.type==='food'?'var(--amber)':'var(--red)' }">
              {{ log.type==='income' ? '+' : '-' }}₹{{ log.amount?.toLocaleString('en-IN') }}
            </span>
            <div style="display:flex;gap:4px">
              <button class="edit-btn" @click="startEdit(log)">✏️</button>
              <button class="del-btn" @click="remove(log.id)">✕</button>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="log.tags?.length > 0" class="lc-tags">
          <span v-for="tag in log.tags" :key="tag" class="tag-badge" :style="tagStyle(tag)">{{ tag }}</span>
        </div>

        <!-- Extra info row -->
        <div v-if="log.quantity||log.quality||log.mood||log.regret||log.note" class="lc-extra">
          <span v-if="log.quantity">{{ log.quantity }} {{ log.unit }}</span>
          <span v-if="log.quality">{{ log.quality }}</span>
          <span v-if="log.mood">{{ moodEmoji(log.mood) }} {{ log.mood }}</span>
          <span v-if="log.regret" style="color:var(--red)">😬 regret</span>
          <span v-if="log.note" style="font-style:italic">"{{ log.note }}"</span>
        </div>

        <!-- Custom fields -->
        <div v-if="log.custom && Object.keys(log.custom).length > 0" class="lc-custom">
          <span v-for="(val,key) in log.custom" :key="key" class="custom-kv">
            <span class="ck">{{ key }}</span>: <span class="cv">{{ val }}</span>
          </span>
        </div>
      </div>
    </TransitionGroup>

    <!-- Load more -->
    <div v-if="canLoadMore" style="text-align:center;margin-top:16px">
      <button class="btn btn-ghost" @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </div>

    <!-- Edit modal -->
    <Teleport to="body">
      <LogModal
        v-if="editLog"
        :edit-data="editLog"
        :edit-id="editLog.id"
        @close="editLog=null"
        @saved="onEdited"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getLogs, deleteLog } from '../firebase.js'
import LogModal from '../components/LogModal.vue'

const allLogs   = ref([])
const editLog   = ref(null)
const loadingMore = ref(false)
const canLoadMore = ref(false)
const loadedDays  = ref(30)

// Filters
const typeFilter = ref('')
const tagFilter  = ref('')
const dateFilter = ref('today')
const customDate = ref(new Date().toISOString().split('T')[0])
const today      = new Date().toISOString().split('T')[0]
const thisMonth  = new Date().toISOString().slice(0,7)

const typeFilters = [
  { v:'',        label:'All 📋'    },
  { v:'food',    label:'Food 🍽️'  },
  { v:'expense', label:'Expense 💸' },
  { v:'income',  label:'Income 💰' },
]
const dateFilters = [
  { v:'today',   label:'Today'   },
  { v:'week',    label:'Week'    },
  { v:'month',   label:'Month'   },
  { v:'all',     label:'All'     },
  { v:'custom',  label:'Custom'  },
]

// Expose addLog so App.vue can push new entries instantly
function addLog(log) {
  if (!allLogs.value.find(l=>l.id===log.id)) allLogs.value.unshift(log)
}
defineExpose({ addLog })

// All unique tags used across logs (for filter chips)
const allTagsUsed = computed(() => {
  const set = new Set()
  allLogs.value.forEach(l => (l.tags||[]).forEach(t => set.add(t)))
  return [...set].sort()
})

// Date-filtered base
const dateLogs = computed(() => {
  if (dateFilter.value==='today')  return allLogs.value.filter(l=>l.date===today)
  if (dateFilter.value==='week')   return allLogs.value.filter(l=>l.timestamp>=Date.now()-7*86400000)
  if (dateFilter.value==='month')  return allLogs.value.filter(l=>l.date?.startsWith(thisMonth))
  if (dateFilter.value==='custom') return allLogs.value.filter(l=>l.date===customDate.value)
  return allLogs.value
})

const filteredLogs = computed(() => {
  let list = dateLogs.value
  if (typeFilter.value) list = list.filter(l=>l.type===typeFilter.value)
  if (tagFilter.value)  list = list.filter(l=>l.tags?.includes(tagFilter.value))
  return list
})

// Summary numbers for filtered set
const filterSpend  = computed(() => filteredLogs.value.filter(l=>l.type!=='income').reduce((s,l)=>s+(l.amount||0),0))
const filterIncome = computed(() => filteredLogs.value.filter(l=>l.type==='income').reduce((s,l)=>s+(l.amount||0),0))
const filterFood   = computed(() => filteredLogs.value.filter(l=>l.type==='food').length)

// Helpers
function typeColor(t) { return t==='income'?'var(--green)':t==='food'?'var(--amber)':'var(--red)' }
function typeIcon(t)  { return { food:'🍽️', expense:'💸', income:'💰' }[t]||'📋' }
const moodMap = { happy:'😊', bored:'😑', stressed:'😤', tired:'😪', hungry:'🤤', neutral:'😐' }
function moodEmoji(m) { return moodMap[m]||'' }

const tagColorMap = {
  need:'#059669', want:'#d97706', waste:'#e11d48',
  healthy:'#059669', junk:'#e11d48', body:'#2563eb',
  outside:'#7c3aed', home:'#d97706', work:'#2563eb', savings:'#059669'
}
function tagStyle(tag) {
  const c = tagColorMap[tag]||'#9ca3af'
  return { background:c+'18', color:c, border:`1px solid ${c}33`, borderRadius:'100px', padding:'1px 7px', fontSize:'10px', fontWeight:'700' }
}

function startEdit(log) { editLog.value = { ...log } }

async function onEdited(updated) {
  editLog.value = null
  const idx = allLogs.value.findIndex(l=>l.id===updated.id)
  if (idx>=0) allLogs.value.splice(idx, 1, updated)
}

async function remove(id) {
  allLogs.value = allLogs.value.filter(l=>l.id!==id)
  try { await deleteLog(id) } catch(e) { console.error(e) }
}

async function loadMore() {
  loadingMore.value = true
  loadedDays.value += 30
  try {
    const logs = await getLogs(loadedDays.value)
    allLogs.value = logs
    canLoadMore.value = logs.length === loadedDays.value * 2 // rough heuristic
  } catch {}
  loadingMore.value = false
}

onMounted(async () => {
  try {
    const logs = await getLogs(30)
    allLogs.value = logs
    canLoadMore.value = logs.length >= 50
  } catch {}
})
</script>

<style scoped>
/* Filter */
.filter-bar { margin-bottom:10px; }
.filter-chip { padding:6px 14px; border-radius:100px; border:1.5px solid var(--border); background:var(--surface); color:var(--text-muted); font-family:var(--ff); font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; flex-shrink:0; }
.filter-chip:active { transform:scale(.95); }
.fc-active   { background:var(--blue);   color:#fff; border-color:var(--blue); }
.fc-tag      { border-style:dashed; }
.fc-tag-active { background:var(--purple); color:#fff; border-color:var(--purple); border-style:solid; }

/* Filter summary */
.filter-summary { display:flex; gap:0; background:var(--surface); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; margin-bottom:14px; box-shadow:var(--shadow-sm); }
.fs-item  { flex:1; padding:10px 8px; text-align:center; border-right:1px solid var(--border); }
.fs-item:last-child { border-right:none; }
.fs-label { display:block; font-size:9px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:var(--text-muted); margin-bottom:3px; }
.fs-val   { font-size:15px; font-weight:800; }

/* Log cards */
.log-card { background:var(--surface); border:1px solid var(--border); border-left-width:3px; border-radius:var(--r); padding:12px 14px; margin-bottom:8px; box-shadow:var(--shadow-sm); animation:fadeUp .22s ease; }

.lc-top   { display:flex; align-items:flex-start; gap:10px; }
.lc-icon  { font-size:22px; flex-shrink:0; margin-top:1px; }
.lc-title { font-size:14px; font-weight:700; margin-bottom:4px; }
.lc-meta  { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.lc-amount { font-size:16px; font-weight:800; }

.lc-tags  { display:flex; gap:5px; flex-wrap:wrap; margin-top:8px; }

.lc-extra { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; font-size:11px; color:var(--text-dim); border-top:1px solid var(--border); padding-top:6px; }
.lc-extra span { display:flex; align-items:center; gap:3px; }

.lc-custom { display:flex; gap:8px; flex-wrap:wrap; margin-top:6px; font-size:11px; }
.custom-kv { background:var(--bg3); border-radius:6px; padding:2px 8px; }
.ck { color:var(--text-muted); font-weight:600; }
.cv { color:var(--text-dim); }
</style>
