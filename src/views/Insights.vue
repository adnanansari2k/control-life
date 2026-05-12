<template>
  <div class="page" style="padding-top:4px">
    <div class="ph" style="padding-right:48px">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--blue-text);margin-bottom:2px">📈 INSIGHTS</div>
        <div class="pt">Patterns</div>
      </div>
      <div class="period-toggle">
        <button :class="['pt-btn', period==='week' &&'pt-on']" @click="period='week'">Week</button>
        <button :class="['pt-btn', period==='month'&&'pt-on']" @click="period='month'">Month</button>
      </div>
    </div>

    <!-- ── PIE CHART ── -->
    <div class="sl" style="margin-top:0">Spending Breakdown</div>
    <div class="pie-tabs">
      <button v-for="m in pieModes" :key="m.k" :class="['pie-tab', pieMode===m.k&&'pie-on']" @click="pieMode=m.k; activeSeg=null">{{ m.label }}</button>
    </div>

    <div class="card pie-card">
      <div v-if="pieSegments.length===0" class="empty" style="padding:20px">No data yet</div>
      <template v-else>
        <div class="pie-wrap">
          <!-- SVG donut -->
          <svg viewBox="0 0 200 200" class="pie-svg">
            <g transform="translate(100,100)">
              <path
                v-for="(seg,i) in pieSegments" :key="i"
                :d="seg.d"
                :fill="seg.color"
                :opacity="activeSeg===null||activeSeg===i?1:.3"
                stroke="#fff" stroke-width="2.5"
                style="cursor:pointer;transition:opacity .2s"
                @click="activeSeg = activeSeg===i?null:i"
              />
              <!-- Centre text -->
              <text text-anchor="middle" dy="-8" style="font-size:13px;font-weight:800;fill:#111827;font-family:Outfit,sans-serif">
                {{ activeSeg!==null ? pieSegments[activeSeg]?.label : '₹'+totalPie.toLocaleString('en-IN') }}
              </text>
              <text text-anchor="middle" dy="9" style="font-size:9px;fill:#9ca3af;font-family:Outfit,sans-serif">
                {{ activeSeg!==null ? pieSegments[activeSeg]?.pct+'%' : pieModes.find(m=>m.k===pieMode)?.label }}
              </text>
            </g>
          </svg>

          <!-- Legend -->
          <div class="pie-legend">
            <div
              v-for="(seg,i) in pieSegments" :key="i"
              class="ple-row"
              :class="{ 'ple-active': activeSeg===i }"
              @click="activeSeg = activeSeg===i?null:i"
            >
              <span class="ple-dot" :style="{ background: seg.color }"></span>
              <span class="ple-name">{{ seg.label }}</span>
              <span class="ple-pct mono">{{ seg.pct }}%</span>
            </div>
          </div>
        </div>

        <!-- Active segment detail -->
        <div v-if="activeSeg!==null && pieSegments[activeSeg]" class="seg-detail">
          <span style="font-size:20px">{{ pieSegments[activeSeg].icon }}</span>
          <div>
            <div style="font-weight:700;font-size:14px">{{ pieSegments[activeSeg].label }}</div>
            <div style="font-size:12px;color:var(--text-dim)">{{ pieSegments[activeSeg].pct }}% · {{ pieSegments[activeSeg].count > 0 ? pieSegments[activeSeg].count+' entries · ' : '' }}₹{{ pieSegments[activeSeg].value.toLocaleString('en-IN') }}</div>
          </div>
        </div>
      </template>
    </div>

    <!-- ── BAR GRAPH ── -->
    <div class="sl">Spending Over Time</div>
    <div class="card bar-card">
      <div class="graph-tabs">
        <button :class="['g-tab', graphMode==='day'  &&'g-on']" @click="graphMode='day'">Day</button>
        <button :class="['g-tab', graphMode==='week' &&'g-on']" @click="graphMode='week'">Week</button>
        <button :class="['g-tab', graphMode==='month'&&'g-on']" @click="graphMode='month'">Month</button>
      </div>
      <div class="graph-area">
        <div class="y-axis">
          <span>₹{{ yMax.toLocaleString('en-IN') }}</span>
          <span>₹{{ Math.round(yMax/2).toLocaleString('en-IN') }}</span>
          <span>₹0</span>
        </div>
        <div class="bars-wrap">
          <div v-for="pt in graphPoints" :key="pt.label" class="bar-col" @click="selBar=selBar===pt.label?null:pt.label">
            <div v-if="selBar===pt.label" class="bar-tip">₹{{ pt.value.toLocaleString('en-IN') }}</div>
            <div class="bar-outer">
              <div class="bar-fill" :style="{ height: yMax>0?(pt.value/yMax*100)+'%':'0%', background: pt.value>avgSpend*1.3?'var(--red)':pt.value>avgSpend*.7?'var(--blue)':'var(--green)' }"></div>
            </div>
            <div class="bar-lbl" :style="{ color: pt.isHigh?'var(--red)':'var(--text-muted)', fontWeight: pt.isHigh?700:400 }">{{ pt.label }}</div>
          </div>
        </div>
      </div>
      <div class="bar-legend">
        <span><span class="bl-dot" style="background:var(--green)"></span>Below avg</span>
        <span><span class="bl-dot" style="background:var(--blue)"></span>Normal</span>
        <span><span class="bl-dot" style="background:var(--red)"></span>Above avg</span>
      </div>
      <div class="bar-summary">
        <div class="bs-item"><div class="bs-v mono" style="color:var(--red)">₹{{ graphTotal.toLocaleString('en-IN') }}</div><div class="bs-l">Total</div></div>
        <div class="bs-item"><div class="bs-v mono" style="color:var(--amber)">₹{{ Math.round(avgSpend).toLocaleString('en-IN') }}</div><div class="bs-l">Avg</div></div>
        <div class="bs-item"><div class="bs-v mono" style="color:var(--blue)">₹{{ peak.toLocaleString('en-IN') }}</div><div class="bs-l">Peak</div></div>
      </div>
    </div>

    <!-- ── KEY NUMBERS ── -->
    <div class="sl">Key Numbers</div>
    <div class="metrics-grid">
      <div class="mc" style="border-left:3px solid var(--red)">
        <div style="font-size:15px;margin-bottom:4px">💸</div>
        <div class="mc-v mono" style="color:var(--red)">₹{{ pSpend.toLocaleString('en-IN') }}</div>
        <div class="mc-l">Expenses</div>
        <div class="mc-chg" :style="{ color: spendChg>=0?'var(--red)':'var(--green)' }">{{ spendChg>=0?'+':'' }}{{ spendChg }}% vs last</div>
      </div>
      <div class="mc" style="border-left:3px solid var(--green)">
        <div style="font-size:15px;margin-bottom:4px">💰</div>
        <div class="mc-v mono" style="color:var(--green)">₹{{ pIncome.toLocaleString('en-IN') }}</div>
        <div class="mc-l">Income</div>
      </div>
      <div class="mc" style="border-left:3px solid var(--amber)">
        <div style="font-size:15px;margin-bottom:4px">🍽️</div>
        <div class="mc-v mono" style="color:var(--amber)">{{ pFood }}</div>
        <div class="mc-l">Food Logs</div>
      </div>
      <div class="mc" style="border-left:3px solid var(--purple)">
        <div style="font-size:15px;margin-bottom:4px">😬</div>
        <div class="mc-v mono" style="color:var(--purple)">{{ pRegrets }}</div>
        <div class="mc-l">Regrets</div>
      </div>
    </div>

    <!-- ── PATTERNS ── -->
    <div class="sl">Detected Patterns</div>
    <div v-if="patterns.length===0" class="empty" style="padding:24px"><div class="empty-icon">🧠</div>Log more to detect patterns</div>
    <div v-for="p in patterns" :key="p.text" class="pat-card" :style="{ borderLeftColor: p.color }">
      <span style="font-size:20px;flex-shrink:0">{{ p.icon }}</span>
      <div>
        <div style="font-size:13px;color:var(--text-dim);line-height:1.4;margin-bottom:3px">{{ p.text }}</div>
        <div style="font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase" :style="{ color: p.color }">{{ p.type }}</div>
      </div>
    </div>

    <!-- ── GOALS ── -->
    <div class="sl">Daily Goals</div>
    <div class="card" style="margin-bottom:28px">
      <div class="goal-row">
        <span class="fl" style="margin:0;flex:1">Max Daily Spend ₹</span>
        <input v-model.number="goalsEdit.maxSpend" class="input mono" style="width:90px;text-align:right;padding:8px 10px;font-size:14px" type="number" placeholder="0" @change="saveGoalsLocal" />
      </div>
      <div style="height:10px"></div>
      <div class="goal-row">
        <span class="fl" style="margin:0;flex:1">Max Junk / Day</span>
        <input v-model.number="goalsEdit.maxJunk" class="input mono" style="width:90px;text-align:right;padding:8px 10px;font-size:14px" type="number" placeholder="0" @change="saveGoalsLocal" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getLogs, getGoals, saveGoals } from '../firebase.js'

const logs      = ref([])
const period    = ref('week')
const pieMode   = ref('type')
const graphMode = ref('day')
const activeSeg = ref(null)
const selBar    = ref(null)
const goalsEdit = ref({ maxSpend:0, maxJunk:0 })

// period helpers
const days      = computed(() => period.value==='week'?7:30)
const since     = computed(() => Date.now()-days.value*86400000)
const prevSince = computed(() => Date.now()-days.value*2*86400000)

const pLogs     = computed(() => logs.value.filter(l=>l.timestamp>=since.value))
const prevLogs  = computed(() => logs.value.filter(l=>l.timestamp>=prevSince.value&&l.timestamp<since.value))

const pSpend    = computed(() => pLogs.value.filter(l=>l.type!=='income').reduce((s,l)=>s+(l.amount||0),0))
const prevSpend = computed(() => prevLogs.value.filter(l=>l.type!=='income').reduce((s,l)=>s+(l.amount||0),0))
const spendChg  = computed(() => prevSpend.value===0?0:Math.round(((pSpend.value-prevSpend.value)/prevSpend.value)*100))
const pIncome   = computed(() => pLogs.value.filter(l=>l.type==='income').reduce((s,l)=>s+(l.amount||0),0))
const pFood     = computed(() => pLogs.value.filter(l=>l.type==='food').length)
const pRegrets  = computed(() => pLogs.value.filter(l=>l.regret).length)

// ── PIE ───────────────────────────────────────────────────────────────────
const pieModes = [
  { k:'type',     label:'By Type'     },
  { k:'tags',     label:'By Tags'     },
  { k:'category', label:'By Category' },
  { k:'quality',  label:'Food Quality'},
  { k:'timeSlot', label:'By Time'     },
]

const PIE_COLORS = ['#059669','#2563eb','#d97706','#e11d48','#7c3aed','#06b6d4','#84cc16','#f97316','#ec4899']

const pieData = computed(() => {
  const expLogs = pLogs.value.filter(l=>l.type!=='income')
  const total   = expLogs.reduce((s,l)=>s+(l.amount||0),0)||1

  if (pieMode.value==='type') {
    const groups = {}
    pLogs.value.forEach(l=>{ groups[l.type]=(groups[l.type]||0)+(l.amount||0) })
    const icons = { food:'🍽️', expense:'💸', income:'💰' }
    return Object.entries(groups).map(([k,v],i)=>({ label:k, value:v, count:0, pct:Math.round(v/Math.max(v,1)*100), color:PIE_COLORS[i%PIE_COLORS.length], icon:icons[k]||'📋' }))
      .map(x=>({ ...x, pct: Math.round(x.value/pLogs.value.reduce((s,l)=>s+(l.amount||0),1)*100) }))
  }

  if (pieMode.value==='tags') {
    const groups = {}
    expLogs.forEach(l=>(l.tags||[]).forEach(t=>{ groups[t]=(groups[t]||0)+(l.amount||0) }))
    return Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v],i)=>({
      label:k, value:v, count:0, pct:Math.round(v/total*100), color:PIE_COLORS[i%PIE_COLORS.length], icon:'🏷️'
    })).filter(x=>x.value>0)
  }

  if (pieMode.value==='category') {
    const groups = {}
    expLogs.filter(l=>l.category).forEach(l=>{ groups[l.category]=(groups[l.category]||0)+(l.amount||0) })
    return Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v],i)=>({
      label:k, value:v, count:0, pct:Math.round(v/total*100), color:PIE_COLORS[i%PIE_COLORS.length], icon:'📦'
    })).filter(x=>x.value>0)
  }

  if (pieMode.value==='quality') {
    const foodLogs = pLogs.value.filter(l=>l.type==='food'&&l.quality)
    const tot2     = foodLogs.length||1
    const groups   = {}
    foodLogs.forEach(l=>{ groups[l.quality]=(groups[l.quality]||0)+1 })
    const qColors  = { 'very good':'#059669', good:'#84cc16', neutral:'#d97706', bad:'#f97316', 'very bad':'#e11d48' }
    const qIcons   = { 'very good':'🌟', good:'✅', neutral:'⚖️', bad:'❌', 'very bad':'💀' }
    return Object.entries(groups).map(([k,v])=>({ label:k, value:v, count:v, pct:Math.round(v/tot2*100), color:qColors[k]||'#9ca3af', icon:qIcons[k]||'❓' }))
      .filter(x=>x.value>0)
  }

  if (pieMode.value==='timeSlot') {
    const groups = {}
    expLogs.forEach(l=>{ if(l.timeSlot) groups[l.timeSlot]=(groups[l.timeSlot]||0)+(l.amount||0) })
    const tColors = { morning:'#d97706', afternoon:'#2563eb', evening:'#e11d48', night:'#7c3aed' }
    const tIcons  = { morning:'☀️', afternoon:'🌤', evening:'🌆', night:'🌙' }
    return Object.entries(groups).map(([k,v],i)=>({ label:k, value:v, count:0, pct:Math.round(v/total*100), color:tColors[k]||PIE_COLORS[i], icon:tIcons[k]||'🕐' }))
      .filter(x=>x.value>0)
  }
  return []
})

const totalPie = computed(() => pieData.value.reduce((s,d)=>s+d.value,0))

// SVG arc
function arc(start, end, r=80) {
  if (end-start>=Math.PI*2) end=start+Math.PI*2-0.001
  const x1=r*Math.cos(start), y1=r*Math.sin(start)
  const x2=r*Math.cos(end),   y2=r*Math.sin(end)
  return `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${end-start>Math.PI?1:0} 1 ${x2} ${y2} Z`
}

const pieSegments = computed(() => {
  const data  = pieData.value
  const total = data.reduce((s,d)=>s+d.value,0)||1
  let angle   = -Math.PI/2
  return data.map(d => {
    const slice = (d.value/total)*Math.PI*2
    const seg   = { ...d, d: arc(angle, angle+slice) }
    angle += slice
    return seg
  })
})

// ── BAR GRAPH ─────────────────────────────────────────────────────────────
const graphPoints = computed(() => {
  const all = logs.value.filter(l=>l.type!=='income')

  if (graphMode.value==='day') {
    const pts = Array.from({length:14},(_,i)=>{
      const d=new Date(Date.now()-(13-i)*86400000); const ds=d.toISOString().split('T')[0]
      return { label:d.toLocaleDateString('en-IN',{weekday:'short'}).slice(0,2), value:all.filter(l=>l.date===ds).reduce((s,l)=>s+(l.amount||0),0), isHigh:false }
    })
    const peak = Math.max(...pts.map(p=>p.value))
    return pts.map(p=>({ ...p, isHigh: p.value===peak&&peak>0 }))
  }

  if (graphMode.value==='week') {
    const pts = Array.from({length:8},(_,i)=>{
      const we=new Date(Date.now()-i*7*86400000); const ws=new Date(we-6*86400000)
      const wsS=ws.toISOString().split('T')[0], weS=we.toISOString().split('T')[0]
      return { label:`W${ws.getDate()}`, value:all.filter(l=>l.date>=wsS&&l.date<=weS).reduce((s,l)=>s+(l.amount||0),0), isHigh:false }
    }).reverse()
    const peak = Math.max(...pts.map(p=>p.value))
    return pts.map(p=>({ ...p, isHigh: p.value===peak&&peak>0 }))
  }

  const pts = Array.from({length:6},(_,i)=>{
    const d=new Date(); d.setMonth(d.getMonth()-(5-i))
    const mS=d.toISOString().slice(0,7)
    return { label:d.toLocaleDateString('en-IN',{month:'short'}), value:all.filter(l=>l.date?.startsWith(mS)).reduce((s,l)=>s+(l.amount||0),0), isHigh:false }
  })
  const peak2=Math.max(...pts.map(p=>p.value))
  return pts.map(p=>({ ...p, isHigh:p.value===peak2&&peak2>0 }))
})

const graphTotal = computed(() => graphPoints.value.reduce((s,p)=>s+p.value,0))
const peak       = computed(() => Math.max(0,...graphPoints.value.map(p=>p.value)))
const avgSpend   = computed(() => { const nz=graphPoints.value.filter(p=>p.value>0); return nz.length?graphTotal.value/nz.length:0 })
const yMax       = computed(() => Math.ceil(peak.value/100)*100||100)

// ── PATTERNS ─────────────────────────────────────────────────────────────
const patterns = computed(() => {
  const ps = []
  // Evening junk
  const evJunk = pLogs.value.filter(l=>l.tags?.includes('junk')&&l.timeSlot==='evening')
  if (new Set(evJunk.map(l=>l.date)).size>=3) ps.push({ icon:'🌆', text:`Evening junk eating pattern — ${new Set(evJunk.map(l=>l.date)).size} days detected`, type:'Body Pattern', color:'var(--amber)' })
  // Waste spending
  const wasteAmt = pLogs.value.filter(l=>l.tags?.includes('waste')).reduce((s,l)=>s+(l.amount||0),0)
  if (wasteAmt>pSpend.value*.3) ps.push({ icon:'💸', text:`Over 30% spending tagged as waste this ${period.value}`, type:'Money Alert', color:'var(--red)' })
  // Impulse
  const impulse = pLogs.value.filter(l=>l.reason==='impulse').reduce((s,l)=>s+(l.amount||0),0)
  if (impulse>0) ps.push({ icon:'⚡', text:`₹${impulse.toLocaleString('en-IN')} on impulse this ${period.value}`, type:'Pattern', color:'var(--amber)' })
  // Spend trend
  if (spendChg.value>20)  ps.push({ icon:'📈', text:`Spending up ${spendChg.value}% vs last ${period.value}`, type:'Trend Alert', color:'var(--red)' })
  if (spendChg.value<-10) ps.push({ icon:'📉', text:`Spending down ${Math.abs(spendChg.value)}% vs last ${period.value}!`, type:'Good Trend', color:'var(--green)' })
  // Healthy food
  const healthy = pLogs.value.filter(l=>l.tags?.includes('healthy')).length
  if (healthy>=5) ps.push({ icon:'🥗', text:`${healthy} healthy food choices this ${period.value} — great!`, type:'Positive', color:'var(--green)' })
  // Regret
  if (pRegrets.value>5) ps.push({ icon:'😬', text:`${pRegrets.value} regrets this ${period.value} — review your habits`, type:'Habit Alert', color:'var(--red)' })
  return ps
})

async function saveGoalsLocal() {
  try { await saveGoals({ ...goalsEdit.value }) } catch { localStorage.setItem('lcs_goals', JSON.stringify(goalsEdit.value)) }
}

onMounted(async () => {
  try {
    const [ls, gl] = await Promise.all([getLogs(60), getGoals()])
    logs.value=ls; goalsEdit.value=gl
  } catch { try { const g=localStorage.getItem('lcs_goals'); if(g) goalsEdit.value=JSON.parse(g) } catch {} }
})
</script>

<style scoped>
.period-toggle { display:flex; background:var(--bg3); border:1px solid var(--border); border-radius:100px; padding:3px; gap:2px; }
.pt-btn { padding:5px 13px; border-radius:100px; border:none; background:transparent; color:var(--text-muted); font-family:var(--ff); font-size:12px; font-weight:700; cursor:pointer; transition:all .18s; }
.pt-on  { background:var(--blue); color:#fff; }

/* Pie */
.pie-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
.pie-tab  { flex:1; min-width:70px; padding:7px 4px; border-radius:var(--rs); border:1.5px solid var(--border); background:var(--bg3); color:var(--text-muted); font-family:var(--ff); font-size:11px; font-weight:700; cursor:pointer; transition:all .18s; text-align:center; }
.pie-tab:active { transform:scale(.96); }
.pie-on   { background:var(--blue); color:#fff; border-color:var(--blue); }
.pie-card { padding:16px; }
.pie-wrap { display:flex; gap:14px; align-items:center; }
.pie-svg  { width:150px; height:150px; flex-shrink:0; }
.pie-legend { flex:1; display:flex; flex-direction:column; gap:5px; overflow:hidden; }
.ple-row  { display:flex; align-items:center; gap:7px; cursor:pointer; padding:3px 6px; border-radius:var(--rs); transition:background .15s; }
.ple-row:hover, .ple-active { background:var(--bg3); }
.ple-dot  { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
.ple-name { font-size:12px; color:var(--text-dim); flex:1; text-transform:capitalize; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ple-pct  { font-size:11px; font-weight:700; color:var(--text-muted); }
.seg-detail { display:flex; align-items:center; gap:12px; margin-top:12px; padding:10px 12px; background:var(--bg3); border-radius:var(--rs); }

/* Bar */
.bar-card { padding:16px; }
.graph-tabs { display:flex; gap:6px; margin-bottom:12px; }
.g-tab { flex:1; padding:7px 4px; border-radius:var(--rs); border:1.5px solid var(--border); background:var(--bg3); color:var(--text-muted); font-family:var(--ff); font-size:12px; font-weight:700; cursor:pointer; transition:all .18s; text-align:center; }
.g-on  { background:var(--blue); color:#fff; border-color:var(--blue); }
.graph-area { display:flex; gap:8px; height:140px; margin-bottom:10px; }
.y-axis { display:flex; flex-direction:column; justify-content:space-between; align-items:flex-end; width:52px; flex-shrink:0; font-size:9px; color:var(--text-muted); font-family:var(--mono); padding-bottom:18px; }
.bars-wrap { flex:1; display:flex; align-items:flex-end; gap:3px; overflow-x:auto; padding-bottom:18px; }
.bars-wrap::-webkit-scrollbar { display:none; }
.bar-col  { flex:1; min-width:18px; display:flex; flex-direction:column; align-items:center; gap:3px; height:100%; position:relative; cursor:pointer; }
.bar-tip  { position:absolute; top:-26px; left:50%; transform:translateX(-50%); background:var(--text); color:#fff; font-size:10px; font-weight:700; padding:3px 6px; border-radius:6px; white-space:nowrap; font-family:var(--mono); z-index:10; }
.bar-outer { flex:1; width:100%; background:var(--bg3); border-radius:4px; display:flex; align-items:flex-end; overflow:hidden; }
.bar-fill  { width:100%; min-height:3px; border-radius:4px; transition:height .5s cubic-bezier(.4,0,.2,1); }
.bar-lbl   { font-size:9px; text-align:center; color:var(--text-muted); }
.bar-legend { display:flex; gap:14px; justify-content:center; font-size:11px; color:var(--text-muted); margin-bottom:10px; }
.bl-dot  { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:4px; vertical-align:middle; }
.bar-summary { display:flex; background:var(--bg3); border-radius:var(--rs); overflow:hidden; }
.bs-item { flex:1; padding:10px 6px; text-align:center; border-right:1px solid var(--border); }
.bs-item:last-child { border-right:none; }
.bs-v { font-size:14px; font-weight:800; }
.bs-l { font-size:10px; color:var(--text-muted); margin-top:2px; }

/* Metrics */
.metrics-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.mc   { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px; box-shadow:var(--shadow-sm); }
.mc-v { font-size:20px; font-weight:800; letter-spacing:-.5px; }
.mc-l { font-size:10px; color:var(--text-muted); letter-spacing:.5px; text-transform:uppercase; margin-top:2px; }
.mc-chg { font-size:10px; font-weight:700; font-family:var(--mono); margin-top:6px; }

/* Patterns */
.pat-card { display:flex; align-items:flex-start; gap:12px; padding:14px; background:var(--surface); border:1px solid var(--border); border-left-width:3px; border-radius:var(--rs); margin-bottom:8px; box-shadow:var(--shadow-sm); }

/* Goals */
.goal-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
</style>
