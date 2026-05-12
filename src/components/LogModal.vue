<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="sheet">
      <div class="handle"></div>

      <!-- ══ STEP 1 — suggestions + type ══ -->
      <template v-if="step === 1">
        <div class="sh-title">Add Log</div>

        <!-- Suggestions -->
        <div v-if="suggestions.length > 0">
          <div class="sl" style="margin-top:0">Recent</div>
          <div class="s-scroll" style="margin-bottom:14px">
            <div
              v-for="s in suggestions" :key="s.id"
              class="s-pill"
              :class="s.type==='food'?'pill-food':s.type==='income'?'pill-income':'pill-expense'"
              style="position:relative"
            >
              <span @click="pick(s)" style="display:flex;align-items:center;gap:6px;flex:1;cursor:pointer">
                <span>{{ typeIcon(s.type) }}</span>
                <span>{{ s.title }}</span>
                <span v-if="s.amount" class="mono" style="font-size:11px;opacity:.7">₹{{ s.amount }}</span>
                <span v-if="s.useCount>1" class="use-badge">×{{ s.useCount }}</span>
              </span>
              <button class="pill-x" @click.stop="delSuggestion(s)">✕</button>
            </div>
          </div>
        </div>

        <!-- Type picker -->
        <div class="sl">Log type</div>
        <div class="type-grid">
          <button class="type-card tc-food"    @click="pickType('food')">
            <span class="tc-icon">🍽️</span>
            <span class="tc-name">Food</span>
            <span class="tc-sub">eating & drinking</span>
          </button>
          <button class="type-card tc-expense" @click="pickType('expense')">
            <span class="tc-icon">💸</span>
            <span class="tc-name">Expense</span>
            <span class="tc-sub">money spent</span>
          </button>
          <button class="type-card tc-income"  @click="pickType('income')">
            <span class="tc-icon">💰</span>
            <span class="tc-name">Income</span>
            <span class="tc-sub">money received</span>
          </button>
        </div>
      </template>

      <!-- ══ STEP 2 — main form ══ -->
      <template v-if="step === 2">
        <div class="step-hd">
          <button class="back-btn" @click="step=1">← Back</button>
          <span class="step-type-badge" :class="`stb-${form.type}`">{{ typeIcon(form.type) }} {{ form.type }}</span>
        </div>

        <!-- Title -->
        <div class="fg">
          <label class="fl">{{ form.type==='food' ? 'What did you eat/drink?' : form.type==='income' ? 'Income source' : 'What did you spend on?' }}</label>
          <input v-model="form.title" class="input" :placeholder="titlePlaceholder" />
        </div>

        <!-- Amount -->
        <div class="fg">
          <label class="fl">Amount ₹</label>
          <div class="amt-row">
            <span class="amt-pfx" :style="{ color: form.type==='income'?'var(--green-text)':form.type==='food'?'var(--amber-text)':'var(--red-text)', background: form.type==='income'?'var(--green-dim)':form.type==='food'?'var(--amber-dim)':'var(--red-dim)' }">₹</span>
            <input v-model.number="form.amount" class="input amt-input mono" type="number" placeholder="0" />
          </div>
        </div>

        <!-- Quantity + Unit (food) -->
        <div v-if="form.type==='food'" class="fg">
          <label class="fl">Quantity</label>
          <div style="display:flex;gap:8px">
            <input v-model="form.quantity" class="input" style="flex:1" type="number" placeholder="e.g. 2" min="0" step="0.5" />
            <select v-model="form.unit" class="input sel" style="width:120px">
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
        </div>

        <!-- Category -->
        <div class="fg">
          <label class="fl">Category</label>
          <input v-model="form.category" class="input" :placeholder="catPlaceholder" list="cat-list" />
          <datalist id="cat-list">
            <option v-for="c in catSuggestions" :key="c" :value="c" />
          </datalist>
        </div>

        <!-- Tags — multi select -->
        <div class="fg">
          <div class="field-hd">
            <label class="fl" style="margin:0">Tags</label>
            <button class="add-tag-btn" @click="showTagInput=!showTagInput">+ Custom tag</button>
          </div>
          <div class="chip-row" style="margin-bottom:8px">
            <span
              v-for="t in availableTags" :key="t.v"
              class="chip" :class="[`chip-${t.c}`, form.tags.includes(t.v)?`active-${t.c}`:'']"
              @click="toggleTag(t.v)"
            >{{ t.label }}</span>
          </div>
          <div v-if="showTagInput" style="display:flex;gap:8px;margin-top:6px">
            <input v-model="customTagInput" class="input" placeholder="e.g. gym, coffee" style="flex:1" @keyup.enter="addCustomTag" />
            <button class="btn btn-blue" style="padding:8px 14px" @click="addCustomTag">Add</button>
          </div>
          <!-- Selected custom tags -->
          <div v-if="customTags.length > 0" class="chip-row" style="margin-top:6px">
            <span v-for="t in customTags" :key="t" class="chip chip-purple active-purple" style="gap:6px">
              {{ t }}
              <span @click.stop="removeCustomTag(t)" style="cursor:pointer;opacity:.7;font-size:10px">✕</span>
            </span>
          </div>
        </div>

        <!-- Food-specific fields -->
        <template v-if="form.type==='food'">
          <div class="fg">
            <label class="fl">Quality</label>
            <div class="chip-row">
              <span v-for="q in qualities" :key="q.v" class="chip" :class="[`chip-${q.c}`, form.quality===q.v?`active-${q.c}`:'']" @click="form.quality=q.v">{{ q.label }}</span>
            </div>
          </div>
          <div class="fg">
            <label class="fl">Mood while eating</label>
            <div class="chip-row">
              <span v-for="m in moods" :key="m.v" class="chip chip-dim" :class="{ active: form.mood===m.v }" @click="form.mood=m.v">{{ m.label }}</span>
            </div>
          </div>
          <div class="fg">
            <label class="fl">Hunger</label>
            <div class="chip-row">
              <span v-for="h in hungers" :key="h.v" class="chip chip-dim" :class="{ active: form.hunger===h.v }" @click="form.hunger=h.v">{{ h.label }}</span>
            </div>
          </div>
        </template>

        <!-- Reason -->
        <div class="fg">
          <label class="fl">Reason</label>
          <div class="chip-row">
            <span v-for="r in reasons" :key="r.v" class="chip chip-dim" :class="{ active: form.reason===r.v }" @click="form.reason=r.v">{{ r.label }}</span>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="fg">
          <label class="fl">Date & Time</label>
          <div style="display:flex;gap:8px">
            <input v-model="form.date" class="input" type="date" style="flex:1" />
            <input v-model="form.time" class="input" type="time" style="width:110px" />
          </div>
        </div>

        <!-- Note -->
        <div class="fg">
          <label class="fl">Note (optional)</label>
          <input v-model="form.note" class="input" placeholder="Any extra detail…" />
        </div>

        <!-- Custom properties -->
        <div class="fg">
          <div class="field-hd">
            <label class="fl" style="margin:0">Custom Properties</label>
            <button class="add-tag-btn" @click="showCustomProps=!showCustomProps">
              {{ showCustomProps ? 'Hide' : '✏️ Edit' }}
            </button>
          </div>

          <!-- Show current custom values -->
          <div v-if="!showCustomProps && customFieldDefs.length > 0" class="custom-vals">
            <div v-for="f in customFieldDefs" :key="f.key" class="custom-val-row">
              <span class="cv-label">{{ f.label }}</span>
              <template v-if="f.fieldType==='toggle'">
                <label class="tgl">
                  <input type="checkbox" v-model="form.custom[f.key]" />
                  <div class="tgl-track"></div><div class="tgl-thumb"></div>
                </label>
              </template>
              <template v-else-if="f.fieldType==='select'">
                <select v-model="form.custom[f.key]" class="input sel" style="width:140px;padding:6px 10px">
                  <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
                </select>
              </template>
              <template v-else>
                <input v-model="form.custom[f.key]" class="input" :type="f.fieldType||'text'" style="width:140px;padding:8px 10px" :placeholder="f.placeholder||''" />
              </template>
            </div>
            <div v-if="customFieldDefs.length===0" style="font-size:12px;color:var(--text-muted)">No custom fields yet. Click Edit to add.</div>
          </div>

          <!-- Custom field editor -->
          <div v-if="showCustomProps" class="custom-editor">
            <div v-for="(f, i) in customFieldDefs" :key="i" class="cfe-row">
              <input v-model="f.label" class="input" placeholder="Field name" style="flex:1;padding:8px 10px" />
              <select v-model="f.fieldType" class="input sel" style="width:100px;padding:8px 6px">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="toggle">Toggle</option>
                <option value="select">Select</option>
              </select>
              <button class="del-btn" @click="removeCustomField(i)">✕</button>
            </div>
            <button class="btn btn-ghost btn-full" style="margin-top:8px" @click="addCustomField">+ Add Field</button>
            <button class="btn btn-blue btn-full" style="margin-top:8px" @click="saveCustomFields" :disabled="savingFields">
              {{ savingFields ? 'Saving…' : '💾 Save Fields' }}
            </button>
          </div>
        </div>

        <!-- Regret -->
        <div class="tgl-row fg">
          <span style="font-size:14px;color:var(--text-dim);font-weight:500">😬 Regret this?</span>
          <label class="tgl">
            <input type="checkbox" v-model="form.regret" />
            <div class="tgl-track"></div><div class="tgl-thumb"></div>
          </label>
        </div>

        <button
          class="btn btn-full" style="margin-top:16px"
          :class="form.type==='food'?'btn-amber':form.type==='income'?'btn-green':'btn-red'"
          @click="submit"
          :disabled="saving"
        >
          {{ saving ? 'Saving…' : editId ? '✏️ Update Log' : '+ Save Log' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  addLog, updateLog, getSuggestions, upsertSuggestion, deleteSuggestion,
  getCustomFields, saveCustomFields as saveCustomFieldsDB, userDocRef, getTimeSlot
} from '../firebase.js'
import { updateDoc } from 'firebase/firestore'

const emit  = defineEmits(['close', 'saved'])
const props = defineProps({
  editData: { type: Object, default: null },
  editId:   { type: String, default: null },
})

const step        = ref(1)
const saving      = ref(false)
const savingFields= ref(false)
const suggestions = ref([])
const showTagInput   = ref(false)
const showCustomProps= ref(false)
const customTagInput = ref('')
const customFieldDefs = ref([])  // [{ key, label, fieldType, options?, placeholder? }]

// ── static option lists ────────────────────────────────────────────────────
const units    = ['pieces','plates','cups','bowls','glasses','ml','g','kg','tbsp','tsp','servings']
const qualities= [
  { v:'very good', label:'🌟 Very Good', c:'green' },
  { v:'good',      label:'✅ Good',      c:'green' },
  { v:'neutral',   label:'⚖️ Neutral',  c:'amber' },
  { v:'bad',       label:'❌ Bad',       c:'red'   },
  { v:'very bad',  label:'💀 Very Bad',  c:'red'   },
]
const moods  = [
  { v:'happy',    label:'😊 Happy'   }, { v:'bored',    label:'😑 Bored'   },
  { v:'stressed', label:'😤 Stressed'}, { v:'tired',    label:'😪 Tired'   },
  { v:'hungry',   label:'🤤 Hungry'  }, { v:'neutral',  label:'😐 Neutral' },
]
const hungers = [
  { v:'low', label:'🟢 Low' }, { v:'medium', label:'🟡 Medium' }, { v:'high', label:'🔴 High' },
]
const reasons = [
  { v:'habit',     label:'🔁 Habit'    }, { v:'craving',  label:'🤤 Craving'  },
  { v:'social',    label:'👥 Social'   }, { v:'impulse',  label:'⚡ Impulse'  },
  { v:'planned',   label:'📋 Planned'  }, { v:'necessity',label:'✅ Necessity' },
  { v:'emergency', label:'🚨 Emergency'},
]

// All available tags with colour mapping
const availableTags = [
  { v:'need',    label:'✅ Need',    c:'green'  },
  { v:'want',    label:'🤔 Want',    c:'amber'  },
  { v:'waste',   label:'🗑️ Waste',  c:'red'    },
  { v:'healthy', label:'🥗 Healthy', c:'green'  },
  { v:'junk',    label:'🍟 Junk',    c:'red'    },
  { v:'body',    label:'💪 Body',    c:'blue'   },
  { v:'outside', label:'🌍 Outside', c:'purple' },
  { v:'home',    label:'🏠 Home',    c:'amber'  },
  { v:'work',    label:'💼 Work',    c:'blue'   },
  { v:'savings', label:'💰 Savings', c:'green'  },
]

const catSuggestions = computed(() => {
  if (form.value.type === 'food')    return ['fruit','vegetable','snack','meal','drink','fast food','street food','home cooked']
  if (form.value.type === 'income')  return ['salary','freelance','gift','refund','business','investment']
  return ['food','transport','rent','recharge','health','shopping','social','entertainment','education','misc']
})

const titlePlaceholder = computed(() => ({
  food:    'e.g. Banana, Chai, Rice…',
  expense: 'e.g. Auto, Petrol, Lunch…',
  income:  'e.g. Salary, Freelance…',
}[form.value.type]))

const catPlaceholder = computed(() => ({
  food:    'e.g. fruit, snack, meal…',
  expense: 'e.g. transport, rent…',
  income:  'e.g. salary, freelance…',
}[form.value.type]))

function typeIcon(t) { return { food:'🍽️', expense:'💸', income:'💰' }[t] || '📋' }

// ── form ───────────────────────────────────────────────────────────────────
function now() {
  const d = new Date()
  return {
    date: d.toISOString().split('T')[0],
    time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
  }
}

const defaultForm = () => ({
  title:'', amount:null, quantity:null, unit:'pieces',
  type:'expense', tags:[], category:null,
  quality:null, mood:null, hunger:null, reason:null,
  regret:false, note:null, custom:{},
  ...now(),
})

const form = ref(defaultForm())

// custom tags = tags on form that aren't in availableTags
const knownTagValues = availableTags.map(t => t.v)
const customTags = computed(() => form.value.tags.filter(t => !knownTagValues.includes(t)))

// edit mode
if (props.editData && props.editId) {
  form.value = { ...defaultForm(), ...props.editData }
  step.value = 2
}

// ── tag helpers ────────────────────────────────────────────────────────────
function toggleTag(v) {
  const idx = form.value.tags.indexOf(v)
  if (idx >= 0) form.value.tags.splice(idx, 1)
  else          form.value.tags.push(v)
}

function addCustomTag() {
  const t = customTagInput.value.trim().toLowerCase().replace(/\s+/g, '_')
  if (t && !form.value.tags.includes(t)) form.value.tags.push(t)
  customTagInput.value = ''
  showTagInput.value   = false
}

function removeCustomTag(t) {
  form.value.tags = form.value.tags.filter(x => x !== t)
}

// ── suggestion helpers ─────────────────────────────────────────────────────
function pickType(t) { form.value.type = t; step.value = 2 }

function pick(s) {
  form.value = { ...defaultForm(), ...s, custom: {} }
  step.value = 2
}

async function delSuggestion(s) {
  suggestions.value = suggestions.value.filter(x => x.id !== s.id)
  try { await deleteSuggestion(s.id) } catch {}
}

// ── custom field defs ──────────────────────────────────────────────────────
function addCustomField() {
  customFieldDefs.value.push({ key: 'field_' + Date.now(), label: '', fieldType: 'text', placeholder: '' })
}
function removeCustomField(i) { customFieldDefs.value.splice(i, 1) }

async function saveCustomFields() {
  // auto-generate keys from labels
  customFieldDefs.value.forEach(f => {
    if (!f.key || f.key.startsWith('field_')) {
      f.key = (f.label || 'field').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    }
  })
  savingFields.value = true
  try { await saveCustomFieldsDB(customFieldDefs.value) } catch {}
  savingFields.value   = false
  showCustomProps.value = false
}

// ── submit ─────────────────────────────────────────────────────────────────
async function submit() {
  if (!form.value.title.trim()) return
  saving.value = true

  const ts      = new Date(`${form.value.date}T${form.value.time}`).getTime()
  const payload = {
    ...form.value,
    timestamp: ts,
    timeSlot:  getTimeSlot(),
  }

  let savedId = props.editId
  try {
    if (props.editId) {
      await updateLog(props.editId, payload)
    } else {
      const ref2 = await addLog(payload)
      savedId    = ref2.id
      await upsertSuggestion(payload)
    }
  } catch (e) {
    savedId = 'tmp_' + Date.now()
  }

  emit('saved', { id: savedId, ...payload })
  saving.value = false
}

// ── mount ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  try { suggestions.value  = await getSuggestions() }    catch {}
  try { const f = await getCustomFields(); customFieldDefs.value = f || [] } catch {}
})
</script>

<style scoped>
/* Type grid */
.type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:4px; }
.type-card { display:flex; flex-direction:column; align-items:center; gap:5px; padding:16px 8px; border-radius:var(--r); border:2px solid var(--border); background:var(--surface); cursor:pointer; transition:all .18s; font-family:var(--ff); box-shadow:var(--shadow-sm); }
.type-card:active { transform:scale(.96); }
.tc-food    { border-color:rgba(217,119,6,.3);  background:var(--amber-dim); }
.tc-expense { border-color:rgba(225,29,72,.25); background:var(--red-dim);   }
.tc-income  { border-color:rgba(5,150,105,.3);  background:var(--green-dim); }
.tc-icon { font-size:28px; }
.tc-name { font-size:14px; font-weight:700; color:var(--text); }
.tc-sub  { font-size:10px; color:var(--text-muted); }

/* Step header */
.step-hd { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
.back-btn { background:var(--bg3); border:1px solid var(--border); border-radius:8px; padding:6px 12px; font-size:13px; font-weight:600; color:var(--text-dim); cursor:pointer; font-family:var(--ff); }
.back-btn:active { transform:scale(.95); }
.step-type-badge { font-size:13px; font-weight:700; padding:5px 12px; border-radius:100px; text-transform:capitalize; }
.stb-food    { background:var(--amber-dim);  color:var(--amber-text); }
.stb-expense { background:var(--red-dim);    color:var(--red-text);   }
.stb-income  { background:var(--green-dim);  color:var(--green-text); }

/* Field header */
.field-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.add-tag-btn { font-size:11px; font-weight:700; color:var(--blue); background:var(--blue-dim); border:1px solid rgba(37,99,235,.2); border-radius:100px; padding:3px 10px; cursor:pointer; font-family:var(--ff); }

/* Suggestion pills */
.pill-food    { border-color:rgba(217,119,6,.3);  background:var(--amber-dim); color:var(--amber-text); }
.pill-expense { border-color:rgba(225,29,72,.25); background:var(--red-dim);   color:var(--red-text);   }
.pill-income  { border-color:rgba(5,150,105,.3);  background:var(--green-dim); color:var(--green-text); }
.pill-x { background:none; border:none; color:var(--text-muted); font-size:10px; cursor:pointer; padding:2px 6px; border-radius:100px; flex-shrink:0; }
.pill-x:hover { background:var(--red-dim); color:var(--red); }
.use-badge { font-size:10px; background:var(--blue-dim); color:var(--blue-text); padding:1px 5px; border-radius:100px; font-weight:700; }

/* Custom values display */
.custom-vals { background:var(--bg3); border-radius:var(--rs); padding:10px 12px; display:flex; flex-direction:column; gap:10px; }
.custom-val-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.cv-label { font-size:13px; color:var(--text-dim); flex:1; }

/* Custom field editor */
.custom-editor { background:var(--bg3); border-radius:var(--rs); padding:12px; display:flex; flex-direction:column; gap:8px; }
.cfe-row { display:flex; align-items:center; gap:6px; }
</style>
