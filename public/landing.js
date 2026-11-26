// AI Summit landing page: Arabic RTL, neo-brutalist event style. Own SVG/CSS only.
import { h } from "/kit.js";
const ar = (n) => Number(n).toLocaleString("ar-EG", { useGrouping: false });
const TOPICS = ["كلمة رئيسية", "منتجات جديدة", "نقاشات مفتوحة", "ميزات جديدة", "ورش عمل"];
const NAMES = ["طارق محمود", "سارة عبد الله", "ليلى كريم", "أحمد حسن", "شيرين كمال", "عمر سعيد", "منى جمال", "يوسف علي"];
const SQ = ["الذكاء الاصطناعي", "الأمان والثقة", "توسع عالمي", "مستقبل الدفع", "بناء القدرات"];
const SPEAKERS = [["طارق محمود", "الرئيس التنفيذي", "منصة بيلي", "طم"], ["سارة عبد الله", "مدير التكنولوجيا", "فينتك هب", "سا"], ["ليلى كريم", "رئيس المنتجات", "محفظتي", "لك"], ["أحمد حسن", "رئيس قسم الهوية", "ترست لابس", "أح"], ["شيرين كمال", "مدير الخصوصية", "بنك المستقبل", "شك"], ["عمر سعيد", "رئيس المدفوعات", "باي تاب", "عس"], ["منى جمال", "مدير منتج", "كابيتال إكس", "مج"], ["يوسف علي", "نائب الرئيس", "إيزي باي", "يع"]];
const AGENDA = [["الكلمة الافتتاحية", "دعم كل خدمة تكنولوجيا مالية، إطلاق الحرية المالية، والتمهيد لعصر التمويل المفتوح. اكتشف كيف تساعد منصتنا الشركات على النمو الآن أكثر من أي وقت مضى."], ["تحديثات المنتجات", "كسب عملاء جدد لا يجب أن يكون صعباً. استمع إلى أحدث التحديثات لمساعدتك في بناء تجربة انضمام سلسة من البداية إلى النهاية."], ["الذكاء الاصطناعي", "كيف نعيد تشكيل أدوات التحليل المالي باستخدام أحدث تقنيات الذكاء الاصطناعي لتقديم رؤى أعمق وأسرع."], ["الثقة والأمان", "نظرة متعمقة على أحدث بروتوكولات الأمان وكيف نحافظ على بيانات المستخدمين آمنة في بيئة سريعة التغير."]];
const FAQ = [["ما هو حدث \"تواصل ٢٤\"؟", "تواصل ٢٤ هو مؤتمرنا السنوي الذي يجمع قادة صناعة التكنولوجيا المالية، المطورين، والمبتكرين لمناقشة مستقبل الخدمات المالية."], ["من يجب أن يحضر؟", "المطورون، مدراء المنتجات، رواد الأعمال وكل من يهتم ببناء مستقبل الخدمات المالية."], ["كيف يمكنني التسجيل؟", "اضغط على \"سجل الآن\" واحصل على تذكرة مجانية برمز QR يصلك فوراً ويمكنك استخدامها عند الدخول."], ["هل ستكون تسجيلات الجلسات متاحة لاحقاً؟", "سنعلن عن تسجيلات الجلسات بعد انتهاء الحدث لحاملي التذاكر."]];
const PLANS = [["الحضور المفتوح", "مجاناً", ["وصول للبث المباشر الأساسي", "مشاركة في الجلسات العامة", "نشرة بريدية يومية"], "free"], ["تذكرة كبار الشخصيات", "$١٥٠", ["كل ميزات الحضور المفتوح", "ورش عمل حصرية وتفاعلية", "غرف تواصل خاصة مع المتحدثين", "شهادة حضور معتمدة"], "lime"], ["باقة الشركات", "$٥٠٠", ["تذاكر كبار الشخصيات لـ ٥ أشخاص", "شعار شركتك في قائمة الرعاة", "وصول لتسجيلات الجلسات مدى الحياة", "اجتماعات مغلقة مع المستثمرين"], "dark"]];
const PARTNERS = ["نبض", "سحاب", "مدار", "رقيم", "بوصلة", "أفق", "نماء", "جسور", "شعاع"];
const TCOL = ["#ffd35c", "#d9ff00", "#ff9ee0", "#4ade80", "#7dd3fc"];
const CHECK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const code = () => "#EV-" + ar(Math.floor(100000 + Math.random() * 899999));
const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

export function landingView({ target, slug, user, toggleTheme }) {
  const reg = () => { location.hash = `#/e/${slug}`; };
  let tick; const chips = ["أيام", "ساعة", "دقيقة", "ثانية"].map((l, i) => h("span", { class: "chip c" + i }, h("b", {}, "٠٠"), " " + l));
  const cards = ["أيام", "ساعات", "دقائق", "ثواني"].map((l, i) => h("div", { class: "cdc c" + i }, h("b", {}, "٠٠"), h("span", {}, l)));
  const upd = () => { const s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const v = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60]; v.forEach((n, i) => { const t = n < 10 ? "٠" + ar(n) : ar(n); chips[i].firstChild.textContent = t; cards[i].firstChild.textContent = t; }); };
  upd(); tick = setInterval(() => { if (!document.body.contains(chips[0])) return clearInterval(tick); upd(); }, 1000);
  const dateTxt = new Date(target).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
  const dayTxt = new Date(target).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });

  const closeNav = () => nav.classList.remove("open");
  const nav = h("header", { class: "ln", onclick: (e) => { if (e.target.closest(".links a, .lrow .lbtn.dark")) closeNav(); } }, h("div", { class: "ln-in" },
    h("a", { class: "logo", href: "#/", "aria-label": "EVENT" }, "EVENT"),
    h("button", { class: "burger", "aria-label": "القائمة", "aria-expanded": "false", onclick: (e) => { const o = nav.classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", o); }, html: "<i></i><i></i><i></i>" }),
    h("div", { class: "chips", "aria-hidden": "true" }, chips),
    h("nav", { class: "links", "aria-label": "الأقسام" }, [["event", "الحدث"], ["projects", "المشاريع"], ["speakers", "المتحدثون"], ["schedule", "الجدول"], ["faq", "الأسئلة الشائعة"]].map(([id, t]) => h("a", { href: "javascript:void 0", onclick: (e) => { e.preventDefault(); go(id); } }, t)), h("a", { href: "#/events" }, "الفعاليات")),
    h("div", { class: "lrow" }, h("button", { class: "lbtn ghost", "aria-label": "تبديل الوضع", onclick: toggleTheme }, "◐"), h("button", { class: "lbtn dark", onclick: reg }, "سجل الآن"))));

  const hero = h("section", { class: "lhero", id: "event" },
    h("div", { class: "wave", "aria-hidden": "true", html: '<svg viewBox="0 0 800 320" preserveAspectRatio="none"><path class="w1" d="M40 240C120 280 250 250 330 150S560 20 640 60 740 120 760 140"/><path class="w2" d="M0 270c120-50 260-40 400-10s280 20 400-20v60H0z"/></svg>' }),
    h("i", { class: "dot d1" }), h("i", { class: "dot d2" }), h("i", { class: "dot d3" }), h("i", { class: "lstar", html: '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" fill="#d9ff00"/></svg>' }),
    h("div", { class: "tt" }, h("h1", {}, "تواصل"), h("span", { class: "n24" }, "٢٤"), h("span", { class: "stk" }, "تكنولوجيا مالية")),
    h("p", { class: "sub" }, `حدث افتراضي لرواد التقنية | ${dateTxt}`),
    h("button", { class: "lbtn dark big", onclick: reg }, "سجل الآن"),
    h("div", { class: "cdrow" }, cards));

  const pill = (t, i, av) => h("span", { class: "pl p" + (i % 3) }, av ? h("em", {}, t.slice(0, 2)) : null, t);
  const row1 = [...TOPICS.flatMap((t, i) => [pill(t, i), pill(NAMES[i], i + 1, true)])];
  const row2 = SQ.map((t, i) => h("span", { class: "sq" + (i % 2 ? "" : " on") }, t));
  const track = (els) => h("div", { class: "mt" }, [...els, ...els, ...els, ...els].map((e) => e.cloneNode(true)));
  const marquee = h("section", { class: "marq", "aria-hidden": "true" }, h("div", { class: "mq" }, track(row1)), h("div", { class: "mq rev" }, track(row2)));

  const stats = h("section", { class: "lsec stats" }, h("h2", { class: "big" }, ["انضم إلينا افتراضياً في ", h("mark", {}, dayTxt), " واحصل على وصول حصري لأحدث المنتجات والتحديثات المصممة لمساعدتك على ", h("mark", { class: "lime" }, "بناء مستقبل التكنولوجيا المالية.")]),
    h("div", { class: "sgrid" }, [["+٥٠", "متحدث خبير", "s0"], ["٣", "أيام من الإلهام", "s1"], ["+١٠k", "مشارك نشط", "s2"], ["٢٠", "ورشة عمل", "s3"]].map(([n, l, c]) => h("div", { class: "sc " + c }, h("b", {}, n), h("span", {}, l)))));

  let ci = 0; const tNum = h("div", { class: "tnum" }, code()); const tick1 = h("div", { class: "tk3d" }, h("div", { class: "tkh" }, h("span", { class: "hole" }), h("b", {}, "تواصل ٢٤")), tNum, h("span", { class: "tag" }, "تذكرة دخول حصري"), h("div", { class: "bars", html: Array.from({ length: 26 }, (_, i) => `<i style="height:${14 + ((i * 29) % 34)}px"></i>`).join("") }));
  const tkin = h("div", { class: "tkin" }, tick1);
  const refresh = h("button", { class: "rf", "aria-label": "تذكرة جديدة", onclick: () => { ci = (ci + 1) % TCOL.length; tick1.style.setProperty("--tc", TCOL[ci]); tNum.textContent = code(); tick1.classList.remove("pop"); void tick1.offsetWidth; tick1.classList.add("pop"); }, html: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/></svg>' });
  const maker = h("section", { class: "lsec" }, h("div", { class: "maker", onpointermove: (e) => { if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; const r = tkin.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; tkin.style.setProperty("--ry", (x * 28).toFixed(1) + "deg"); tkin.style.setProperty("--rx", (-y * 22).toFixed(1) + "deg"); }, onpointerleave: () => { tkin.style.setProperty("--ry", "0deg"); tkin.style.setProperty("--rx", "0deg"); } }, h("div", { class: "mtxt" }, h("h2", {}, "أنشئ هويتك الافتراضية"), h("p", {}, "قم بتخصيص تذكرتك الفريدة قبل التسجيل. هذا النمط واللون سيكون واجهتك الرقمية داخل الحدث."), h("div", { class: "lrow" }, h("button", { class: "lbtn lime big", onclick: reg }, "احجز هذه التذكرة"), refresh)), h("div", { class: "tkw" }, tkin)));

  const proj = h("section", { class: "lsec", id: "projects" }, h("article", { class: "lcard feat" }, h("div", { class: "ftxt" }, h("span", { class: "tg" }, "مشروع مميز"), h("h2", {}, "TaqwaShield AI"), h("div", { class: "sm" }, "CHROME EXTENSION"), h("p", {}, "TaqwaShield AI هو إضافة ذكية للمتصفح توفر تجربة تصفح آمنة وأخلاقية. يقوم تلقائياً باكتشاف المحتوى غير اللائق (NSFW) وطمسه فوراً لحماية المستخدمين أثناء التصفح."), h("div", { class: "tags" }, ["React", "TypeScript", "Tailwind CSS", "TensorFlow.js", "Chrome Extension APIs"].map((t) => h("span", { dir: "ltr" }, t))), h("button", { class: "lbtn dark", onclick: reg }, "اكتشف المزيد")), h("div", { class: "fimg" }, h("div", { class: "fin" }, h("span", { class: "shield", html: '<svg viewBox="0 0 24 24" width="38" height="38"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" fill="#1a1a1a"/></svg>' }), h("b", { dir: "ltr" }, "TaqwaShield AI")))));

  const spk = h("section", { class: "lsec", id: "speakers" }, h("div", { class: "lcard" }, h("h2", { class: "ttl" }, h("span", { class: "ring" }), "المتحدثون"), h("div", { class: "spg" }, SPEAKERS.map(([n, r, c, i], k) => h("div", { class: "spc" + (k === 0 ? " hi" : "") }, h("div", { class: "ph" }, i), h("b", {}, n), h("span", {}, r), h("small", {}, c))))));

  const ag = h("section", { class: "lsec", id: "schedule" }, h("div", { class: "agw" }, h("div", { class: "lcard agc" }, h("h2", { class: "ttl" }, "ماذا سيحدث؟"), AGENDA.map(([q, a], i) => { const it = h("div", { class: "ai" + (i === 0 ? " open" : "") }, h("button", { class: "aq", "aria-expanded": i === 0 ? "true" : "false", onclick: () => { const o = it.classList.toggle("open"); it.firstChild.setAttribute("aria-expanded", o); } }, h("span", {}, q), h("i", { html: CHEV })), h("div", { class: "aa" }, h("p", {}, a))); return it; })),
    h("div", { class: "squig", "aria-hidden": "true", html: '<svg viewBox="0 0 200 300"><path d="M190 10c-90 0-90 90-20 110s-10 120-120 150" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round"/></svg>' })));

  const plans = h("section", { class: "lsec center", id: "plans" }, h("h2", { class: "big2" }, "اختر التذكرة المناسبة"), h("p", { class: "lead" }, "خيارات متعددة تناسب الأفراد والشركات للوصول إلى أفضل محتوى في عالم التكنولوجيا المالية."),
    h("div", { class: "pg" }, PLANS.map(([n, p, f, k]) => h("div", { class: "pc " + k }, k === "lime" ? h("span", { class: "hot" }, "الأكثر طلباً") : null, h("h3", {}, n), h("div", { class: "pr" }, p), h("ul", {}, f.map((x) => h("li", {}, h("i", { html: CHECK }), x))), k === "free" ? h("button", { class: "lbtn dark wide", onclick: reg }, "حجز التذكرة") : h("button", { class: "lbtn wide " + (k === "dark" ? "white" : "dark"), disabled: true, title: "الخطط المدفوعة قيد التجهيز" }, "قريباً"))) ), h("p", { class: "note" }, "الخطط المدفوعة مسودة وغير متاحة بعد. التذكرة المجانية متاحة الآن."));

  const par = h("section", { class: "partners" }, h("h2", { class: "big2" }, "شركاء النجاح"), h("p", { class: "lead" }, "الشركات الرائدة التي تجعل هذا الحدث ممكناً"), h("div", { class: "ppl" }, PARTNERS.map((p) => h("span", {}, p))));

  const faq = h("section", { class: "lsec narrow", id: "faq" }, h("h2", { class: "ttl" }, "الأسئلة الشائعة"), FAQ.map(([q, a]) => { const it = h("div", { class: "fi" }, h("button", { class: "aq", "aria-expanded": "false", onclick: () => { const o = it.classList.toggle("open"); it.firstChild.setAttribute("aria-expanded", o); } }, h("span", {}, q), h("i", { html: CHEV })), h("div", { class: "aa" }, h("p", {}, a))); return it; }));

  const cta = h("section", { class: "lsec" }, h("div", { class: "cta" }, h("h2", {}, "احجز مقعدك"), h("p", {}, "لا تفوت فرصة التعرف على أحدث المنتجات، تحديثات الميزات، والرؤى التي تساعدك على تنمية أعمالك."), h("button", { class: "lbtn white big", onclick: reg }, "سجل حضورك الآن ←")));

  const quick = h("section", { class: "quick" }, h("div", { class: "qin" }, h("div", {}, h("a", { class: "logo", href: "#/" }, "EVENT"), h("p", {}, "الحدث التقني الأبرز في المنطقة. نجمع بين المبتكرين، المطورين، ورواد الأعمال لبناء مستقبل التكنولوجيا المالية والخدمات المصرفية المفتوحة.")),
    h("div", {}, h("h4", {}, "روابط سريعة"), [["event", "الحدث"], ["projects", "المشاريع"], ["speakers", "المتحدثون"], ["schedule", "الجدول الزمني"], ["faq", "الأسئلة الشائعة"]].map(([id, t]) => h("a", { href: "javascript:void 0", onclick: (e) => { e.preventDefault(); go(id); } }, t))),
    h("div", {}, h("h4", {}, "المنصة"), h("a", { href: "#/events" }, "كل الفعاليات"), h("a", { href: "#/new" }, "أنشئ فعالية"), h("a", { href: "#/lookup" }, "ابحث عن تذكرتك"), h("a", { href: "#/plans" }, "الخطط"), h("a", { href: user ? "#/account" : "#/login" }, user ? "حسابي" : "دخول / حساب جديد"), user && user.role === "admin" ? h("a", { href: "#/admin" }, "لوحة الإدارة") : null)));

  return h("div", { class: "land", dir: "rtl", lang: "ar" }, nav, h("main", {}, hero, marquee, stats, maker, proj, spk, ag, plans, par, faq, cta, quick));
}
