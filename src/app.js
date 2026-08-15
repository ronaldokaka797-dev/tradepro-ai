import { createClient } from '@supabase/supabase-js';
import './styles.css';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPPORT_EMAIL } from './config.js';

(() => {
  'use strict';

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });

  const state = {
    config: null,
    user: null,
    subscription: null,
    csrfToken: '',
    authMode: 'login',
    pendingPlan: null,
    product: null,
    currentUsdtOrder: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const el = {
    siteHeader: $('#siteHeader'),
    marketing: $('#marketingView'),
    dashboard: $('#dashboardView'),
    footer: $('#siteFooter'),
    mainNav: $('#mainNav'),
    mobileToggle: $('#mobileToggle'),
    loginNav: $('#loginNav'),
    startNav: $('#startNav'),
    accountChip: $('#accountChip'),
    accountAvatar: $('#accountAvatar'),
    accountLabel: $('#accountLabel'),
    authDialog: $('#authDialog'),
    authClose: $('#authClose'),
    loginTab: $('#loginTab'),
    registerTab: $('#registerTab'),
    authTitle: $('#authTitle'),
    authSubtitle: $('#authSubtitle'),
    authForm: $('#authForm'),
    authSubmit: $('#authSubmit'),
    authError: $('#authError'),
    authSwitch: $('#authSwitch'),
    password: $('#password'),
    showPass: $('#showPass'),
    termsRow: $('#termsRow'),
    acceptTerms: $('#acceptTerms'),
    legalDialog: $('#legalDialog'),
    legalClose: $('#legalClose'),
    legalTitle: $('#legalTitle'),
    legalBody: $('#legalBody'),
    demoBanner: $('#demoBanner'),
    toastRegion: $('#toastRegion')
  };

  const legalCopy = {
    terms: {
      title: 'الشروط والأحكام',
      body: `
        <p>آخر تحديث: 14 آب 2026. باستخدام موقع TradePro AI أو شراء اشتراك، فإنك توافق على هذه الشروط.</p>
        <h3>1. الحساب والترخيص</h3>
        <p>يُمنح المشترك ترخيصاً شخصياً، محدوداً، وغير قابل للنقل لاستخدام البرنامج طوال مدة الاشتراك الفعّال. لا يجوز مشاركة الحساب، إعادة بيع البرنامج، فك حمايته، أو توزيعه.</p>
        <h3>2. الاشتراك والدفع</h3>
        <p>يمكن الدفع بالبطاقة عبر Stripe أو باستخدام USDT على شبكة TRC20. دفع البطاقة قد يتجدد حسب الباقة، أما USDT فهو دفعة واحدة للمدة المختارة.</p>
        <h3>3. الاستخدام المقبول</h3>
        <p>يجب استخدام النظام بصورة قانونية وبما يتوافق مع شروط الوسيط أو مزود البيانات الذي تتعامل معه. يحق لنا تعليق الوصول عند إساءة الاستخدام أو مشاركة الترخيص.</p>
        <h3>4. طبيعة الخدمة</h3>
        <p>قد تتغير المميزات أو متطلبات التشغيل مع التحديثات. نسعى لاستمرارية الخدمة، لكن لا نضمن أن تكون خالية تماماً من الانقطاع أو الأخطاء.</p>
        <h3>5. المخاطر</h3>
        <p>TradePro AI أداة تقنية وليس مستشاراً مالياً. أنت مسؤول بالكامل عن قراراتك ونتائج تداولك.</p>`
    },
    privacy: {
      title: 'سياسة الخصوصية',
      body: `
        <p>نحترم خصوصيتك ونستخدم الحد الأدنى من البيانات اللازمة لتشغيل حسابك وتقديم الخدمة.</p>
        <h3>البيانات التي نجمعها</h3>
        <ul><li>البريد الإلكتروني وبيانات الحساب.</li><li>حالة الاشتراك ومعرّف الدفع القادم من Stripe أو شبكة TRON.</li><li>سجل تنزيل البرنامج، وعنوان IP ومعلومات المتصفح لأغراض حماية الترخيص.</li></ul>
        <h3>الدفع</h3><p>دفع البطاقة يُعالج داخل Stripe ولا نخزّن رقم البطاقة. وعند استخدام USDT لا نطلب العبارة السرية أو المفتاح الخاص؛ نتحقق من التحويل العام فقط.</p>
        <h3>الحماية والاحتفاظ</h3><p>تُخزّن كلمات المرور بصورة مشفّرة أحادية الاتجاه. نحتفظ بالبيانات طالما كان حسابك قائماً أو بقدر ما تفرضه المتطلبات القانونية والمحاسبية.</p>
        <h3>حقوقك</h3><p>يمكنك طلب نسخة من بياناتك أو تصحيحها أو حذف حسابك عبر البريد المبيّن في الموقع، مع مراعاة أي التزام قانوني بالاحتفاظ بسجلات الدفع.</p>`
    },
    refund: {
      title: 'سياسة الاسترجاع',
      body: `
        <p>لأن المنتج رقمي ويصبح قابلاً للتنزيل بعد التفعيل، تُراجع طلبات الاسترجاع بصورة فردية.</p>
        <h3>متى يمكن تقديم طلب؟</h3><p>يمكنك التواصل خلال 7 أيام من أول عملية شراء إذا واجهت مشكلة تقنية جوهرية تمنع تشغيل البرنامج ولم يتمكن الدعم من حلها.</p>
        <h3>حالات غير مشمولة</h3><ul><li>الخسائر أو النتائج المرتبطة بالتداول.</li><li>عدم توافق الجهاز مع المتطلبات المعلنة.</li><li>مخالفة شروط الترخيص أو مشاركة الحساب.</li><li>دفعات التجديد بعد مرور مدة معقولة من إشعار الدفع.</li></ul>
        <p>هذه السياسة لا تنتقص من الحقوق الإلزامية التي يمنحها القانون المعمول به للمستهلك.</p>`
    },
    risk: {
      title: 'إخلاء مسؤولية المخاطر',
      body: `
        <p><strong>التداول في الأسواق المالية والعملات والأصول الرقمية ينطوي على مخاطر مرتفعة وقد يؤدي إلى خسارة جزء أو كامل رأس المال.</strong></p>
        <p>TradePro AI برنامج تقني ولا يقدم استشارة استثمارية أو توصية شخصية، ولا يضمن الربح أو دقة أي نتيجة مستقبلية. الأداء السابق، والاختبارات، والإشارات التقنية ليست ضماناً للأداء المستقبلي.</p>
        <p>أنت المسؤول عن تقييم ملاءمة أي عملية تداول لوضعك المالي وخبرتك وقدرتك على تحمل الخسارة. استخدم حساباً تجريبياً أولاً، ولا تتداول بأموال لا يمكنك تحمل خسارتها، واستشر مختصاً مرخصاً عند الحاجة.</p>`
    }
  };

  async function invokeFunction(name, body = {}) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('يرجى تسجيل الدخول أولاً.');
    let response;
    try {
      response = await fetch(`/api/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error('تعذّر الاتصال بالخادم. حاول مرة ثانية.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.error) throw new Error(data?.error || 'تعذّر إكمال الطلب.');
    return data;
  }

  async function init() {
    bindEvents();
    initReveal();
    $('#year').textContent = new Date().getFullYear();
    state.config = { demoMode: false, supportEmail: SUPPORT_EMAIL };
    applyConfig();

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      toast('إعدادات Supabase غير موجودة.', 'error', 6000);
      return;
    }

    try {
      await refreshAccount();
    } catch (error) {
      toast(error.message, 'error', 5000);
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        state.user = null;
        state.subscription = null;
        state.product = null;
        renderAuthState();
        renderRoute();
      }
    });

    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      toast('تم استلام عملية الدفع. يتم الآن تحديث اشتراكك.', 'success', 5000);
      history.replaceState({}, '', `${location.pathname}#dashboard`);
      [1500, 3500, 7000].forEach(delay => setTimeout(() => refreshAccount().catch(() => {}), delay));
    } else if (params.get('payment') === 'cancelled') {
      toast('تم إلغاء عملية الدفع، ولم يتم خصم أي مبلغ.', 'error');
      history.replaceState({}, '', `${location.pathname}#pricing`);
    } else if (params.get('verified') === '1') {
      toast('تم تأكيد بريدك الإلكتروني بنجاح.');
      history.replaceState({}, '', `${location.pathname}#dashboard`);
    }
    renderRoute();
  }

  function applyConfig() {
    const email = state.config.supportEmail;
    ['supportLink', 'dashSupportLink', 'footerSupport'].forEach(id => {
      const link = document.getElementById(id);
      if (link) link.href = `mailto:${email}`;
    });
    el.demoBanner.classList.add('hidden');
  }

  async function refreshAccount() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('تعذّر التحقق من جلسة الحساب.');
    const authUser = sessionData.session?.user;

    if (!authUser) {
      state.user = null;
      state.subscription = null;
      renderAuthState();
      renderRoute();
      return;
    }

    state.user = {
      id: authUser.id,
      email: authUser.email,
      createdAt: authUser.created_at
    };

    const { data: rows, error } = await supabase
      .from('subscriptions')
      .select('id, plan_id, status, starts_at, ends_at, stripe_subscription_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw new Error('تعذّر تحميل حالة الاشتراك. تأكد من تنفيذ ملف قاعدة البيانات.');

    const now = Date.now();
    const active = (rows || []).find(row => row.status === 'active' && (!row.ends_at || new Date(row.ends_at).getTime() > now));
    const row = active || rows?.[0] || null;
    state.subscription = row ? {
      id: row.id,
      planId: row.plan_id,
      planName: ({ monthly: 'الشهري', quarterly: '3 أشهر', yearly: 'السنوي' })[row.plan_id] || row.plan_id,
      status: active ? 'active' : row.status,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      managedByStripe: Boolean(row.stripe_subscription_id)
    } : null;

    renderAuthState();
    await refreshProduct();
    renderDashboard();
    renderRoute();
  }

  function renderAuthState() {
    const loggedIn = Boolean(state.user);
    el.loginNav.classList.toggle('hidden', loggedIn);
    el.startNav.classList.toggle('hidden', loggedIn);
    el.accountChip.classList.toggle('hidden', !loggedIn);
    if (loggedIn) {
      const emailName = state.user.email.split('@')[0];
      el.accountAvatar.textContent = emailName.charAt(0) || 'T';
      el.accountLabel.textContent = emailName;
    }
  }

  function renderRoute() {
    const wantsDashboard = location.hash === '#dashboard';
    if (wantsDashboard && state.user) {
      el.marketing.classList.add('hidden');
      el.dashboard.classList.remove('hidden');
      el.footer.classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      el.marketing.classList.remove('hidden');
      el.dashboard.classList.add('hidden');
      el.footer.classList.remove('hidden');
      if (wantsDashboard && state.config && !state.user) openAuth('login');
    }
  }

  function renderDashboard() {
    if (!state.user) return;
    const emailName = state.user.email.split('@')[0];
    $('#dashName').textContent = emailName;
    $('#dashEmail').textContent = state.user.email;
    $('#dashJoined').textContent = formatDate(state.user.createdAt);

    const sub = state.subscription;
    const active = sub?.status === 'active' && (!sub.endsAt || new Date(sub.endsAt) > new Date());
    $('#subPlanName').textContent = active ? `باقة ${sub.planName}` : 'ما عندك اشتراك فعّال';
    const status = $('#subStatus');
    status.className = `status-pill ${active ? 'active' : 'inactive'}`;
    status.innerHTML = `<i></i> ${active ? 'فعّال' : statusLabel(sub?.status)}`;

    const detail = $('#subscriptionDetail');
    if (active) {
      detail.innerHTML = `<dl><div><dt>تاريخ التفعيل</dt><dd>${escapeHtml(formatDate(sub.startsAt))}</dd></div><div><dt>التجديد القادم</dt><dd>${escapeHtml(formatDate(sub.endsAt))}</dd></div></dl>`;
    } else {
      detail.innerHTML = '<p>اختر إحدى الباقات حتى تحصل على وصول كامل للنظام.</p>';
    }
    $('#choosePlanBtn').classList.toggle('hidden', active);
    $('#manageBillingBtn').classList.toggle('hidden', !active || !sub?.managedByStripe);

    const downloadCard = $('#downloadCard');
    const downloadBtn = $('#downloadBtn');
    const available = Boolean(state.product?.available);
    downloadCard.classList.toggle('disabled', !active || !available);
    downloadBtn.disabled = !active || !available;
    downloadBtn.innerHTML = !active
      ? 'يتطلب اشتراكاً <span>↓</span>'
      : available ? 'تنزيل النظام <span>↓</span>' : 'الملف يُرفع قريباً';

    if (state.product) {
      const size = state.product.size ? ` • ${formatBytes(state.product.size)}` : '';
      $('#productMeta').textContent = `الإصدار ${state.product.version} • Windows 10/11 • 64-bit${size}`;
      downloadBtn.title = available ? 'تنزيل أحدث إصدار' : 'سيُضاف ملف EXE من إدارة الموقع';
    }
  }

  async function refreshProduct() {
    if (!state.user) {
      state.product = null;
      return;
    }
    try {
      state.product = await invokeFunction('get-product');
    } catch {
      state.product = { version: '1.0.0', available: false, size: null };
    }
  }

  function openAuth(mode = 'login', pendingPlan = null) {
    if (pendingPlan) {
      state.pendingPlan = pendingPlan;
      localStorage.setItem('tradepro_pending_plan', pendingPlan);
    }
    setAuthMode(mode);
    el.authError.classList.add('hidden');
    el.authForm.reset();
    if (typeof el.authDialog.showModal === 'function') el.authDialog.showModal();
    else el.authDialog.setAttribute('open', '');
    document.body.classList.add('dialog-open');
    setTimeout(() => $('#email').focus(), 80);
  }

  function closeAuth() {
    el.authDialog.close();
    document.body.classList.remove('dialog-open');
  }

  function setAuthMode(mode) {
    state.authMode = mode;
    const register = mode === 'register';
    el.loginTab.classList.toggle('active', !register);
    el.registerTab.classList.toggle('active', register);
    el.authTitle.textContent = register ? 'أنشئ حسابك' : 'أهلاً برجعتك';
    el.authSubtitle.textContent = register ? 'خطوة واحدة وتكون جاهز تختار باقتك.' : 'سجّل دخولك حتى توصل إلى نظامك.';
    $('.button-text', el.authSubmit).textContent = register ? 'إنشاء الحساب' : 'تسجيل الدخول';
    el.termsRow.classList.toggle('hidden', !register);
    el.password.autocomplete = register ? 'new-password' : 'current-password';
    el.authSwitch.innerHTML = register
      ? 'عندك حساب؟ <button type="button">سجّل دخول</button>'
      : 'ما عندك حساب؟ <button type="button">أنشئ حساب جديد</button>';
    $('button', el.authSwitch).addEventListener('click', () => setAuthMode(register ? 'login' : 'register'));
    el.authError.classList.add('hidden');
  }

  async function submitAuth(event) {
    event.preventDefault();
    const form = new FormData(el.authForm);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    if (!email || !password) return showAuthError('اكتب البريد الإلكتروني وكلمة المرور.');
    if (password.length < 8) return showAuthError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
    if (state.authMode === 'register' && !el.acceptTerms.checked) return showAuthError('يجب الموافقة على الشروط وسياسة الخصوصية.');

    setAuthLoading(true);
    try {
      let result;
      if (state.authMode === 'register') {
        result = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/?verified=1#dashboard` }
        });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      if (result.error) throw result.error;

      if (state.authMode === 'register' && !result.data.session) {
        closeAuth();
        toast('تم إنشاء الحساب. افتح رسالة التأكيد المرسلة إلى بريدك ثم سجّل الدخول.', 'success', 7000);
        return;
      }

      closeAuth();
      toast(state.authMode === 'register' ? 'تم إنشاء حسابك بنجاح. أهلاً بيك!' : 'تم تسجيل الدخول بنجاح.');
      await refreshAccount();
      const plan = state.pendingPlan || localStorage.getItem('tradepro_pending_plan');
      state.pendingPlan = null;
      localStorage.removeItem('tradepro_pending_plan');
      if (plan) openPaymentChoice(plan);
      else location.hash = 'dashboard';
    } catch (error) {
      const map = {
        'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        'Email not confirmed': 'يجب تأكيد البريد الإلكتروني أولاً.',
        'User already registered': 'هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.'
      };
      showAuthError(map[error.message] || error.message || 'تعذّر إكمال تسجيل الدخول.');
    } finally {
      setAuthLoading(false);
    }
  }

  function showAuthError(message) {
    el.authError.textContent = message;
    el.authError.classList.remove('hidden');
  }

  function setAuthLoading(loading) {
    el.authSubmit.disabled = loading;
    el.authSubmit.classList.toggle('loading', loading);
  }

  async function buyPlan(planId) {
    if (!state.user) return openAuth('register', planId);
    openPaymentChoice(planId);
  }

  function ensurePaymentChoiceDialog() {
    let dialog = $('#paymentChoiceDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'paymentChoiceDialog';
    dialog.className = 'payment-choice-dialog';
    dialog.innerHTML = `
      <button class="dialog-close" data-payment-close type="button" aria-label="إغلاق">×</button>
      <div class="payment-choice-head"><span class="section-kicker">طريقة الدفع</span><h2>شلون تحب تدفع؟</h2><p>اختر الطريقة المناسبة إلك لإكمال الاشتراك.</p></div>
      <div class="payment-method-grid">
        <button class="payment-method-card card-method" data-pay-method="card" type="button">
          <span class="method-icon"><svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M3 10h18M16 15h2"/></svg></span>
          <span class="method-copy"><b>Visa / Mastercard</b><small>دفع آمن عبر Stripe</small><em>تجديد تلقائي حسب الباقة</em></span>
          <span class="method-arrow">←</span>
        </button>
        <button class="payment-method-card usdt-method" data-pay-method="usdt" type="button">
          <span class="method-icon usdt-symbol">₮</span>
          <span class="method-copy"><b>USDT — TRC20</b><small>تحويل عبر شبكة TRON</small><em>دفعة واحدة وتأكيد تلقائي</em></span>
          <span class="method-arrow">←</span>
        </button>
      </div>
      <div class="payment-choice-safe"><span>♢</span><p>الدفع بالبطاقة يتم داخل Stripe. دفع USDT يتأكد تلقائياً من البلوكتشين.</p></div>`;
    document.body.appendChild(dialog);
    $('[data-payment-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    $('[data-pay-method="card"]', dialog).addEventListener('click', () => {
      const planId = dialog.dataset.planId;
      dialog.close();
      startStripeCheckout(planId);
    });
    $('[data-pay-method="usdt"]', dialog).addEventListener('click', () => {
      const planId = dialog.dataset.planId;
      dialog.close();
      startUsdtCheckout(planId);
    });
    return dialog;
  }

  function openPaymentChoice(planId) {
    const dialog = ensurePaymentChoiceDialog();
    dialog.dataset.planId = planId;
    dialog.showModal();
  }

  async function startStripeCheckout(planId) {
    try {
      toast('جاري فتح صفحة الدفع الآمنة...', 'success', 2200);
      const result = await invokeFunction('create-checkout', { planId });
      if (result.url) location.href = result.url;
    } catch (error) {
      toast(error.message, 'error', 5000);
    }
  }

  async function startUsdtCheckout(planId) {
    try {
      const order = await invokeFunction('create-usdt-order', { planId });
      openUsdtPayment(order);
    } catch (error) {
      toast(error.message, 'error', 5000);
    }
  }

  function ensureUsdtDialog() {
    let dialog = $('#usdtDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'usdtDialog';
    dialog.className = 'usdt-dialog';
    dialog.innerHTML = `
      <button class="dialog-close" data-usdt-close type="button" aria-label="إغلاق">×</button>
      <div class="usdt-head">
        <span class="usdt-logo">₮</span>
        <div><span class="section-kicker">دفع آمن بالعملات الرقمية</span><h2>ادفع باستخدام USDT</h2><p>شبكة TRON — TRC20 فقط</p></div>
      </div>
      <div class="usdt-warning"><b>مهم جداً</b><span>أرسل USDT على شبكة TRC20 فقط. الإرسال على شبكة مختلفة قد يؤدي إلى ضياع المبلغ.</span></div>
      <div class="usdt-amount"><small>المبلغ المطلوب</small><strong><span id="usdtAmount">—</span> USDT</strong><em id="usdtPlan">—</em></div>
      <div class="wallet-box"><label>عنوان الاستلام</label><div><code id="usdtWallet" dir="ltr">—</code><button id="copyWalletBtn" type="button">نسخ</button></div></div>
      <ol class="usdt-steps"><li>انسخ العنوان وحوّل المبلغ الدقيق من محفظتك.</li><li>بعد تأكيد التحويل، انسخ رقم المعاملة TXID.</li><li>الصق TXID أدناه واضغط تحقق؛ يتفعّل اشتراكك تلقائياً.</li></ol>
      <form id="usdtVerifyForm">
        <label for="usdtTxid">رقم المعاملة TXID</label>
        <input id="usdtTxid" dir="ltr" autocomplete="off" placeholder="64-character transaction ID" maxlength="64" required>
        <div class="form-error hidden" id="usdtError" role="alert"></div>
        <button class="btn btn-primary" id="verifyUsdtBtn" type="submit">تحقق وفعّل الاشتراك</button>
      </form>
      <p class="usdt-foot">لا ترسل العبارة السرية أو Private Key لأي شخص. نحتاج TXID العام فقط.</p>`;
    document.body.appendChild(dialog);
    $('[data-usdt-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    $('#copyWalletBtn', dialog).addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(state.currentUsdtOrder?.walletAddress || '');
        $('#copyWalletBtn', dialog).textContent = 'تم النسخ ✓';
        setTimeout(() => { $('#copyWalletBtn', dialog).textContent = 'نسخ'; }, 1600);
      } catch { toast('انسخ العنوان يدوياً.', 'error'); }
    });
    $('#usdtVerifyForm', dialog).addEventListener('submit', verifyUsdtPayment);
    return dialog;
  }

  function openUsdtPayment(order) {
    state.currentUsdtOrder = order;
    const dialog = ensureUsdtDialog();
    $('#usdtAmount', dialog).textContent = Number(order.amount).toFixed(2);
    $('#usdtPlan', dialog).textContent = `باقة ${order.planName}`;
    $('#usdtWallet', dialog).textContent = order.walletAddress;
    $('#usdtTxid', dialog).value = '';
    $('#usdtError', dialog).classList.add('hidden');
    dialog.showModal();
  }

  async function verifyUsdtPayment(event) {
    event.preventDefault();
    const dialog = $('#usdtDialog');
    const txid = $('#usdtTxid', dialog).value.trim();
    const errorBox = $('#usdtError', dialog);
    const button = $('#verifyUsdtBtn', dialog);
    errorBox.classList.add('hidden');
    if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
      errorBox.textContent = 'تأكد من TXID: يجب أن يكون 64 حرفاً.';
      return errorBox.classList.remove('hidden');
    }
    button.disabled = true;
    button.textContent = 'جاري التحقق من شبكة TRON...';
    try {
      const result = await invokeFunction('verify-usdt-payment', { orderId: state.currentUsdtOrder.orderId, txid });
      if (result.verified) {
        dialog.close();
        toast(result.message || 'تم تأكيد الدفع وتفعيل الاشتراك.', 'success', 6000);
        await refreshAccount();
        location.hash = 'dashboard';
      }
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove('hidden');
    } finally {
      button.disabled = false;
      button.textContent = 'تحقق وفعّل الاشتراك';
    }
  }

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      state.user = null;
      state.subscription = null;
      state.product = null;
      renderAuthState();
      location.hash = 'home';
      toast('تم تسجيل الخروج. نشوفك على خير!');
    } catch (error) {
      toast(error.message || 'تعذّر تسجيل الخروج.', 'error');
    }
  }

  async function manageBilling() {
    try {
      const result = await invokeFunction('billing-portal');
      if (result.url) location.href = result.url;
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  async function downloadProduct() {
    if (!state.subscription || state.subscription.status !== 'active') return toast('تحتاج إلى اشتراك فعّال أولاً.', 'error');
    if (!state.product?.available) return toast('ملف النظام سيُرفع قريباً، واشتراكك محفوظ.', 'error');
    try {
      const result = await invokeFunction('download-product');
      if (result.url) {
        location.href = result.url;
        toast('بدأ تنزيل ملف TradePro AI.');
      }
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  function openLegal(key) {
    const content = legalCopy[key];
    if (!content) return;
    el.legalTitle.textContent = content.title;
    el.legalBody.innerHTML = content.body;
    el.legalDialog.showModal();
    document.body.classList.add('dialog-open');
  }

  function closeLegal() {
    el.legalDialog.close();
    if (!el.authDialog.open) document.body.classList.remove('dialog-open');
  }

  function toast(message, type = 'success', duration = 3800) {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.innerHTML = `<i>${type === 'error' ? '!' : '✓'}</i><span></span>`;
    $('span', node).textContent = message;
    el.toastRegion.appendChild(node);
    setTimeout(() => {
      node.classList.add('out');
      setTimeout(() => node.remove(), 250);
    }, duration);
  }

  function bindEvents() {
    window.addEventListener('scroll', () => el.siteHeader.classList.toggle('scrolled', scrollY > 10), { passive: true });
    window.addEventListener('hashchange', renderRoute);

    el.mobileToggle.addEventListener('click', () => {
      const open = el.mainNav.classList.toggle('open');
      el.mobileToggle.setAttribute('aria-expanded', String(open));
    });
    $$('a', el.mainNav).forEach(link => link.addEventListener('click', () => {
      el.mainNav.classList.remove('open');
      el.mobileToggle.setAttribute('aria-expanded', 'false');
    }));

    el.loginNav.addEventListener('click', () => openAuth('login'));
    el.startNav.addEventListener('click', () => openAuth('register'));
    el.accountChip.addEventListener('click', () => { location.hash = 'dashboard'; });
    $$('[data-open-auth]').forEach(button => button.addEventListener('click', () => openAuth(button.dataset.openAuth)));
    $$('[data-buy]').forEach(button => button.addEventListener('click', () => buyPlan(button.dataset.buy)));

    el.authClose.addEventListener('click', closeAuth);
    el.loginTab.addEventListener('click', () => setAuthMode('login'));
    el.registerTab.addEventListener('click', () => setAuthMode('register'));
    el.authForm.addEventListener('submit', submitAuth);
    el.showPass.addEventListener('click', () => {
      const show = el.password.type === 'password';
      el.password.type = show ? 'text' : 'password';
      el.showPass.setAttribute('aria-label', show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
    });
    el.authDialog.addEventListener('click', event => {
      if (event.target === el.authDialog) closeAuth();
    });
    el.authDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));

    $$('[data-legal]').forEach(button => button.addEventListener('click', () => openLegal(button.dataset.legal)));
    el.legalClose.addEventListener('click', closeLegal);
    el.legalDialog.addEventListener('click', event => { if (event.target === el.legalDialog) closeLegal(); });
    el.legalDialog.addEventListener('close', () => { if (!el.authDialog.open) document.body.classList.remove('dialog-open'); });

    $('#logoutBtn').addEventListener('click', logout);
    $('#manageBillingBtn').addEventListener('click', manageBilling);
    $('#downloadBtn').addEventListener('click', downloadProduct);
    $('#choosePlanBtn').addEventListener('click', () => {
      el.marketing.classList.remove('hidden');
      el.dashboard.classList.add('hidden');
      el.footer.classList.remove('hidden');
    });
  }

  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(node => node.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px' });
    $$('.reveal').forEach(node => observer.observe(node));
  }

  function statusLabel(status) {
    const labels = { cancelled: 'ملغي', expired: 'منتهي', past_due: 'الدفع متأخر', unpaid: 'غير مدفوع', incomplete: 'غير مكتمل' };
    return labels[status] || 'غير فعّال';
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value.endsWith?.('Z') || value.includes?.('+') ? value : `${value}Z`);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  function formatBytes(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  init();
})();
