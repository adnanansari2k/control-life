<template>
  <div class="page" style="padding-top:4px">
    <div class="ph" style="padding-right:48px">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--amber-text);margin-bottom:2px">🏦 LOANS</div>
        <div class="pt">Debt Pressure</div>
      </div>
      <button class="add-loan-btn" @click="showForm=true">+ Add</button>
    </div>

    <!-- Pressure card -->
    <div class="card" :class="pressClass" style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Monthly EMI Burden</div>
      <div class="mono" style="font-size:36px;font-weight:800;letter-spacing:-1.5px">₹{{ totalEmi.toLocaleString('en-IN') }}</div>
      <div style="font-size:12px;color:var(--text-dim);margin-top:2px">{{ loans.length }} active loan{{ loans.length!==1?'s':'' }}</div>
      <div style="margin-top:14px">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: Math.min(100,emiPct)+'%', background: pressColor }"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;text-align:right">{{ emiPct }}% of ₹{{ income.toLocaleString('en-IN') }} income</div>
      </div>
    </div>

    <!-- Income setter -->
    <div class="income-row" @click="showIncomeEdit=!showIncomeEdit">
      <span style="font-size:13px;color:var(--text-dim)">Monthly Income Reference</span>
      <span class="mono" style="font-size:14px;font-weight:700">₹{{ income.toLocaleString('en-IN') }} ✏️</span>
    </div>
    <Transition name="fade">
      <div v-if="showIncomeEdit" style="padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:6px">
        <input v-model.number="incomeInput" class="input" type="number" placeholder="Monthly income ₹" style="margin-bottom:8px" />
        <button class="btn btn-ghost btn-full" @click="saveIncome">Set Income</button>
      </div>
    </Transition>

    <!-- Loans -->
    <div class="sl">Your Loans</div>
    <div v-if="loans.length===0" class="empty">
      <div class="empty-icon">🏦</div>
      No loans. Stay debt-free! 🎉
    </div>

    <TransitionGroup name="list" tag="div">
      <div v-for="loan in loans" :key="loan.id" class="loan-card">
        <div class="loan-hd">
          <div>
            <div class="loan-name">{{ loan.name }}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Started {{ fmtDate(loan.createdAt) }}</div>
          </div>
          <button class="del-btn" @click="removeLoan(loan.id)">✕</button>
        </div>

        <div class="loan-stats">
          <div class="ls"><div class="ls-v mono" style="color:var(--amber)">₹{{ loan.emi?.toLocaleString('en-IN') }}</div><div class="ls-l">EMI/month</div></div>
          <div class="ls"><div class="ls-v mono" style="color:var(--red)">₹{{ remaining(loan).toLocaleString('en-IN') }}</div><div class="ls-l">Remaining</div></div>
          <div class="ls"><div class="ls-v mono" style="color:var(--text-dim)">{{ remMonths(loan) }}mo</div><div class="ls-l">Left</div></div>
        </div>

        <div style="margin:10px 0 6px">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress(loan)+'%', background:'var(--amber)' }"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:3px;font-size:10px;color:var(--text-muted)">
            <span>{{ loan.paidMonths||0 }}/{{ loan.months }} months paid</span>
            <span class="mono">{{ Math.round(progress(loan)) }}%</span>
          </div>
        </div>

        <!-- Pending flag -->
        <div v-if="loan.pendingFlag" class="pending-banner">⚠️ EMI Pending this month</div>

        <!-- Actions -->
        <div class="loan-actions">
          <button
            class="la-btn la-paid"
            @click="markPaid(loan)"
            :disabled="(loan.paidMonths||0)>=loan.months || paying===loan.id"
          >
            {{ paying===loan.id ? '…' : '✅ Mark EMI Paid' }}
          </button>
          <button
            class="la-btn"
            :class="loan.pendingFlag ? 'la-pending-on' : 'la-pending-off'"
            @click="togglePending(loan)"
          >
            {{ loan.pendingFlag ? '🔔 Pending' : '🕐 Set Pending' }}
          </button>
        </div>

        <div v-if="(loan.paidMonths||0)>=loan.months" class="paid-badge">🎉 Fully Paid!</div>
      </div>
    </TransitionGroup>

    <!-- Summary -->
    <div v-if="loans.length>0" class="card" style="margin-top:4px">
      <div class="sum-row"><span>Total Remaining</span><span class="mono" style="color:var(--red)">₹{{ totalRemaining.toLocaleString('en-IN') }}</span></div>
      <div class="divider"></div>
      <div class="sum-row"><span>Monthly EMI</span><span class="mono" style="color:var(--amber)">₹{{ totalEmi.toLocaleString('en-IN') }}</span></div>
      <div class="divider"></div>
      <div class="sum-row"><span>Income Used</span><span class="mono" :style="{ color: emiPct>40?'var(--red)':'var(--green)' }">{{ emiPct }}%</span></div>
    </div>

    <div v-if="pressMsg" class="press-msg">{{ pressMsg }}</div>

    <!-- Add Loan Modal -->
    <Teleport to="body">
      <div v-if="showForm" class="overlay" @click.self="showForm=false">
        <div class="sheet">
          <div class="handle"></div>
          <div class="sh-title">Add Loan</div>
          <div class="fg">
            <label class="fl">Loan Name</label>
            <input v-model="form.name" class="input" placeholder="e.g. Bike Loan, Personal Loan" />
          </div>
          <div class="fg">
            <label class="fl">Monthly EMI ₹</label>
            <input v-model.number="form.emi" class="input mono" type="number" placeholder="e.g. 2500" />
          </div>
          <div class="fg">
            <label class="fl">Total Months</label>
            <input v-model.number="form.months" class="input mono" type="number" placeholder="e.g. 24" />
          </div>
          <div v-if="form.emi && form.months" class="calc-preview">
            <span>💰 Total Loan Amount</span>
            <span class="mono" style="font-weight:800;color:var(--red)">₹{{ (form.emi*form.months).toLocaleString('en-IN') }}</span>
          </div>
          <button class="btn btn-amber btn-full" style="margin-top:20px" @click="submitLoan">+ Add Loan</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { addLoan, getLoans, deleteLoan, updateLoan, addLog } from '../firebase.js'

const loans          = ref([])
const showForm       = ref(false)
const showIncomeEdit = ref(false)
const paying         = ref(null)
const income         = ref(parseInt(localStorage.getItem('lcs_income')||'30000'))
const incomeInput    = ref(income.value)
const form           = ref({ name:'', emi:null, months:null })

const totalEmi       = computed(() => loans.value.filter(l=>(l.paidMonths||0)<l.months).reduce((s,l)=>s+(l.emi||0),0))
const totalRemaining = computed(() => loans.value.reduce((s,l)=>s+remaining(l),0))
const emiPct         = computed(() => income.value>0 ? Math.round((totalEmi.value/income.value)*100) : 0)
const pressColor     = computed(() => emiPct.value<30?'var(--green)':emiPct.value<50?'var(--amber)':'var(--red)')
const pressClass     = computed(() => emiPct.value<30?'card card-green':emiPct.value<50?'card card-amber':'card card-red')
const pressMsg       = computed(() => {
  if (!loans.value.length) return null
  if (emiPct.value>=50) return '🔴 High debt burden. Over 50% income on EMIs.'
  if (emiPct.value>=30) return '⚠️ Moderate. Keep expenses in check.'
  return '✅ Loan burden is manageable.'
})

function remMonths(loan) { return Math.max(0, loan.months-(loan.paidMonths||0)) }
function remaining(loan) { return remMonths(loan)*(loan.emi||0) }
function progress(loan)  { return loan.months>0 ? Math.min(100,((loan.paidMonths||0)/loan.months)*100) : 0 }
function fmtDate(ts)     { return ts ? new Date(ts).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : '' }

function saveIncome() {
  income.value = incomeInput.value
  localStorage.setItem('lcs_income', incomeInput.value)
  showIncomeEdit.value = false
}

async function markPaid(loan) {
  if ((loan.paidMonths||0) >= loan.months) return
  paying.value = loan.id
  const newPaid = (loan.paidMonths||0)+1
  loan.paidMonths = newPaid
  try {
    await updateLoan(loan.id, { paidMonths: newPaid, pendingFlag: false })
    // auto-add to unified logs as an expense
    await addLog({
      title:    `EMI — ${loan.name}`,
      amount:   loan.emi,
      type:     'expense',
      tags:     ['need','emi'],
      category: 'rent',
      reason:   'necessity',
      regret:   false,
      note:     `Loan payment ${newPaid}/${loan.months}`,
    })
    loan.pendingFlag = false
  } catch {}
  paying.value = null
}

async function togglePending(loan) {
  loan.pendingFlag = !loan.pendingFlag
  try { await updateLoan(loan.id, { pendingFlag: loan.pendingFlag }) } catch {}
}

async function submitLoan() {
  if (!form.value.name||!form.value.emi||!form.value.months) return
  const data = { ...form.value, paidMonths:0, pendingFlag:false }
  try {
    const r = await addLoan(data)
    loans.value.push({ id:r.id, ...data, createdAt:Date.now() })
  } catch {
    loans.value.push({ id:'tmp_'+Date.now(), ...data, createdAt:Date.now() })
  }
  form.value  = { name:'', emi:null, months:null }
  showForm.value = false
}

async function removeLoan(id) {
  loans.value = loans.value.filter(l=>l.id!==id)
  try { await deleteLoan(id) } catch {}
}

onMounted(async () => { try { loans.value = await getLoans() } catch {} })
</script>

<style scoped>
.add-loan-btn { padding:8px 16px; background:var(--amber-dim); border:1.5px solid rgba(217,119,6,.3); border-radius:100px; color:var(--amber-text); font-family:var(--ff); font-size:13px; font-weight:700; cursor:pointer; }
.add-loan-btn:active { transform:scale(.95); }

.income-row { display:flex; align-items:center; justify-content:space-between; padding:11px 14px; background:var(--surface); border:1px solid var(--border); border-radius:var(--rs); margin-bottom:6px; cursor:pointer; box-shadow:var(--shadow-sm); }

.loan-card { background:var(--surface); border:1.5px solid var(--border); border-radius:var(--r); padding:16px; margin-bottom:12px; box-shadow:var(--shadow-sm); }
.loan-hd   { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
.loan-name { font-size:17px; font-weight:800; }
.loan-stats { display:flex; gap:6px; margin-bottom:4px; }
.ls   { flex:1; padding:8px; background:var(--bg3); border-radius:var(--rs); text-align:center; }
.ls-v { font-size:16px; font-weight:800; }
.ls-l { font-size:9px; color:var(--text-muted); letter-spacing:.5px; text-transform:uppercase; margin-top:2px; }

.pending-banner { background:var(--amber-dim); border:1px solid rgba(217,119,6,.25); border-radius:var(--rs); padding:7px 12px; font-size:12px; font-weight:700; color:var(--amber-text); margin-bottom:8px; }

.loan-actions { display:flex; gap:8px; margin-top:10px; }
.la-btn { flex:1; padding:10px; border-radius:var(--rs); border:1.5px solid; font-family:var(--ff); font-size:13px; font-weight:700; cursor:pointer; transition:all .18s; }
.la-btn:active { transform:scale(.96); }
.la-paid       { background:var(--green-dim); color:var(--green-text); border-color:rgba(5,150,105,.25); }
.la-paid:hover { background:var(--green); color:#fff; }
.la-paid:disabled { opacity:.4; cursor:not-allowed; }
.la-pending-off { background:var(--bg3);        color:var(--text-dim);   border-color:var(--border); }
.la-pending-on  { background:var(--amber-dim);  color:var(--amber-text); border-color:rgba(217,119,6,.3); }

.paid-badge { margin-top:10px; padding:8px; background:var(--green-dim); border:1px solid rgba(5,150,105,.2); border-radius:var(--rs); text-align:center; font-size:13px; font-weight:700; color:var(--green-text); }

.sum-row { display:flex; align-items:center; justify-content:space-between; font-size:13px; color:var(--text-dim); padding:4px 0; }
.press-msg { margin-top:12px; padding:12px 14px; background:var(--surface); border:1px solid var(--border); border-radius:var(--rs); font-size:13px; color:var(--text-dim); line-height:1.5; }
.calc-preview { display:flex; align-items:center; justify-content:space-between; padding:11px 14px; background:var(--red-dim); border:1px solid rgba(225,29,72,.15); border-radius:var(--rs); font-size:13px; color:var(--text-dim); }
</style>
