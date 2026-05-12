<template>
  <div class="page" style="padding-top:4px">
    <div class="ph" style="padding-right:48px">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px">{{ greeting }}</div>
        <div class="pt">{{ todayLabel }}</div>
      </div>
      <div class="energy-pill" @click="showEnergy=true">
        {{ energyEmoji }} <span class="mono" style="font-size:12px;font-weight:700;color:var(--amber)">{{ energyLevel }}/5</span>
      </div>
    </div>

    <!-- Yesterday message -->
    <div v-if="yMsg" class="y-msg">💬 {{ yMsg }}</div>

    <!-- Big 3 stats -->
    <div class="stats-row">
      <div class="stat-card" style="border-left:3px solid var(--red)">
        <div class="stat-num mono" style="color:var(--red)">₹{{ todayExpense.toLocaleString('en-IN') }}</div>
        <div class="stat-lbl">Spent Today</div>
      </div>
      <div class="stat-card" style="border-left:3px solid var(--green)">
        <div class="stat-num mono" style="color:var(--green)">₹{{ todayIncome.toLocaleString('en-IN') }}</div>
        <div class="stat-lbl">Earned Today</div>
      </div>
      <div class="stat-card" style="border-left:3px solid var(--amber)">
        <div class="stat-num mono" style="color:var(--amber)">{{ todayFood }}</div>
        <div class="stat-lbl">Food Entries</div>
      </div>
    </div>

    <!-- Waste score -->
    <div class="card" :class="wsClass" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted)">Waste Score</span>
        <span class="mono" style="font-size:22px;font-weight:700" :style="{ color: wsColor }">{{ wasteScore }}%</span>
      </div>
      <div class="progress-bar" style="margin:8px 0">
        <div class="progress-fill" :style="{ width: wasteScore+'%', background: wsColor }"></div>
      </div>
      <div style="font-size:12px;color:var(--text-dim)">{{ wsMsg }}</div>
    </div>

    <!-- Tag breakdown -->
    <div v-if="tagBreakdown.length > 0">
      <div class="sl">Today's Tag Breakdown</div>
      <div class="tag-row">
        <div v-for="t in tagBreakdown" :key="t.tag" class="tag-stat">
          <span class="ts-label">{{ t.tag }}</span>
          <span class="ts-val mono">{{ t.count > 0 && t.amount === 0 ? t.count+'×' : '₹'+t.amount.toLocaleString('en-IN') }}</span>
        </div>
      </div>
    </div>

    <!-- Insights -->
    <div class="sl">Today's Insights</div>
    <div v-if="insights.length===0" class="empty" style="padding:24px">
      <div class="empty-icon">🌱</div>Log something to see insights
    </div>
    <div v-for="ins in insights" :key="ins.text" class="ins-item" :style="{ borderLeftColor: ins.color }">
      <span style="font-size:16px">{{ ins.icon }}</span>
      <span>{{ ins.text }}</span>
    </div>

    <!-- Goal -->
    <template v-if="goals.maxSpend > 0">
      <div class="sl">Daily Goal</div>
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;color:var(--text-dim)">Spend Limit</span>
          <span class="mono" style="font-size:13px;font-weight:700" :style="{ color: todayExpense>goals.maxSpend?'var(--red)':'var(--green)' }">
            ₹{{ todayExpense }} / ₹{{ goals.maxSpend }}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: Math.min(100,(todayExpense/goals.maxSpend)*100)+'%', background: todayExpense>goals.maxSpend?'var(--red)':'var(--green)' }"></div>
        </div>
      </div>
    </template>

    <!-- Recent logs -->
    <div class="sl" style="display:flex;align-items:center;justify-content:space-between">
      <span>Recent Logs</span>
      <RouterLink to="/logs" style="font-size:11px;color:var(--blue);text-decoration:none;font-weight:600">View all →</RouterLink>
    </div>
    <div v-if="recentLogs.length===0" class="empty" style="padding:20px">
      <div class="empty-icon">📋</div>No logs yet today
    </div>
    <div v-for="log in recentLogs" :key="log.id" class="log-item" :style="{ borderLeftColor: typeColor(log.type) }">
      <span style="font-size:20px">{{ typeIcon(log.type) }}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:600;margin-bottom:2px">{{ log.title }}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span v-if="log.category" class="chip chip-dim" style="font-size:10px;padding:2px 8px">{{ log.category }}</span>
          <span v-for="tag in log.tags.slice(0,2)" :key="tag" class="tag-badge" :style="tagBadgeStyle(tag)">{{ tag }}</span>
          <span style="font-size:10px;color:var(--text-muted)">{{ log.timeSlot }}</span>
        </div>
      </div>
      <span class="mono" style="font-size:15px;font-weight:800;flex-shrink:0" :style="{ color: log.type==='income'?'var(--green)':log.type==='food'?'var(--amber)':'var(--red)' }">
        {{ log.type==='income' ? '+' : '-' }}₹{{ log.amount?.toLocaleString('en-IN') }}
      </span>
    </div>

    <!-- Energy Modal -->
    <Teleport to="body">
      <div v-if="showEnergy" class="overlay" @click.self="showEnergy=false">
        <div class="sheet">
          <div class="handle"></div>
          <div class="sh-title">Energy today?</div>
          <div style="display:flex;gap:8px;justify-content:space-between">
            <button v-for="n in 5" :key="n" class="e-opt" :class="{ 'e-sel': energyLevel===n }" @click="setEnergy(n)">
              <span style="font-size:26px">{{ ['😴','😪','😐','😊','🔥'][n-1] }}</span>
              <span style="font-size:11px;font-weight:700;color:var(--text-muted)">{{ n }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getLogs, getGoals, saveEnergy, getEnergy } from '../firebase.js'

const allLogs     = ref([])
const goals       = ref({ maxSpend:0, maxJunk:0 })
const energyLevel = ref(4)
const showEnergy  = ref(false)
const today       = new Date().toISOString().split('T')[0]
const yesterday   = new Date(Date.now()-86400000).toISOString().split('T')[0]

// expose so App.vue can push new logs instantly
function addLog(log) { if (!allLogs.value.find(l=>l.id===log.id)) allLogs.value.unshift(log) }
defineExpose({ addLog })

const greeting = computed(() => {
  const h = new Date().getHours()
  return h<12 ? 'Good Morning 👋' : h<17 ? 'Good Afternoon' : h<21 ? 'Good Evening' : 'Good Night'
})
const todayLabel  = computed(() => new Date().toLocaleDateString('en-IN',{ weekday:'long', day:'numeric', month:'short' }))
const energyEmoji = computed(() => ['😴','😪','😐','😊','🔥'][energyLevel.value-1])

const todayLogs   = computed(() => allLogs.value.filter(l=>l.date===today))
const recentLogs  = computed(() => todayLogs.value.slice(0,5))
const todayExpense= computed(() => todayLogs.value.filter(l=>l.type!=='income').reduce((s,l)=>s+(l.amount||0),0))
const todayIncome = computed(() => todayLogs.value.filter(l=>l.type==='income').reduce((s,l)=>s+(l.amount||0),0))
const todayFood   = computed(() => todayLogs.value.filter(l=>l.type==='food').length)
const todayWaste  = computed(() => todayLogs.value.filter(l=>l.tags?.includes('waste')).reduce((s,l)=>s+(l.amount||0),0))
const junkCount   = computed(() => todayLogs.value.filter(l=>l.tags?.includes('junk')).length)

const wasteScore  = computed(() => {
  if (todayExpense.value===0 && junkCount.value===0) return 0
  const wp = todayExpense.value>0 ? (todayWaste.value/todayExpense.value)*100 : 0
  return Math.min(100, Math.round(wp + junkCount.value*5))
})
const wsColor = computed(() => wasteScore.value<30?'var(--green)':wasteScore.value<60?'var(--amber)':'var(--red)')
const wsClass = computed(() => wasteScore.value<30?'card card-green':wasteScore.value<60?'card card-amber':'card card-red')
const wsMsg   = computed(() => wasteScore.value<30?'✅ Doing great today':wasteScore.value<60?'⚠️ Watch your waste':'🔴 High waste day')

// yesterday message
const yMsg = computed(() => {
  const yl = allLogs.value.filter(l=>l.date===yesterday)
  const yw = yl.filter(l=>l.tags?.includes('waste')).reduce((s,l)=>s+(l.amount||0),0)
  const yj = yl.filter(l=>l.tags?.includes('junk')).length
  if (yw>0&&yj>0) return `Yesterday: ₹${yw} wasted + ${yj} junk entries. Fresh start!`
  if (yw>0) return `Yesterday you spent ₹${yw} on waste.`
  if (yj>0) return `Yesterday had ${yj} junk entries. Do better today 🌿`
  return null
})

// tag breakdown for today
const tagBreakdown = computed(() => {
  const map = {}
  todayLogs.value.forEach(l => {
    (l.tags||[]).forEach(t => {
      if (!map[t]) map[t] = { tag:t, count:0, amount:0 }
      map[t].count++
      map[t].amount += (l.amount||0)
    })
  })
  return Object.values(map).sort((a,b)=>b.amount-a.amount).slice(0,6)
})

const insights = computed(() => {
  const ins = []
  if (todayWaste.value>0)     ins.push({ icon:'💸', color:'var(--red)',   text:`₹${todayWaste.value} spent on waste today` })
  if (junkCount.value>=3)     ins.push({ icon:'🍟', color:'var(--red)',   text:`${junkCount.value} junk entries — too many!` })
  else if (junkCount.value>0) ins.push({ icon:'🍿', color:'var(--amber)', text:`${junkCount.value} junk entr${junkCount.value>1?'ies':'y'} today` })
  if (goals.value.maxSpend>0&&todayExpense.value>goals.value.maxSpend)
    ins.push({ icon:'🚨', color:'var(--red)', text:`Over limit by ₹${todayExpense.value-goals.value.maxSpend}` })
  const healthy = todayLogs.value.filter(l=>l.tags?.includes('healthy')).length
  if (healthy>0) ins.push({ icon:'🥗', color:'var(--green)', text:`${healthy} healthy choice${healthy>1?'s':''} today` })
  return ins
})

// helpers
function typeColor(t) { return t==='income'?'var(--green)':t==='food'?'var(--amber)':'var(--red)' }
function typeIcon(t)  { return { food:'🍽️', expense:'💸', income:'💰' }[t]||'📋' }

const tagColorMap = { need:'var(--green)', want:'var(--amber)', waste:'var(--red)', healthy:'var(--green)', junk:'var(--red)', body:'var(--blue)', outside:'var(--purple)', home:'var(--amber)', work:'var(--blue)' }
function tagBadgeStyle(tag) {
  const c = tagColorMap[tag]||'var(--text-dim)'
  return { background: c+'22', color: c, border: `1px solid ${c}44`, borderRadius:'100px', padding:'1px 7px', fontSize:'10px', fontWeight:'700' }
}

async function setEnergy(n) {
  energyLevel.value = n; showEnergy.value = false
  try { await saveEnergy(n) } catch {}
}

onMounted(async () => {
  try {
    const [logs, gl, el] = await Promise.all([getLogs(7), getGoals(), getEnergy()])
    allLogs.value = logs; goals.value = gl
    const te = el.find(e=>e.date===today)
    if (te) energyLevel.value = te.level
  } catch {}
})
</script>

<style scoped>
.energy-pill { display:flex; align-items:center; gap:6px; background:var(--surface); border:1.5px solid var(--border); border-radius:100px; padding:7px 13px; cursor:pointer; box-shadow:var(--shadow-sm); font-size:17px; }
.energy-pill:active { transform:scale(.95); }

.y-msg { display:flex; align-items:flex-start; gap:10px; padding:11px 14px; background:var(--blue-dim); border:1px solid rgba(37,99,235,.15); border-radius:var(--r); margin-bottom:14px; font-size:13px; color:var(--text-dim); line-height:1.5; }

.stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }

.tag-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
.tag-stat { display:flex; flex-direction:column; align-items:center; padding:8px 12px; background:var(--surface); border:1px solid var(--border); border-radius:var(--rs); box-shadow:var(--shadow-sm); min-width:64px; }
.ts-label { font-size:9px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:var(--text-muted); margin-bottom:3px; }
.ts-val   { font-size:14px; font-weight:800; }

.e-opt { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; padding:14px 6px; background:var(--bg3); border:2px solid var(--border); border-radius:var(--rs); cursor:pointer; transition:all .2s; font-family:var(--ff); }
.e-opt:active { transform:scale(.94); }
.e-sel { border-color:var(--amber); background:var(--amber-dim); }
</style>
