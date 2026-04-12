<template>
  <Teleport to="body">
    <div class="chat-widget" :class="{ open: isOpen }">
      <transition name="chat-float">
        <section v-if="isOpen" class="chat-panel" role="dialog" aria-modal="false" aria-label="智能咨询窗口">
          <header class="chat-header">
            <div class="chat-brand">
              <div class="chat-brand-icon">
                <SvgIcon name="bot" :size="18" />
              </div>
              <div>
                <h2>智能咨询</h2>
                <p>基于官网知识库，支持快速问答</p>
              </div>
            </div>
            <button class="chat-close" type="button" @click="closeChat" aria-label="关闭聊天窗口">
              <SvgIcon name="x" :size="16" />
            </button>
          </header>

          <div class="chat-body" ref="bodyRef">
            <div class="chat-hero-card">
              <div class="chat-hero-badge">
                <SvgIcon name="sparkles" :size="14" />
                <span>在线智能问答</span>
              </div>
              <p>
                你可以直接问我网站开发、软件定制、小程序、小游戏、合同开票或联系信息。
              </p>
            </div>

            <div class="chat-quick-row">
              <button
                v-for="item in quickQuestions"
                :key="item"
                class="chat-pill"
                type="button"
                @click="askQuickQuestion(item)"
              >
                {{ item }}
              </button>
            </div>

            <div class="chat-thread">
              <article
                v-for="msg in messages"
                :key="msg.id"
                class="chat-message"
                :class="msg.role"
              >
                <div class="chat-avatar" :class="msg.role">
                  <SvgIcon :name="msg.role === 'assistant' ? 'bot' : 'user'" :size="14" />
                </div>
                <div class="chat-bubble">
                  <template v-if="msg.loading">
                    <span class="typing-dots" aria-label="正在输入">
                      <i></i><i></i><i></i>
                    </span>
                  </template>
                  <template v-else>
                    <p v-for="line in formatMessage(msg.content)" :key="line">{{ line }}</p>
                  </template>
                </div>
              </article>
            </div>
          </div>

          <footer class="chat-footer">
            <textarea
              v-model.trim="draft"
              class="chat-input"
              rows="2"
              placeholder="输入你的问题，回车发送"
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.enter.shift.stop
            />
            <div class="chat-actions">
              <p class="chat-hint">支持多轮对话。Shift + Enter 可换行。</p>
              <button class="chat-send" type="button" :disabled="sending || !draft" @click="sendMessage">
                <SvgIcon name="send" :size="15" />
                <span>{{ sending ? '发送中...' : '发送' }}</span>
              </button>
            </div>
          </footer>
        </section>
      </transition>

      <button
        class="chat-launcher"
        type="button"
        :aria-expanded="isOpen"
        aria-label="打开智能咨询"
        @click="toggleChat"
      >
        <span class="chat-launcher-ring"></span>
        <span class="chat-launcher-icon">
          <SvgIcon name="message-circle-more" :size="19" />
        </span>
        <span class="chat-launcher-text">
          <strong>智能咨询</strong>
          <small>点我问问</small>
        </span>
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { apiClient } from '@/lib/api'

const isOpen = ref(false)
const sending = ref(false)
const draft = ref('')
const bodyRef = ref(null)
const messageId = ref(1)

const quickQuestions = [
  '你们主要做什么？',
  '开发一个网站多少钱？',
  '开发周期一般多久？',
  '可以签合同和开票吗？',
  '怎么联系你们？',
]

const messages = ref([
  {
    id: messageId.value++,
    role: 'assistant',
    content: '你好，我是熠辉科技的智能咨询助手。你可以直接问我公司业务、服务流程、报价方式和联系方式。',
  },
])

const knowledgeFallbacks = [
  {
    match: /(你们主要做什么|做什么服务|主营业务|业务范围|做什么)/,
    answer:
      '我们主要提供网站开发、软件定制、微信小程序开发和微信小游戏开发服务。\n\n如果你愿意，我也可以继续帮你判断项目适合哪种方案。',
  },
  {
    match: /(多少钱|报价|费用|价格|成本)/,
    answer:
      '项目费用会根据功能复杂度、页面数量、是否需要后台、是否接入支付或账号体系等因素变化。\n\n如果你方便，可以直接描述需求，我帮你先判断大致的开发量。',
  },
  {
    match: /(周期|多久|时间|工期|多长)/,
    answer:
      '开发周期取决于功能数量和需求确认效率。简单官网通常更快，复杂系统会更长。\n\n你可以把项目目标告诉我，我帮你拆一下大致阶段。',
  },
  {
    match: /(合同|开票|发票)/,
    answer:
      '可以。我们是正规注册企业，支持合同签署和发票开具。\n\n如果你需要，我也可以继续把适合对外沟通的标准话术整理给你。',
  },
  {
    match: /(联系|电话|微信|邮箱|地址|怎么找你们)/,
    answer:
      '公司地址是广州市天河区中山大道建中路5号，咨询电话是 13600000000。\n\n微信和邮箱目前在公开资料中还未补充完整。',
  },
]

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    void scrollToBottom()
  }
}

function closeChat() {
  isOpen.value = false
}

function askQuickQuestion(question) {
  draft.value = question
  void sendMessage()
}

function pushMessage(role, content, extra = {}) {
  messages.value.push({
    id: messageId.value++,
    role,
    content,
    loading: false,
    ...extra,
  })
}

function pushLoadingMessage() {
  const loadingMessage = {
    id: messageId.value++,
    role: 'assistant',
    content: '',
    loading: true,
  }
  messages.value.push(loadingMessage)
  return loadingMessage.id
}

function replaceMessage(id, content) {
  const target = messages.value.find((item) => item.id === id)
  if (!target) return
  target.content = content
  target.loading = false
}

function appendMessageContent(id, chunk) {
  if (!chunk) return
  const target = messages.value.find((item) => item.id === id)
  if (!target) return
  if (target.loading) {
    target.loading = false
    target.content = ''
  }
  target.content += chunk
}

function formatMessage(text) {
  if (!text) return ['']
  return String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function buildHistory() {
  return messages.value
    .filter((item) => !item.loading)
    .slice(-10)
    .map((item) => ({ role: item.role, content: item.content }))
}

function extractReply(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  const data = payload.data ?? payload.result ?? payload.answer ?? payload.reply ?? payload.message ?? payload
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    return data.reply || data.answer || data.content || data.text || ''
  }
  return ''
}

function buildFallbackReply(input) {
  const text = input.trim()
  const matched = knowledgeFallbacks.find((item) => item.match.test(text))
  if (matched) return matched.answer
  return '我已经记录你的问题了。你可以继续告诉我更具体的需求，比如项目类型、预算范围、上线时间，我会基于官网知识库帮你整理建议。'
}

async function scrollToBottom() {
  await nextTick()
  const el = bodyRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

async function sendMessage() {
  const content = draft.value.trim()
  if (!content || sending.value) return

  pushMessage('user', content)
  draft.value = ''
  sending.value = true

  const loadingId = pushLoadingMessage()
  await scrollToBottom()

  try {
    const streamed = await streamReply(content, loadingId)
    if (!streamed) {
      const res = await apiClient.post('/api/service/chat', {
        message: content,
        history: buildHistory(),
        source: 'website-chat-widget',
      })

      const reply = extractReply(res?.data)
      replaceMessage(loadingId, reply || buildFallbackReply(content))
    }
  } catch {
    replaceMessage(loadingId, buildFallbackReply(content))
  } finally {
    sending.value = false
    await scrollToBottom()
  }
}

async function streamReply(content, loadingId) {
  const response = await fetch('/api/service/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: content,
      history: buildHistory(),
      source: 'website-chat-widget',
    }),
  })

  if (!response.ok || !response.body) {
    return false
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let hasChunk = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '')

    while (buffer.includes('\n\n')) {
      const separatorIndex = buffer.indexOf('\n\n')
      const block = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)

      const parsed = parseSseBlock(block)
      if (!parsed) continue

      if (parsed.event === 'error') {
        throw new Error(parsed.data || 'stream error')
      }

      if (parsed.event === 'done') {
        return hasChunk
      }

      if (parsed.event === 'message' && parsed.data) {
        hasChunk = true
        appendMessageContent(loadingId, parsed.data)
        void scrollToBottom()
      }
    }
  }

  return hasChunk
}

function parseSseBlock(block) {
  if (!block) return null

  let eventName = 'message'
  let data = ''

  const lines = block.split('\n')
  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trimStart()
    }
  }

  if (!data && eventName !== 'done') return null
  return { event: eventName, data }
}

function handleKeydown(event) {
  if (event.key === 'Escape' && isOpen.value) {
    closeChat()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 180;
  display: flex;
  align-items: flex-end;
  gap: 14px;
  pointer-events: none;
}

.chat-widget * {
  pointer-events: auto;
}

.chat-launcher {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  padding: 12px 16px 12px 14px;
  background: linear-gradient(135deg, rgba(13, 17, 23, 0.98), rgba(32, 40, 56, 0.96));
  color: #f6f1e6;
  box-shadow: 0 24px 50px rgba(13, 17, 23, 0.28);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.chat-launcher:hover {
  transform: translateY(-2px);
  box-shadow: 0 28px 58px rgba(13, 17, 23, 0.34);
  border-color: rgba(200, 151, 58, 0.55);
}

.chat-launcher-ring {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: radial-gradient(circle at 20% 20%, rgba(200, 151, 58, 0.45), transparent 38%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.12), transparent 36%);
  opacity: 0.35;
}

.chat-launcher-icon,
.chat-launcher-text {
  position: relative;
  z-index: 1;
}

.chat-launcher-icon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #fdf6e8 0%, #e8b84b 100%);
  color: #0d1117;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.chat-launcher-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.chat-launcher-text strong {
  font-size: 14px;
  font-weight: 700;
}

.chat-launcher-text small {
  font-size: 11px;
  color: rgba(246, 241, 230, 0.72);
  margin-top: 3px;
}

.chat-panel {
  width: min(380px, calc(100vw - 32px));
  height: min(620px, calc(100vh - 120px));
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(255, 252, 246, 0.98), rgba(255, 255, 255, 0.94));
  border: 1px solid rgba(200, 151, 58, 0.18);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 32px 70px rgba(13, 17, 23, 0.22);
  backdrop-filter: blur(18px);
}

.chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(200, 151, 58, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(248, 242, 229, 0.98), rgba(255, 255, 255, 0.94));
  border-bottom: 1px solid rgba(200, 151, 58, 0.14);
}

.chat-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0d1117 0%, #20283a 100%);
  color: #f3e3bb;
  box-shadow: 0 10px 18px rgba(13, 17, 23, 0.2);
}

.chat-brand h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
}

.chat-brand p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--ink-soft);
}

.chat-close {
  border: 1px solid rgba(200, 151, 58, 0.16);
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink-soft);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.chat-close:hover {
  color: var(--gold);
  border-color: rgba(200, 151, 58, 0.35);
  transform: translateY(-1px);
}

.chat-body {
  padding: 16px;
  flex: 1;
  overflow: auto;
  scroll-behavior: smooth;
  background:
    radial-gradient(circle at top right, rgba(200, 151, 58, 0.08), transparent 22%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 246, 238, 0.9));
}

.chat-hero-card {
  padding: 14px 14px 12px;
  border-radius: 20px;
  border: 1px solid rgba(200, 151, 58, 0.14);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(253, 246, 232, 0.85));
  box-shadow: 0 10px 24px rgba(13, 17, 23, 0.05);
}

.chat-hero-card p {
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.8;
}

.chat-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(200, 151, 58, 0.12);
  color: #8a6420;
  font-size: 12px;
  font-weight: 700;
}

.chat-quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 12px;
}

.chat-pill {
  border: 1px solid rgba(200, 151, 58, 0.18);
  background: rgba(255, 255, 255, 0.92);
  color: var(--ink-soft);
  border-radius: 999px;
  padding: 8px 11px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.chat-pill:hover {
  transform: translateY(-1px);
  border-color: rgba(200, 151, 58, 0.34);
  background: var(--gold-bg);
  color: var(--gold);
}

.chat-thread {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 4px;
}

.chat-message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.chat-avatar {
  width: 30px;
  height: 30px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #0d1117;
}

.chat-avatar.assistant {
  background: linear-gradient(135deg, #fdf6e8, #e8b84b);
}

.chat-avatar.user {
  background: linear-gradient(135deg, #1c2636, #394c69);
  color: #f8f5ee;
}

.chat-bubble {
  max-width: 72%;
  padding: 11px 13px;
  border-radius: 18px;
  font-size: 13px;
  line-height: 1.75;
  box-shadow: 0 8px 20px rgba(13, 17, 23, 0.05);
}

.chat-message.assistant .chat-bubble {
  background: #fff;
  border: 1px solid rgba(200, 151, 58, 0.12);
  color: var(--ink);
  border-top-left-radius: 6px;
}

.chat-message.user .chat-bubble {
  background: linear-gradient(135deg, #0d1117, #24314a);
  color: #f7f3e9;
  border-top-right-radius: 6px;
}

.chat-bubble p + p {
  margin-top: 6px;
}

.typing-dots {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  min-height: 22px;
}

.typing-dots i {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--gold);
  display: inline-block;
  animation: chatPulse 1.2s infinite ease-in-out;
}

.typing-dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots i:nth-child(3) {
  animation-delay: 0.3s;
}

.chat-footer {
  padding: 14px 16px 16px;
  border-top: 1px solid rgba(200, 151, 58, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(252, 247, 239, 0.98));
}

.chat-input {
  width: 100%;
  resize: none;
  border-radius: 18px;
  border: 1px solid rgba(200, 151, 58, 0.18);
  padding: 12px 13px;
  background: #fff;
  color: var(--ink);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  outline: none;
}

.chat-input::placeholder {
  color: var(--ink-mute);
}

.chat-actions {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.chat-hint {
  font-size: 11px;
  color: var(--ink-mute);
}

.chat-send {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%);
  color: #fff;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 22px rgba(200, 151, 58, 0.26);
  transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
}

.chat-send:hover {
  transform: translateY(-1px);
  filter: saturate(1.05);
}

.chat-send:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.chat-float-enter-active,
.chat-float-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chat-float-enter-from,
.chat-float-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@keyframes chatPulse {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-3px); opacity: 1; }
}

@media (max-width: 768px) {
  .chat-widget {
    right: 14px;
    bottom: 14px;
  }

  .chat-panel {
    width: min(100vw - 28px, 380px);
    height: min(72vh, 620px);
  }

  .chat-launcher {
    padding: 11px 14px 11px 12px;
  }

  .chat-launcher-text strong {
    font-size: 13px;
  }

  .chat-launcher-text small {
    display: none;
  }

  .chat-bubble {
    max-width: 82%;
  }

  .chat-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .chat-send {
    justify-content: center;
  }
}
</style>