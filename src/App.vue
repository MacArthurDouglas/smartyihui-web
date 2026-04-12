<template>
  <div class="site-root">
    <!-- 顶部导航 -->
    <header class="navbar" :class="{ scrolled: isScrolled, 'menu-open': menuOpen }">
      <div class="navbar-inner">
        <router-link to="/" class="brand">
          <span class="brand-icon">熠</span>
          <span class="brand-text">广州熠辉智能科技</span>
        </router-link>

        <nav class="nav-links">
          <router-link to="/">首页</router-link>
          <router-link to="/about">关于我们</router-link>
          <router-link to="/services">服务项目</router-link>
          <router-link to="/products">自研产品</router-link>
          <router-link to="/contact">联系方式</router-link>
        </nav>

        <div class="nav-actions">
          <div v-if="isLoggedIn" class="auth-chip" :title="authDisplayName || '已登录'">
            <SvgIcon name="user" :size="14" />
            <span>{{ authDisplayName || '已登录' }}</span>
          </div>
          <button v-if="isLoggedIn" class="btn-logout" type="button" @click="handleLogout">退出</button>
          <button v-else class="btn-login" @click="showLogin = true">登录 / 注册</button>
          <button
            class="btn-theme"
            type="button"
            @click="toggleTheme"
            :aria-label="themeButtonLabel"
            :title="themeButtonLabel"
          >
            <SvgIcon :name="themeIcon" :size="16" />
          </button>
          <button
            class="hamburger"
            @click="menuOpen = !menuOpen"
            :aria-expanded="menuOpen"
            aria-controls="mobile-menu"
            aria-label="菜单"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <!-- 移动端菜单 -->
      <transition name="menu-drop">
        <div id="mobile-menu" class="mobile-menu" v-if="menuOpen">
          <router-link to="/" @click="menuOpen = false">首页</router-link>
          <router-link to="/about" @click="menuOpen = false">关于我们</router-link>
          <router-link to="/services" @click="menuOpen = false">服务项目</router-link>
          <router-link to="/products" @click="menuOpen = false">自研产品</router-link>
          <router-link to="/contact" @click="menuOpen = false">联系方式</router-link>
          <div v-if="isLoggedIn" class="mobile-auth-state">
            <div class="auth-chip mobile" :title="authDisplayName || '已登录'">
              <SvgIcon name="user" :size="14" />
              <span>{{ authDisplayName || '已登录' }}</span>
            </div>
            <button class="btn-logout-mobile" type="button" @click="handleLogout">退出登录</button>
          </div>
          <button v-else class="btn-login-mobile" @click="showLogin = true; menuOpen = false">登录 / 注册</button>
        </div>
      </transition>

      <div class="scroll-progress" aria-hidden="true">
        <span class="scroll-progress-bar" :style="{ transform: `scaleX(${scrollProgress})` }"></span>
      </div>
    </header>

    <main>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="brand-icon sm">熠</span>
          <span>广州熠辉智能科技有限公司</span>
        </div>
        <p class="footer-addr">广州市天河区中山大道建中路5号</p>
        <p class="footer-copy">© 2026 广州熠辉智能科技有限公司. All rights reserved.</p>
      </div>
    </footer>

    <!-- 登录/注册弹窗 -->
    <div
      class="modal-overlay"
      v-if="showLogin"
      @click.self="showLogin = false"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="modal-box">
        <button class="modal-close" @click="showLogin = false" aria-label="关闭">
          <SvgIcon name="x" :size="16" />
        </button>
        <div class="modal-tabs" id="modal-title">
          <button :class="{ active: authTab === 'login' }" @click="authTab = 'login'">登录</button>
          <button :class="{ active: authTab === 'register' }" @click="authTab = 'register'">注册</button>
          <button :class="{ active: authTab === 'reset' }" @click="authTab = 'reset'">重置密码</button>
        </div>

        <!-- 登录 -->
        <form v-if="authTab === 'login'" class="auth-form" @submit.prevent="handleLogin">
          <div class="field">
            <label>用户名</label>
            <input v-model="loginForm.login" type="text" placeholder="请输入用户名" required />
          </div>
          <div class="field">
            <label>密码</label>
            <input v-model="loginForm.password" type="password" placeholder="请输入密码" required />
          </div>
          <button type="submit" class="btn-submit" :disabled="authLoading">
            {{ authLoading ? '登录中...' : '登 录' }}
          </button>
          <button type="button" class="btn-link" @click="authTab = 'reset'">忘记密码？去重置</button>
          <p v-if="authError" class="auth-error">{{ authError }}</p>
        </form>

        <!-- 注册 -->
        <form v-else-if="authTab === 'register'" class="auth-form" @submit.prevent="handleRegister">
          <div class="field">
            <label>用户名</label>
            <input v-model="registerForm.username" type="text" placeholder="请输入用户名" required />
          </div>
          <div class="field">
            <label>密码</label>
            <input v-model="registerForm.password" type="password" placeholder="至少6位密码" required />
          </div>
          <div class="field">
            <label>手机号</label>
            <div class="phone-row">
              <input v-model="registerForm.phone" type="tel" placeholder="请输入手机号" required />
              <button type="button" class="btn-sms" @click="sendSms" :disabled="smsCooldown > 0">
                {{ smsCooldown > 0 ? `${smsCooldown}s` : '获取验证码' }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>头像</label>
            <div class="avatar-upload-row">
              <input
                ref="avatarInput"
                class="avatar-file-input"
                type="file"
                accept="image/*"
                @change="handleAvatarFileChange"
              />
              <button type="button" class="btn-avatar-upload" :disabled="avatarUploading" @click="avatarInput?.click()">
                {{ avatarUploading ? '上传中...' : '上传本地头像' }}
              </button>
            </div>
            <div class="avatar-preview avatar-url-preview">
              <img v-if="registerAvatarPreview" :src="registerAvatarPreview" alt="头像预览" />
              <span v-else>熠</span>
            </div>
            <p class="avatar-hint">头像将通过上传接口获取 URL 后自动回填，不需要手动输入。</p>
          </div>
          <div class="field">
            <label>验证码</label>
            <input v-model="registerForm.verifyCode" type="text" placeholder="请输入短信验证码" required />
          </div>
          <button type="submit" class="btn-submit" :disabled="authLoading">
            {{ authLoading ? '注册中...' : '注 册' }}
          </button>
          <p v-if="authError" class="auth-error">{{ authError }}</p>
          <p v-if="authSuccess" class="auth-success">{{ authSuccess }}</p>
        </form>

        <!-- 重置密码 -->
        <form v-else class="auth-form" @submit.prevent="handleResetPassword">
          <div class="field">
            <label>手机号</label>
            <input v-model="resetForm.phone" type="tel" placeholder="请输入注册手机号" required />
          </div>
          <div class="field">
            <label>验证码</label>
            <div class="phone-row">
              <input v-model="resetForm.verifyCode" type="text" placeholder="请输入短信验证码" required />
              <button type="button" class="btn-sms" @click="sendResetSms" :disabled="resetSmsCooldown > 0">
                {{ resetSmsCooldown > 0 ? `${resetSmsCooldown}s` : '获取验证码' }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>新密码</label>
            <input v-model="resetForm.newPassword" type="password" placeholder="请输入新密码" required />
          </div>
          <button type="submit" class="btn-submit" :disabled="authLoading">
            {{ authLoading ? '提交中...' : '确认重置' }}
          </button>
          <button type="button" class="btn-link" @click="authTab = 'login'">返回登录</button>
          <p v-if="authError" class="auth-error">{{ authError }}</p>
          <p v-if="authSuccess" class="auth-success">{{ authSuccess }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
import SvgIcon from '@/components/SvgIcon.vue'

const isScrolled = ref(false)
const menuOpen = ref(false)
const showLogin = ref(false)
const authTab = ref('login')
const authLoading = ref(false)
const authError = ref('')
const authSuccess = ref('')
const smsCooldown = ref(0)
const resetSmsCooldown = ref(0)
const themeMode = ref('system')
const resolvedTheme = ref('light')
const scrollProgress = ref(0)
const route = useRoute()
let systemThemeMedia = null

const loginForm = ref({ login: '', password: '' })
const registerForm = ref({ username: '', password: '', phone: '', verifyCode: '', avatar: 'http://dummyimage.com/100x100' })
const resetForm = ref({ phone: '', verifyCode: '', newPassword: '' })
const authToken = ref(localStorage.getItem('smartyihui-auth-token') || '')
const authUser = ref(readStoredAuthUser())
const avatarInput = ref(null)
const avatarUploading = ref(false)
const registerAvatarPreview = computed(() => registerForm.value.avatar || 'http://dummyimage.com/100x100')

const SSO_BASE = '/api/sso'
const SERVICE_BASE = '/api/service'
const RESET_PASSWORD_PATH = import.meta.env.VITE_SSO_RESET_PASSWORD_PATH || '/auth/reset-password'
const LOGOUT_PATH = import.meta.env.VITE_SSO_LOGOUT_PATH || '/auth/logout'

const isLoggedIn = computed(() => Boolean(authToken.value || authUser.value))

const authDisplayName = computed(() => {
  const user = authUser.value
  if (!user) return ''
  return user.username || user.login || user.phone || user.name || ''
})

if (authToken.value) {
  axios.defaults.headers.common.Authorization = authToken.value
}

function readStoredAuthUser() {
  try {
    const rawUser = localStorage.getItem('smartyihui-auth-user')
    return rawUser ? JSON.parse(rawUser) : null
  } catch {
    localStorage.removeItem('smartyihui-auth-user')
    return null
  }
}

function getAuthData(res) {
  const responseData = res?.data || {}
  return responseData.data || responseData.result || responseData.user || responseData
}

function getUserId(source) {
  const userId = source?.userId || source?.userid || source?.id || source?.user?.userId || source?.user?.id || source?.account?.userId || source?.account?.id
  const numericId = Number(userId)
  return Number.isFinite(numericId) && numericId > 0 ? numericId : null
}

function isAuthSuccess(res) {
  const responseData = res?.data || {}
  return res?.status === 200 || responseData.code === 200 || responseData.success === true || responseData.ok === true
}

function getAuthMessage(res, fallback) {
  const responseData = res?.data || {}
  return responseData.msg || responseData.message || responseData.error || fallback
}

function startCountdown(targetRef, seconds = 60) {
  targetRef.value = seconds
  const timer = setInterval(() => {
    targetRef.value--
    if (targetRef.value <= 0) clearInterval(timer)
  }, 1000)
}

function resolveUploadUrl(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  return payload.url || payload.path || payload.fileUrl || payload.filePath || payload.data || ''
}

function persistAuthState(authData) {
  const token = authData?.token || authData?.accessToken || authData?.access_token || authData?.jwt
  const user = authData?.user || authData?.profile || authData?.account || authData || null

  authToken.value = token || ''
  authUser.value = user && typeof user === 'object' ? user : null

  if (token) {
    localStorage.setItem('smartyihui-auth-token', token)
    axios.defaults.headers.common.Authorization = token
  }

  if (authUser.value) {
    localStorage.setItem('smartyihui-auth-user', JSON.stringify(authUser.value))
  }
}

async function fetchUserInfo(userId) {
  if (!userId) return null

  try {
    const res = await axios.get(`${SSO_BASE}/user/info`, {
      params: { userId },
    })

    if (!isAuthSuccess(res)) return null

    const userInfo = getAuthData(res)
    if (userInfo && typeof userInfo === 'object') {
      authUser.value = { ...authUser.value, ...userInfo, userId }
      localStorage.setItem('smartyihui-auth-user', JSON.stringify(authUser.value))
      return authUser.value
    }
  } catch {
    return null
  }

  return null
}

function clearAuthErrorState() {
  authError.value = ''
  authSuccess.value = ''
}

function clearAuthState() {
  authToken.value = ''
  authUser.value = null
  localStorage.removeItem('smartyihui-auth-token')
  localStorage.removeItem('smartyihui-auth-user')
  delete axios.defaults.headers.common.Authorization
}

function handleScroll() {
  const doc = document.documentElement
  const scrollTop = window.scrollY || doc.scrollTop || 0
  const scrollable = doc.scrollHeight - doc.clientHeight

  isScrolled.value = scrollTop > 40
  scrollProgress.value = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0
}

const themeOrder = ['light', 'dark', 'system']

const themeIcon = computed(() => {
  if (themeMode.value === 'system') return 'monitor'
  return themeMode.value === 'dark' ? 'moon' : 'sun'
})

const themeLabelMap = {
  light: '白天模式',
  dark: '黑夜模式',
  system: '跟随系统',
}

const themeButtonLabel = computed(() => {
  const idx = themeOrder.indexOf(themeMode.value)
  const nextMode = themeOrder[(idx + 1) % themeOrder.length]
  const currentLabel = themeLabelMap[themeMode.value]
  const nextLabel = themeLabelMap[nextMode]
  return `当前${currentLabel}，点击切换到${nextLabel}`
})

function getResolvedTheme(mode) {
  if (mode === 'light' || mode === 'dark') return mode
  return systemThemeMedia?.matches ? 'dark' : 'light'
}

function applyTheme(mode) {
  themeMode.value = themeOrder.includes(mode) ? mode : 'system'
  resolvedTheme.value = getResolvedTheme(themeMode.value)
  document.body.classList.toggle('dark-theme', resolvedTheme.value === 'dark')
  localStorage.setItem('theme-mode', themeMode.value)
}

function toggleTheme() {
  const idx = themeOrder.indexOf(themeMode.value)
  applyTheme(themeOrder[(idx + 1) % themeOrder.length])
}

function handleSystemThemeChange() {
  if (themeMode.value === 'system') {
    resolvedTheme.value = getResolvedTheme('system')
    document.body.classList.toggle('dark-theme', resolvedTheme.value === 'dark')
  }
}

onMounted(() => {
  systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)')
  if (typeof systemThemeMedia.addEventListener === 'function') {
    systemThemeMedia.addEventListener('change', handleSystemThemeChange)
  } else if (typeof systemThemeMedia.addListener === 'function') {
    systemThemeMedia.addListener(handleSystemThemeChange)
  }

  const savedTheme = localStorage.getItem('theme-mode')
  if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
    applyTheme(savedTheme)
  } else {
    applyTheme('system')
  }
  handleScroll()
  window.addEventListener('scroll', handleScroll)

  const storedUserId = getUserId(authUser.value)
  if (storedUserId) {
    void fetchUserInfo(storedUserId)
  }
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (!systemThemeMedia) return
  if (typeof systemThemeMedia.removeEventListener === 'function') {
    systemThemeMedia.removeEventListener('change', handleSystemThemeChange)
  } else if (typeof systemThemeMedia.removeListener === 'function') {
    systemThemeMedia.removeListener(handleSystemThemeChange)
  }
})

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

async function handleLogin() {
  clearAuthErrorState()
  authLoading.value = true
  try {
    const res = await axios.post(`${SSO_BASE}/auth/login`, {
      login: loginForm.value.login,
      password: loginForm.value.password,
    })
    if (isAuthSuccess(res)) {
      const authData = getAuthData(res)
      persistAuthState(authData)
      const userId = getUserId(authData)
      if (userId) {
        const userInfo = await fetchUserInfo(userId)
        if (userInfo) {
          persistAuthState({ ...authData, user: userInfo })
        }
      }
      if (!authToken.value && !authUser.value) {
        authUser.value = { login: loginForm.value.login }
        localStorage.setItem('smartyihui-auth-user', JSON.stringify(authUser.value))
      }
      authSuccess.value = getAuthMessage(res, '登录成功！')
      setTimeout(() => { showLogin.value = false; authSuccess.value = '' }, 1200)
    } else {
      authError.value = getAuthMessage(res, '登录失败，请检查账号密码')
    }
  } catch (e) {
    authError.value = e.response?.data?.msg || e.response?.data?.message || '登录失败，请检查账号密码'
  } finally {
    authLoading.value = false
  }
}

async function handleRegister() {
  clearAuthErrorState()
  authLoading.value = true
  try {
    const res = await axios.post(`${SSO_BASE}/auth/register`, {
      username: registerForm.value.username,
      password: registerForm.value.password,
      phone: registerForm.value.phone,
      verifyCode: registerForm.value.verifyCode,
      avatar: registerForm.value.avatar,
    })
    if (isAuthSuccess(res)) {
      authSuccess.value = getAuthMessage(res, '注册成功！请登录')
      authTab.value = 'login'
    } else {
      authError.value = getAuthMessage(res, '注册失败，请稍后重试')
    }
  } catch (e) {
    authError.value = e.response?.data?.msg || e.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    authLoading.value = false
  }
}

async function handleLogout() {
  clearAuthErrorState()
  try {
    const res = await axios.post(`${SSO_BASE}${LOGOUT_PATH}`)
    if (!isAuthSuccess(res)) {
      authError.value = getAuthMessage(res, '登出失败，请稍后重试')
      return
    }
    authSuccess.value = getAuthMessage(res, '已退出登录')
  } catch (e) {
    authError.value = e.response?.data?.msg || e.response?.data?.message || '登出失败，请稍后重试'
    return
  }

  clearAuthState()
  showLogin.value = false
  menuOpen.value = false
  authTab.value = 'login'
}

async function handleAvatarFileChange(event) {
  const file = event.target?.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  avatarUploading.value = true
  authError.value = ''

  try {
    const res = await axios.post(`${SERVICE_BASE}/common/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    if (!isAuthSuccess(res)) {
      authError.value = getAuthMessage(res, '头像上传失败，请稍后重试')
      return
    }

    const uploadUrl = resolveUploadUrl(getAuthData(res))
    if (!uploadUrl) {
      authError.value = '头像上传成功，但未返回可用URL'
      return
    }

    registerForm.value.avatar = uploadUrl
    authSuccess.value = '头像上传成功'
  } catch (e) {
    authError.value = e.response?.data?.msg || e.response?.data?.message || '头像上传失败，请稍后重试'
  } finally {
    avatarUploading.value = false
    if (event?.target) event.target.value = ''
  }
}

async function sendResetSms() {
  if (!resetForm.value.phone) {
    authError.value = '请先填写手机号'
    return
  }

  try {
    const res = await axios.post(`${SSO_BASE}/auth/send/phone/verify-code/register`, {
      phone: resetForm.value.phone,
    })
    if (isAuthSuccess(res)) {
      startCountdown(resetSmsCooldown)
      authSuccess.value = '验证码已发送'
    } else {
      authError.value = getAuthMessage(res, '发送失败')
    }
  } catch (e) {
    authError.value = e.response?.data?.msg || e.response?.data?.message || '发送失败，请稍后重试'
  }
}

async function handleResetPassword() {
  clearAuthErrorState()
  authLoading.value = true
  try {
    const payload = new URLSearchParams({
      phone: resetForm.value.phone,
      verifyCode: resetForm.value.verifyCode,
      password: resetForm.value.newPassword,
    })

    const res = await axios.put(`${SSO_BASE}${RESET_PASSWORD_PATH}`, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    if (isAuthSuccess(res)) {
      authSuccess.value = getAuthMessage(res, '密码已重置，请重新登录')
      loginForm.value.login = resetForm.value.phone
      loginForm.value.password = ''
      authTab.value = 'login'
      resetForm.value.verifyCode = ''
      resetForm.value.newPassword = ''
    } else {
      authError.value = getAuthMessage(res, '重置密码失败，请稍后重试')
    }
  } catch (e) {
    authError.value = e.response?.data?.msg || e.response?.data?.message || '重置密码失败，请稍后重试'
  } finally {
    authLoading.value = false
  }
}

async function sendSms() {
  if (!registerForm.value.phone) {
    authError.value = '请先填写手机号'
    return
  }
  try {
    const res = await axios.post(
    `${SSO_BASE}/auth/send/phone/verify-code/register`,
    { phone: registerForm.value.phone }
    )
    if (isAuthSuccess(res)) {
      startCountdown(smsCooldown)
    } else {
      authError.value = getAuthMessage(res, '发送失败')
    }
  } catch (e) {
    authError.value = e.response?.data?.msg || e.response?.data?.message || '发送失败，请稍后重试'
  }
}
</script>

<style>
.site-root { min-height: 100vh; display: flex; flex-direction: column; }
main { flex: 1; }

/* ── NAVBAR ── */
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  transition: background 0.3s, box-shadow 0.3s, backdrop-filter 0.3s;
  background: transparent;
}
.navbar.scrolled {
  background: rgba(255,255,255,0.88);
  box-shadow: 0 16px 32px rgba(13, 17, 23, 0.06), 0 1px 0 var(--border);
  backdrop-filter: blur(16px);
}
.navbar-inner {
  max-width: 1200px; margin: 0 auto;
  padding: 20px 32px;
  display: flex; align-items: center; gap: 40px;
}
.brand {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; color: var(--ink);
  font-family: 'Noto Serif SC', serif;
  font-weight: 700; font-size: 17px;
  white-space: nowrap;
}
.brand-icon {
  width: 36px; height: 36px;
  background: var(--gold); color: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700;
  font-family: 'Noto Serif SC', serif;
  flex-shrink: 0;
}
.brand-icon.sm { width: 28px; height: 28px; font-size: 14px; border-radius: 6px; }
.nav-links {
  display: flex; gap: 8px; align-items: center; flex: 1;
}
.nav-links a {
  text-decoration: none; color: var(--ink-soft);
  padding: 8px 14px; border-radius: 8px;
  font-size: 15px; font-weight: 500;
  transition: all 0.24s ease;
  position: relative;
}
.nav-links a:hover, .nav-links a.router-link-active {
  color: var(--gold); background: var(--gold-bg);
}
.nav-links a::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 4px;
  height: 2px;
  background: var(--gold);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.24s ease;
}
.nav-links a:hover::after,
.nav-links a.router-link-active::after {
  transform: scaleX(1);
}
.nav-actions { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.auth-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.86);
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 600;
  max-width: 220px;
}
.auth-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-login {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%); color: #fff;
  border: none; cursor: pointer;
  padding: 9px 22px; border-radius: 8px;
  font-size: 14px; font-weight: 600;
  font-family: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  box-shadow: 0 10px 18px rgba(200, 151, 58, 0.24);
}
.btn-login:hover { transform: translateY(-2px); filter: saturate(1.08); box-shadow: 0 14px 24px rgba(200, 151, 58, 0.3); }
.btn-login:active { transform: translateY(0); }
.btn-logout {
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.82);
  color: var(--ink-soft);
  cursor: pointer;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.btn-logout:hover {
  background: var(--gold-bg);
  border-color: rgba(200,151,58,0.45);
  transform: translateY(-1px);
}
.btn-theme {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.82);
  color: var(--ink-soft);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}
.btn-theme:hover {
  color: var(--gold);
  border-color: rgba(200,151,58,0.45);
  background: var(--gold-bg);
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(13,17,23,0.12);
}
.hamburger {
  display: none; flex-direction: column; gap: 5px;
  background: none; border: none; cursor: pointer; padding: 4px;
}
.hamburger span {
  display: block; width: 22px; height: 2px;
  background: var(--ink); border-radius: 2px; transition: 0.3s;
}
.mobile-menu {
  display: flex; flex-direction: column; gap: 4px;
  padding: 12px 24px 20px;
  background: rgba(255,255,255,0.98);
  border-top: 1px solid var(--border);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 14px 24px rgba(13, 17, 23, 0.08);
}
.mobile-menu a {
  text-decoration: none; color: var(--ink-soft);
  padding: 12px 16px; border-radius: 8px;
  font-size: 16px; font-weight: 500;
}
.mobile-menu a:hover { background: var(--gold-bg); color: var(--gold); }
.mobile-auth-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 16px 0;
}
.auth-chip.mobile {
  width: 100%;
  max-width: none;
  justify-content: center;
  background: rgba(255,255,255,0.94);
}
.btn-login-mobile {
  margin-top: 8px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%); color: #fff;
  border: none; cursor: pointer;
  padding: 12px; border-radius: 8px;
  font-size: 15px; font-weight: 600; font-family: inherit;
}
.btn-login-mobile:active { transform: translateY(1px); }
.btn-logout-mobile {
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.88);
  color: var(--ink-soft);
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
}

.scroll-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: rgba(13, 17, 23, 0.08);
  overflow: hidden;
}
.scroll-progress-bar {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: left center;
  transform: scaleX(0);
  background: linear-gradient(90deg, #c8973a 0%, #e8b84b 100%);
  transition: transform 0.08s linear;
}

/* ── FOOTER ── */
.site-footer {
  background: var(--ink); color: rgba(255,255,255,0.6);
  padding: 40px 32px;
}
.footer-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 8px; align-items: center;
  text-align: center;
}
.footer-brand {
  display: flex; align-items: center; gap: 10px;
  color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 600;
  margin-bottom: 4px;
}
.footer-addr { font-size: 14px; }
.footer-copy { font-size: 13px; opacity: 0.7; }

/* ── MODAL ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(13,17,23,0.6);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-box {
  background: #fff; border-radius: 20px;
  padding: 36px; width: 100%; max-width: 420px;
  position: relative;
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  animation: slideUp 0.25s ease;
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.modal-close {
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; cursor: pointer;
  font-size: 18px; color: var(--ink-mute);
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.modal-close:hover { background: #f1f3f5; }

.modal-tabs {
  display: flex; gap: 4px; margin-bottom: 28px;
  background: #f1f3f5; border-radius: 10px; padding: 4px;
}
.modal-tabs button {
  flex: 1; padding: 9px; border-radius: 8px;
  border: none; cursor: pointer; font-size: 15px;
  font-weight: 600; font-family: inherit;
  color: var(--ink-mute); background: transparent;
  transition: all 0.2s;
}
.modal-tabs button.active {
  background: #fff; color: var(--gold);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.btn-link {
  background: transparent;
  border: none;
  color: var(--gold);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.btn-link:hover {
  text-decoration: underline;
}

.auth-form { display: flex; flex-direction: column; gap: 18px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 14px; font-weight: 600; color: var(--ink-soft); }
.field input {
  padding: 11px 14px; border-radius: 10px;
  border: 1.5px solid var(--border);
  font-size: 15px; font-family: inherit;
  transition: border-color 0.2s;
  outline: none;
}
.field input:focus { border-color: var(--gold); }
.phone-row { display: flex; gap: 8px; }
.phone-row input { flex: 1; }
.avatar-upload-row {
  display: flex;
  align-items: center;
}
.avatar-file-input {
  display: none;
}
.btn-avatar-upload {
  border: 1.5px dashed var(--gold);
  background: var(--gold-bg);
  color: var(--gold);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.btn-avatar-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  overflow: hidden;
  margin-top: 10px;
  border: 1px solid rgba(200,151,58,0.28);
  background: linear-gradient(135deg, #fdf6e8 0%, #fff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
  font-family: 'Noto Serif SC', serif;
  font-size: 22px;
  font-weight: 700;
}
.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ink-mute);
}
.avatar-url-preview {
  margin-top: 10px;
}
.btn-sms {
  padding: 0 14px; border-radius: 10px;
  border: 1.5px solid var(--gold); color: var(--gold);
  background: transparent; cursor: pointer;
  font-size: 13px; font-weight: 600; font-family: inherit;
  white-space: nowrap; transition: all 0.2s;
}
.btn-sms:hover:not(:disabled) { background: var(--gold-bg); }
.btn-sms:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-submit {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%); color: #fff;
  border: none; cursor: pointer;
  padding: 13px; border-radius: 10px;
  font-size: 16px; font-weight: 700; font-family: inherit;
  transition: all 0.2s; margin-top: 4px;
  box-shadow: 0 10px 18px rgba(200, 151, 58, 0.22);
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 22px rgba(200, 151, 58, 0.28); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-error { color: #e53e3e; font-size: 14px; text-align: center; }
.auth-success { color: #38a169; font-size: 14px; text-align: center; }

body.dark-theme .navbar.scrolled {
  background: rgba(11, 18, 28, 0.9);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28), 0 1px 0 var(--border);
}
body.dark-theme .brand,
body.dark-theme .nav-links a,
body.dark-theme .btn-theme,
body.dark-theme .mobile-menu a {
  color: var(--ink-soft);
}
body.dark-theme .nav-links a:hover,
body.dark-theme .nav-links a.router-link-active,
body.dark-theme .mobile-menu a:hover {
  color: var(--gold);
  background: rgba(212, 172, 102, 0.18);
}
body.dark-theme .hamburger span {
  background: var(--ink-soft);
}
body.dark-theme .mobile-menu {
  background: rgba(11, 18, 28, 0.96);
  border-top-color: var(--border);
}
body.dark-theme .btn-theme {
  background: rgba(14, 22, 34, 0.85);
  border-color: #36445c;
}
body.dark-theme .btn-theme:hover {
  background: rgba(212, 172, 102, 0.2);
}
body.dark-theme .scroll-progress {
  background: rgba(231, 237, 247, 0.08);
}
body.dark-theme .scroll-progress-bar {
  background: linear-gradient(90deg, #d4ac66 0%, #f0cb89 100%);
}
body.dark-theme .modal-overlay {
  background: rgba(5, 8, 13, 0.7);
}
body.dark-theme .modal-box {
  background: #111a28;
}
body.dark-theme .field label,
body.dark-theme .modal-tabs button,
body.dark-theme .modal-close {
  color: var(--ink-soft);
}
body.dark-theme .modal-tabs button.active {
  background: #172234;
}
body.dark-theme .modal-close:hover {
  background: #1c2738;
}

@media (max-width: 768px) {
  .nav-links { display: none; }
  .hamburger { display: flex; }
  .navbar-inner { padding: 16px 20px; }
  .btn-login { display: none; }
  .btn-theme { width: 36px; height: 36px; }
  .scroll-progress { height: 2px; }
  .navbar.scrolled {
    backdrop-filter: none;
    box-shadow: 0 8px 16px rgba(13,17,23,0.06), 0 1px 0 var(--border);
  }
  .modal-overlay { backdrop-filter: none; }
  .modal-box { box-shadow: 0 14px 28px rgba(13,17,23,0.18); }
}

@media (prefers-reduced-motion: reduce) {
  .navbar,
  .modal-box,
  .btn-login,
  .btn-submit { transition: none !important; }
  .scroll-progress-bar { transition: none !important; }
}

/* ── PAGE TRANSITION ── */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.menu-drop-enter-active,
.menu-drop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.menu-drop-enter-from,
.menu-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
