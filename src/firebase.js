// src/firebase.js
import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, setDoc, getDoc, query, where, orderBy, increment, limit
} from 'firebase/firestore'
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut
} from 'firebase/auth'
import { ref } from 'vue'

// ─── Replace with your Firebase project config ─────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCP2zRn6UVGUTXUg8a-34vktLovyY8tlL4",
  authDomain: "my-web-app-51d3a.firebaseapp.com",
  projectId: "my-web-app-51d3a",
  storageBucket: "my-web-app-51d3a.firebasestorage.app",
  messagingSenderId: "780761838193",
  appId: "1:780761838193:web:8432f2ef3b239d130461d0",
  measurementId: "G-35G7CS414X"
};
// ──────────────────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig)
export const db   = getFirestore(app)
export const auth = getAuth(app)
const provider    = new GoogleAuthProvider()

export const currentUser = ref(null)
export const authLoading = ref(true)

// ── Auth ───────────────────────────────────────────────────────────────────
export function initAuth() {
  return new Promise(resolve => {
    onAuthStateChanged(auth, async user => {
      authLoading.value = false
      if (user) { currentUser.value = user; resolve(user); return }
      try {
        const r = await getRedirectResult(auth)
        if (r?.user) { currentUser.value = r.user; resolve(r.user); return }
      } catch {}
      currentUser.value = null; resolve(null)
    })
  })
}

export async function signInWithGoogle() {
  try {
    const r = await signInWithPopup(auth, provider)
    currentUser.value = r.user; return r.user
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user')
      await signInWithRedirect(auth, provider)
    throw e
  }
}

export async function signOutUser() { await signOut(auth); currentUser.value = null }

// ── Helpers ────────────────────────────────────────────────────────────────
function uid()            { return currentUser.value?.uid || 'demo' }
export function userCol(c)    { return collection(db, 'users', uid(), c) }
export function userDocRef(c, id) { return doc(db, 'users', uid(), c, id) }

export function getTimeSlot() {
  const h = new Date(1778566260000).toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  hour12: false
});
  if (h >= 5  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

// ══════════════════════════════════════════════════════════════════════════
//  UNIFIED LOG — single "logs" collection
//
//  Schema:
//  {
//    title      : string           — "banana", "petrol", "salary"
//    amount     : number           — in ₹ (required)
//    quantity   : number | null    — optional, mainly for food
//    unit       : string | null    — "pieces", "ml", "g" …
//    type       : "food" | "expense" | "income"
//    tags       : string[]         — ["need","healthy","junk","want","waste","body","outside","home",…]
//    category   : string | null    — "fruit","travel","rent","salary"…
//    quality    : string | null    — "very good"|"good"|"neutral"|"bad"|"very bad"
//    mood       : string | null    — "happy"|"bored"|"stressed"|"tired"|"hungry"|"neutral"
//    hunger     : string | null    — "low"|"medium"|"high"
//    reason     : string | null    — "habit"|"craving"|"social"|"impulse"|"planned"…
//    regret     : boolean
//    note       : string | null    — free-text note
//    custom     : object           — { [key]: value } — user-defined extra fields
//    timeSlot   : string           — auto: morning/afternoon/evening/night
//    timestamp  : number           — ms epoch
//    date       : string           — "YYYY-MM-DD"
//    time       : string           — "HH:MM"
//  }
// ══════════════════════════════════════════════════════════════════════════

export async function addLog(data) {
  const now  = new Date()
  const base = {
    title:     data.title     || '',
    amount:    data.amount    ?? 0,
    quantity:  data.quantity  ?? null,
    unit:      data.unit      ?? null,
    type:      data.type      || 'expense',
    tags:      data.tags      || [],
    category:  data.category  ?? null,
    quality:   data.quality   ?? null,
    mood:      data.mood      ?? null,
    hunger:    data.hunger    ?? null,
    reason:    data.reason    ?? null,
    regret:    data.regret    ?? false,
    note:      data.note      ?? null,
    custom:    data.custom    ?? {},
    timeSlot:  data.timeSlot  || getTimeSlot(),
    timestamp: data.timestamp || now.getTime(),
    date:      data.date      || now.toISOString().split('T')[0],
    time:      data.time      || `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
  }
  return addDoc(userCol('logs'), base)
}

export async function updateLog(id, data) {
  return updateDoc(userDocRef('logs', id), data)
}

export async function deleteLog(id) {
  return deleteDoc(userDocRef('logs', id))
}

// Get logs for last N days, ordered by timestamp desc
export async function getLogs(days = 30) {
  const since = Date.now() - days * 86400000
  const q = query(
    userCol('logs'),
    where('timestamp', '>=', since),
    orderBy('timestamp', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Get today's logs
export async function getTodayLogs() {
  const today = new Date().toISOString().split('T')[0]
  const q = query(userCol('logs'), where('date', '==', today), orderBy('timestamp', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Suggestions (saved frequently-used logs) ───────────────────────────────
export async function getSuggestions() {
  const q = query(userCol('suggestions'), orderBy('useCount', 'desc'), limit(30))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function upsertSuggestion(log) {
  const key  = log.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 80)
  const ref2 = userDocRef('suggestions', key)
  const snap = await getDoc(ref2)
  const save = { title: log.title, amount: log.amount, type: log.type, tags: log.tags, category: log.category, usedAt: Date.now() }
  if (snap.exists()) {
    await updateDoc(ref2, { ...save, useCount: increment(1) })
  } else {
    await setDoc(ref2, { ...save, useCount: 1 })
  }
}

export async function deleteSuggestion(id) {
  return deleteDoc(userDocRef('suggestions', id))
}

// ── Custom fields schema (user-defined extra fields) ───────────────────────
export async function getCustomFields() {
  const snap = await getDoc(userDocRef('meta', 'customFields'))
  return snap.exists() ? snap.data().fields || [] : []
}

export async function saveCustomFields(fields) {
  return setDoc(userDocRef('meta', 'customFields'), { fields })
}

// ── Custom tag/option lists ─────────────────────────────────────────────────
export async function getCustomOptions(listName) {
  const snap = await getDocs(userCol(`opts_${listName}`))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function saveCustomOption(listName, opt) {
  return setDoc(userDocRef(`opts_${listName}`, opt.v), opt)
}
export async function deleteCustomOption(listName, v) {
  return deleteDoc(userDocRef(`opts_${listName}`, v))
}

// ── Loans ──────────────────────────────────────────────────────────────────
export async function addLoan(data)        { return addDoc(userCol('loans'),  { ...data, createdAt: Date.now(), paidMonths: 0 }) }
export async function updateLoan(id, data) { return updateDoc(userDocRef('loans', id), data) }
export async function getLoans()           { const s = await getDocs(userCol('loans')); return s.docs.map(d => ({ id: d.id, ...d.data() })) }
export async function deleteLoan(id)       { return deleteDoc(userDocRef('loans', id)) }

// ── Goals ──────────────────────────────────────────────────────────────────
export async function saveGoals(g)  { return setDoc(userDocRef('meta', 'goals'), g) }
export async function getGoals()    { const s = await getDoc(userDocRef('meta', 'goals')); return s.exists() ? s.data() : { maxSpend: 0, maxJunk: 0 } }

// ── Energy ─────────────────────────────────────────────────────────────────
export async function saveEnergy(level) {
  const date = new Date().toISOString().split('T')[0]
  return setDoc(userDocRef('energy', date), { level, date, timestamp: Date.now() })
}
export async function getEnergy() {
  const s = await getDocs(userCol('energy'))
  return s.docs.map(d => ({ id: d.id, ...d.data() }))
}
