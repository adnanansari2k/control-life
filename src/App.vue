<template>
  <div class="app-shell">

    <!-- ── Loading ── -->
    <Transition name="fade">
      <div v-if="loading" class="splash">
        <div class="splash-icon">⚡</div>
        <div class="splash-name">Life Control</div>
        <div class="splash-bar"><div class="splash-fill"></div></div>
      </div>
    </Transition>

    <!-- ── Auth ── -->
    <Transition name="fade">
      <div v-if="!loading && !user" class="auth-wrap">
        <div class="auth-card">
          <div style="font-size:52px;margin-bottom:12px">⚡</div>
          <h1 class="auth-title">Life Control</h1>
          <p class="auth-sub">Track money, food & habits — one unified system.</p>
          <button class="google-btn" @click="doSignIn" :disabled="signingIn">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {{ signingIn ? 'Signing in…' : 'Continue with Google' }}
          </button>
          <p class="auth-note">Your data is private — tied to your Google account.</p>
        </div>
      </div>
    </Transition>

    <!-- ── App ── -->
    <template v-if="!loading && user">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" :ref="el => setRef(route.path, el)" />
        </Transition>
      </RouterView>

      <!-- Floating FAB — centred above bottom nav -->
      <button class="fab" @click="showModal = true" aria-label="Add log">
        <span class="fab-plus">+</span>
      </button>

      <!-- Bottom nav — 4 tabs + gap in centre -->
      <nav class="bnav">
        <RouterLink to="/"        class="ni" :class="{ 'ni-active': $route.path==='/' }">
          <span class="ni-ic">⊞</span><span class="ni-lb">Home</span>
        </RouterLink>
        <RouterLink to="/logs"    class="ni" :class="{ 'ni-active': $route.path==='/logs' }">
          <span class="ni-ic">📋</span><span class="ni-lb">Logs</span>
        </RouterLink>
        
        <!-- gap for FAB -->
        <button class="ni fab" @click="showModal = true" aria-label="Add log">
        <span class="fab-plus">+</span>
      </button>
        <RouterLink to="/loans"   class="ni" :class="{ 'ni-active': $route.path==='/loans' }">
          <span class="ni-ic">🏦</span><span class="ni-lb">Loans</span>
        </RouterLink>
        <RouterLink to="/insights" class="ni" :class="{ 'ni-active': $route.path==='/insights' }">
          <span class="ni-ic">📈</span><span class="ni-lb">Insights</span>
        </RouterLink>
      </nav>

      <!-- User avatar -->
      <div class="avatar" @click="showMenu = !showMenu">
        <img v-if="user.photoURL" :src="user.photoURL" />
        <span v-else>{{ user.displayName?.[0] || '?' }}</span>
      </div>
      <div v-if="showMenu" class="menu-bd" @click="showMenu=false">
        <div class="menu-card" @click.stop>
          <div style="font-weight:700;font-size:15px">{{ user.displayName }}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">{{ user.email }}</div>
          <div class="divider"></div>
          <button class="btn btn-ghost btn-full" @click="doSignOut">Sign out</button>
        </div>
      </div>

      <!-- Log Modal -->
      <Teleport to="body">
        <LogModal v-if="showModal" @close="showModal=false" @saved="onSaved" />
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { initAuth, signInWithGoogle, signOutUser, currentUser } from './firebase.js'
import LogModal from './components/LogModal.vue'

const loading   = ref(true)
const user      = currentUser
const signingIn = ref(false)
const showModal = ref(false)
const showMenu  = ref(false)

// Hold refs to mounted page components so we can call addLog() on them
const pageRefs = {}
function setRef(path, el) { if (el) pageRefs[path] = el }

async function doSignIn()  { signingIn.value = true; try { await signInWithGoogle() } catch(e){} signingIn.value = false }
async function doSignOut() { await signOutUser(); showMenu.value = false }

function onSaved(log) {
  showModal.value = false
  // Push instantly to whichever page is mounted
  pageRefs['/']?.addLog?.(log)
  pageRefs['/logs']?.addLog?.(log)
}

onMounted(async () => {
  try { await initAuth() } catch(e) { console.warn('Firebase:', e.message) }
  setTimeout(() => loading.value = false, 500)
})
</script>

<style scoped>
.app-shell { min-height:100dvh; position:relative; }

/* Splash */
.splash { position:fixed; inset:0; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; z-index:999; }
.splash-icon { font-size:52px; }
.splash-name { font-size:22px; font-weight:800; letter-spacing:-.5px; }
.splash-bar  { width:100px; height:3px; background:var(--border); border-radius:2px; overflow:hidden; }
.splash-fill { height:100%; background:var(--blue); animation:sf .6s ease forwards; }
@keyframes sf { from{width:0} to{width:100%} }

/* Auth */
.auth-wrap  { min-height:100dvh; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--bg); }
.auth-card  { width:100%; max-width:360px; background:var(--surface); border-radius:20px; padding:40px 28px 32px; box-shadow:var(--shadow-lg); border:1px solid var(--border); text-align:center; }
.auth-title { font-size:28px; font-weight:800; margin-bottom:8px; }
.auth-sub   { font-size:14px; color:var(--text-dim); margin-bottom:32px; line-height:1.5; }
.auth-note  { font-size:12px; color:var(--text-muted); margin-top:14px; }
.google-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:13px 20px; border-radius:12px; border:1.5px solid var(--border); background:var(--surface); color:var(--text); font-family:var(--ff); font-size:15px; font-weight:600; cursor:pointer; transition:all .2s; box-shadow:var(--shadow-sm); }
.google-btn:hover { border-color:var(--blue); }
.google-btn:active { transform:scale(.98); }
.google-btn:disabled { opacity:.6; cursor:not-allowed; }

/* FAB */
/* Bottom nav */
.bnav {
  position:fixed; bottom:0; left:0; right:0; height:var(--nav);
  background:rgba(255,255,255,.96); backdrop-filter:blur(16px);
  border-top:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-around;
  z-index:50; padding-bottom:env(safe-area-inset-bottom);
  box-shadow:0 -2px 12px rgba(0,0,0,.06);
  max-width:480px; margin:0 auto;
}
@media(max-width:480px) { .bnav { max-width:100%; } }

.ni { display:flex; flex-direction:column; align-items:center; gap:3px; text-decoration:none; color:var(--text-muted); padding:8px 8px; border-radius:10px; font-family:var(--ff); transition:all .2s; flex:1; }
.ni:active { transform:scale(.9); }
.ni-ic  { font-size:19px; line-height:1; transition:transform .2s; }
.ni-lb  { font-size:10px; font-weight:600; letter-spacing:.3px; }
.ni-active { color:var(--blue); }
.ni-active .ni-ic { transform:translateY(-2px); }
.ni-gap { width:56px; flex-shrink:0; pointer-events:none; }

.fab {
  background:var(--blue); color:#fff; border:none;
  cursor:pointer;
  box-shadow:0 4px 20px rgba(37,99,235,.45), 0 0 0 4px rgba(255,255,255,.9);
  transition:transform .18s, box-shadow .18s;
}
.fab:active { transform:scale(1.2); }
.fab-plus { font-size:28px; font-weight:300; line-height:1; margin-top:-2px; }

/* User avatar */
.avatar { position:fixed; top:14px; right:14px; z-index:60; width:34px; height:34px; border-radius:50%; background:var(--bg3); border:2px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; font-size:14px; font-weight:700; box-shadow:var(--shadow-sm); }
.avatar img { width:100%; height:100%; object-fit:cover; }
.menu-bd { position:fixed; inset:0; z-index:59; display:flex; align-items:flex-start; justify-content:flex-end; padding:56px 14px 0; }
.menu-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:16px; min-width:210px; box-shadow:var(--shadow-lg); }
</style>
