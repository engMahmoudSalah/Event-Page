import React, { useState, useEffect } from 'react';
import TicketCheck from './TicketCheck';
import { registerTicket } from './registry';
import { ChevronDown, ChevronUp, ArrowLeft, Menu, X, Check, RefreshCw, Twitter, Linkedin, Instagram, Mail, Smartphone, Github, Globe, MapPin } from 'lucide-react';
import Confetti from './components/Confetti';

import Logo from '../src/images/logo.jpeg';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeAgenda, setActiveAgenda] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  // --- Registration States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPaymentStep, setIsPaymentStep] = useState(false); // خطوة الدفع الجديدة
  const [isSubmitting, setIsSubmitting] = useState(false); // حالة التحميل أثناء الإرسال
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });
  const [transferPhone, setTransferPhone] = useState(''); // رقم الهاتف المحول منه
  const [uniqueTicketId, setUniqueTicketId] = useState(''); // المعرف الفريد للتذكرة
  
  // استبدل هذا بالمعرف الخاص بك من Formspree
  const FORMSPREE_FORM_ID = 'mdawnakj'; 
  
  // تذكرة افتراضية للتسجيل العام
  const defaultTicket = { name: 'الحضور المفتوح', price: 'مجاناً', id: 'عام' };
  const [selectedTicketToBuy, setSelectedTicketToBuy] = useState(defaultTicket);

  // تحديث دالة فتح النموذج لتستقبل التذكرة المحددة
  const handleRegisterClick = (e, ticket = defaultTicket, customId = null) => {
    e.preventDefault();
    setSelectedTicketToBuy(ticket);
    
    let newId;
    if (customId) {
        newId = customId;
    } else {
        // توليد معرف فريد يعتمد على الوقت لضمان عدم التكرار
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10);
        newId = `MD-${timestamp}${random}`;
    }
    setUniqueTicketId(newId);
    
    // تحديث الكارد المتغير ليطابق المعرف الجديد إذا لم يكن هو المصدر
    if (!customId) {
        setTicketStyle(prev => ({ ...prev, id: newId }));
    }

    setIsModalOpen(true);
    setIsSubmitted(false);
    setIsPaymentStep(false);
    setIsSubmitting(false);
    setTransferPhone('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // دالة إرسال البيانات إلى Formspree
  const handleSubmitToFormspree = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        // also record the ticket in the registry (best effort, never blocks the user)
        registerTicket({ name: data.name, email: data.email, role: data.role, ticket_name: data.ticket_name, ticket_price: data.ticket_price, ticket_number: data.ticket_number });
        finalizeRegistration();
      } else {
        // في حالة الخطأ، يمكن إظهار رسالة أو التعامل معه
        // هنا سنكمل العملية لإظهار النجاح للمستخدم كأنموذج تجريبي
        // ولكن في الإنتاج يجب التعامل مع الأخطاء بشكل صحيح
        console.error("Formspree submission failed");
        alert("حدث خطأ أثناء إرسال البيانات. يرجى التأكد من إعداد Formspree ID بشكل صحيح.");
      }
    } catch (error) {
      console.error("Formspree Error:", error);
      alert("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // دالة إتمام التسجيل وإظهار النجاح
  const finalizeRegistration = () => {
    setIsPaymentStep(false);
    setIsSubmitted(true);
    // إخفاء النموذج تلقائياً بعد 6 ثواني
    setTimeout(() => {
      setIsModalOpen(false);
      setTimeout(() => {
          setFormData({ name: '', email: '', role: '' });
          setTransferPhone('');
      }, 500);
    }, 6000);
  };

  // الخطوة الأولى: تقديم النموذج الأساسي
  const handleInitialSubmit = (e) => {
    e.preventDefault();
    // التحقق مما إذا كانت التذكرة مدفوعة أم مجانية
    if (selectedTicketToBuy.price !== 'مجاناً') {
      setIsPaymentStep(true); // الانتقال للدفع
    } else {
      // تجهيز البيانات للإرسال
      const submissionData = {
        ...formData,
        ticket_name: selectedTicketToBuy.name,
        ticket_price: selectedTicketToBuy.price,
        ticket_id: selectedTicketToBuy.id,
        ticket_number: uniqueTicketId,
        registration_date: new Date().toISOString(),
        _subject: `تسجيل جديد: ${formData.name} - ${selectedTicketToBuy.name}`
      };
      handleSubmitToFormspree(submissionData); // إرسال البيانات
    }
  };

  // الخطوة الثانية: تأكيد دفع فودافون كاش
  const handlePaymentConfirm = (e) => {
    e.preventDefault();
    if(transferPhone.trim() !== '') {
        // تجهيز البيانات للإرسال مع معلومات الدفع
        const submissionData = {
          ...formData,
          ticket_name: selectedTicketToBuy.name,
          ticket_price: selectedTicketToBuy.price,
          ticket_id: selectedTicketToBuy.id,
          ticket_number: uniqueTicketId,
          payment_phone: transferPhone,
          payment_method: 'Vodafone Cash',
          registration_date: new Date().toISOString(),
          _subject: `تأكيد دفع: ${formData.name} - ${selectedTicketToBuy.name}`
        };
        handleSubmitToFormspree(submissionData); // إرسال البيانات
    }
  };

  // States for Timer and Regeneration
  const [timeLeft, setTimeLeft] = useState({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0, isOver: false });
  
  const ticketColors = ['#c8c0ff', '#d7ff00', '#ff90e8', '#ffffff', '#4ade80'];
  const ticketRotations = ['-rotate-3', 'rotate-2', '-rotate-6', 'rotate-6', 'rotate-0'];
  const [ticketStyle, setTicketStyle] = useState({ color: ticketColors[0], rotation: ticketRotations[0], id: `MD-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`, isRegenerating: false });

  const regenerateTicket = () => {
    setTicketStyle(prev => ({ ...prev, isRegenerating: true }));
    setTimeout(() => {
      const randomColor = ticketColors[Math.floor(Math.random() * ticketColors.length)];
      const randomRotation = ticketRotations[Math.floor(Math.random() * ticketRotations.length)];
      const randomId = `MD-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      setTicketStyle({ color: randomColor, rotation: randomRotation, id: randomId, isRegenerating: false });
    }, 300);
  };

  // Timer Logic
  useEffect(() => {
    const targetDate = new Date('2026-06-22T09:00:00').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      if (difference > 0) {
        const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));
        const months = Math.floor(totalDays / 30);
        const days = totalDays % 30;
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          months,
          days,
          hours,
          minutes,
          seconds,
          totalDays,
          isOver: false
        });
      } else {
        setTimeLeft(prev => ({ ...prev, isOver: true }));
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Injecting custom font and animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&display=swap');
      
      body {
        font-family: 'Readex Pro', sans-serif;
        background-color: #ffffff;
        color: #1a1a1a;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
      }

      /* إضافة التمرير السلس للصفحة */
      html {
        scroll-behavior: smooth;
        scroll-padding-top: 6rem;
      }

      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(50%); } 
      }
      
      @keyframes marquee-reverse {
        0% { transform: translateX(50%); }
        100% { transform: translateX(0); } 
      }

      .animate-marquee {
        animation: marquee 20s linear infinite;
        display: flex;
        width: max-content;
      }
      
      .animate-marquee-reverse {
        animation: marquee-reverse 25s linear infinite;
        display: flex;
        width: max-content;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
      @keyframes float-delayed {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(20px) rotate(-5deg); }
      }
      @keyframes spin-slow {
        100% { transform: rotate(360deg); }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; }
      .animate-spin-slow { animation: spin-slow 15s linear infinite; }
      
      .ticket-regenerate-anim {
        transform: scale(0.95);
        opacity: 0.8;
        filter: blur(2px);
      }

      .brutalist-border {
        border: 1.5px solid #1a1a1a;
      }
      
      .bg-texture {
        background-image: radial-gradient(#000000 1px, transparent 1px);
        background-size: 10px 10px;
        background-color: transparent;
        opacity: 0.05;
      }
      
      .bg-grid {
        background-size: 40px 40px;
        background-image: linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
      }

      @keyframes float-reverse {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(-5deg); }
      }
      .animate-float-reverse { animation: float-reverse 5s ease-in-out infinite; }


      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.8s ease-out forwards;
      }

      @keyframes confettiFall {
        0% { transform: translateY(-10vh) rotate(0deg) scale(1); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; }
      }
      .confetti-piece {
        position: absolute;
        top: -10vh;
        animation: confettiFall linear forwards;
      }

      .reveal-up {
        opacity: 0;
        transform: translateY(40px);
        transition: opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .reveal-scale {
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .is-revealed {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    };
    const observer = new IntersectionObserver(observerCallback, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    
    setTimeout(() => {
      document.querySelectorAll('.reveal-up, .reveal-scale').forEach(el => observer.observe(el));
    }, 100);
    
    return () => observer.disconnect();
  }, []);

  // Data Arrays
  const agendaItems = [
    { title: 'الكلمة الافتتاحية', description: 'دعم كل خدمة تكنولوجيا مالية، إطلاق الحرية المالية، والتمهيد لعصر التمويل المفتوح. اكتشف كيف تساعد منصتنا الشركات على النمو الآن أكثر من أي وقت مضى.' },
    { title: 'تحديثات المنتجات', description: 'كسب عملاء جدد لا يجب أن يكون صعباً. استمع إلى أحدث التحديثات لمساعدتك في بناء تجربة انضمام سلسة من البداية إلى النهاية.' },
    { title: 'الذكاء الاصطناعي', description: 'كيف نعيد تشكيل أدوات التحليل المالي باستخدام أحدث تقنيات الذكاء الاصطناعي لتقديم رؤى أعمق وأسرع.' },
    { title: 'الثقة والأمان', description: 'نظرة متعمقة على أحدث بروتوكولات الأمان وكيف نحافظ على بيانات المستخدمين آمنة في بيئة سريعة التغير.' }
  ];

  const faqs = [
    { q: 'ما هو حدث "تواصل ٢٤"؟', a: 'تواصل ٢٤ هو مؤتمرنا السنوي الذي يجمع قادة صناعة التكنولوجيا المالية، المطورين، والمبتكرين لمناقشة مستقبل الخدمات المالية.' },
    { q: 'من يجب أن يحضر؟', a: 'هذا الحدث مصمم لمؤسسي الشركات الناشئة، مديري المنتجات، المطورين، وأي شخص مهتم بمستقبل التكنولوجيا المالية.' },
    { q: 'كيف يمكنني التسجيل؟', a: 'يمكنك التسجيل بالضغط على زر "سجل الآن" في أعلى الصفحة وملء النموذج المطلوب.' },
    { q: 'هل ستكون تسجيلات الجلسات متاحة لاحقاً؟', a: 'نعم، سيتم توفير جميع التسجيلات للمشاركين المسجلين بعد انتهاء الحدث مباشرة.' }
  ];

  const speakers = [
    { name: 'طارق محمود', role: 'الرئيس التنفيذي', company: 'منصة بيلي', highlight: true },
    { name: 'سارة عبد الله', role: 'مدير التكنولوجيا', company: 'فينتك هب' },
    { name: 'ليلى كريم', role: 'رئيس المنتجات', company: 'محفظتي' },
    { name: 'أحمد حسن', role: 'رئيس قسم الهوية', company: 'ترست لابس' },
    { name: 'شيرين كمال', role: 'مدير الخصوصية', company: 'بنك المستقبل' },
    { name: 'عمر سعيد', role: 'رئيس المدفوعات', company: 'باي تاب' },
    { name: 'منى جمال', role: 'مدير منتج', company: 'كابيتال إكس' },
    { name: 'يوسف علي', role: 'نائب الرئيس', company: 'إيزي باي' },
  ];

  const marqueeItemsRow1 = ['كلمة رئيسية', 'منتجات جديدة', 'نقاشات مفتوحة', 'ميزات جديدة', 'ورش عمل'];
  const marqueeItemsRow2 = ['الذكاء الاصطناعي', 'الأمان والثقة', 'توسع عالمي', 'مستقبل الدفع', 'بناء القدرات'];

  const stats = [
    { number: '+٥٠', label: 'متحدث خبير', bg: 'bg-[#c8c0ff]', text: 'text-black' },
    { number: '٣', label: 'أيام من الإلهام', bg: 'bg-[#d7ff00]', text: 'text-black' },
    { number: '+١٠k', label: 'مشارك نشط', bg: 'bg-[#1a1a1a]', text: 'text-white' },
    { number: '٢٠', label: 'ورشة عمل', bg: 'bg-white', text: 'text-black' },
  ];

  const tickets = [
    { id: 'مجاني', name: 'الحضور المفتوح', price: 'مجاناً', features: ['وصول للبث المباشر الأساسي', 'مشاركة في الجلسات العامة', 'نشرة بريدية يومية'], bg: 'bg-white', text: 'text-black', buttonBg: 'bg-black text-white' },
    { id: 'vip', name: 'تذكرة كبار الشخصيات', price: '١٥٠$', features: ['كل ميزات الحضور المفتوح', 'ورش عمل حصرية وتفاعلية', 'غرف تواصل خاصة مع المتحدثين', 'شهادة حضور معتمدة'], bg: 'bg-[#d7ff00]', text: 'text-black', buttonBg: 'bg-black text-white', highlight: true },
    { id: 'شركات', name: 'باقة الشركات', price: '٥٠٠$', features: ['تذاكر كبار الشخصيات لـ ٥ أشخاص', 'شعار شركتك في قائمة الرعاة', 'وصول لتسجيلات الجلسات مدى الحياة', 'اجتماعات مغلقة مع المستثمرين'], bg: 'bg-[#1a1a1a]', text: 'text-white', buttonBg: 'bg-white text-black' }
  ];

  const sponsors = ['فيزا', 'ماستركارد', 'سترايب', 'باي بال', 'سكوير', 'أبل باي', 'مدى', 'تابي', 'تمارا'];

  return (
    <div dir="rtl" className="min-h-screen relative pb-20 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-texture mix-blend-multiply z-0"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#e9e4fc]/90 backdrop-blur-md border-b brutalist-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            
            <div className="flex items-center gap-4">
              <a href="https://mahmoud-salah-portfolio.netlify.app/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
                <div className="h-10 w-18 brutalist-border bg-black flex items-center justify-center overflow-hidden rounded-md">
                  <img src={Logo} alt="MD Logo" className="h-full w-full object-contain" />
                </div>
              </a>
              
              <div className="hidden lg:flex items-center gap-2 text-xs font-semibold" dir="ltr">
                <div className="flex items-center gap-1 brutalist-border rounded-full px-2 py-1 bg-[#c8c0ff]">
                  <span>{timeLeft.totalDays.toString().padStart(2, '0')}</span><span className="text-[10px] opacity-70">أيام</span>
                </div>
                <div className="flex items-center gap-1 brutalist-border rounded-full px-2 py-1 bg-white">
                  <span>{timeLeft.hours.toString().padStart(2, '0')}</span><span className="text-[10px] opacity-70">ساعة</span>
                </div>
                <div className="flex items-center gap-1 brutalist-border rounded-full px-2 py-1 bg-[#d7ff00]">
                  <span>{timeLeft.minutes.toString().padStart(2, '0')}</span><span className="text-[10px] opacity-70">دقيقة</span>
                </div>
                <div className="flex items-center gap-1 brutalist-border rounded-full px-2 py-1 bg-[#c8c0ff]">
                  <span>{timeLeft.seconds.toString().padStart(2, '0')}</span><span className="text-[10px] opacity-70">ثانية</span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-bold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <a href="#event" className="hover:opacity-70 transition-opacity">الحدث</a>
              <a href="#speakers" className="hover:opacity-70 transition-opacity">المتحدثون</a>
              <a href="#agenda" className="hover:opacity-70 transition-opacity">الجدول</a>
              <a href="#faq" className="hover:opacity-70 transition-opacity">الأسئلة الشائعة</a>
            </div>

            <div className="flex items-center">
              <button onClick={(e) => handleRegisterClick(e)} className="hidden md:block bg-black text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors brutalist-border">
                سجل الآن
              </button>
              <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <div className={`md:hidden bg-white brutalist-border border-t-0 p-4 absolute left-0 right-0 shadow-lg transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'top-16 opacity-100 scale-y-100' : 'top-14 opacity-0 scale-y-0 pointer-events-none'}`}>
          <div className="flex flex-col space-y-4">
            <a href="#event" onClick={() => setIsMenuOpen(false)} className="font-medium hover:pl-2 transition-all">الحدث</a>
            <a href="#speakers" onClick={() => setIsMenuOpen(false)} className="font-medium hover:pl-2 transition-all">المتحدثون</a>
            <a href="#agenda" onClick={() => setIsMenuOpen(false)} className="font-medium hover:pl-2 transition-all">الجدول</a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)} className="font-medium hover:pl-2 transition-all">الأسئلة الشائعة</a>
            <button onClick={(e) => { setIsMenuOpen(false); handleRegisterClick(e); }} className="bg-black text-white px-6 py-3 rounded-full text-sm font-medium w-full mt-4 hover:bg-[#d7ff00] hover:text-black transition-colors">
              سجل الآن
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 lg:pt-32 relative z-10">
        
        <section id="event" className="text-center px-4 max-w-5xl mx-auto mb-16 relative pt-12">
          
          <div className="absolute inset-0 bg-grid pointer-events-none -z-10 opacity-50"></div>

          <div className="absolute top-10 right-10 md:right-32 w-12 h-12 text-[#d7ff00] animate-spin-slow z-0">
             <div className="w-full h-full brutalist-border rounded-full bg-black p-2 flex items-center justify-center">
               <div className="w-3 h-3 bg-[#d7ff00] rounded-sm transform rotate-45"></div>
             </div>
          </div>
          
          <div className="absolute top-32 left-10 md:left-20 bg-[#ff90e8] brutalist-border px-4 py-2 rounded-full font-bold text-sm transform -rotate-12 animate-float z-0 hidden md:block shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            تكنولوجيا مالية
          </div>

          <div className="absolute bottom-20 left-20 w-16 h-16 bg-transparent border-[3px] border-[#1a1a1a] rounded-full animate-float-reverse flex items-center justify-center z-0 hidden md:flex opacity-60">
             <div className="w-2 h-2 bg-[#1a1a1a] rounded-full"></div>
          </div>

          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-8 h-8 text-[#c8c0ff] animate-pulse z-0 hidden md:block">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2L15 9H22L16 13L19 20L12 16L5 20L8 13L2 9H9L12 2Z" />
            </svg>
          </div>

          <div className="absolute bottom-10 right-20 w-16 h-16 bg-[#c8c0ff] brutalist-border rounded-full animate-float-delayed flex items-center justify-center z-0 hidden md:flex">
             <div className="w-8 h-8 bg-white brutalist-border rounded-full"></div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[200px] pointer-events-none -z-10 opacity-60">
            <svg viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#c8c0ff]">
              <path d="M-50,150 Q100,200 200,80 T400,100 T600,60 T850,120" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-24 pointer-events-none -z-10 opacity-30 hidden md:block">
             <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full text-[#d7ff00]">
               <path d="M0,20 L0,10 Q25,20 50,10 T100,10 L100,20 Z" fill="currentColor" />
             </svg>
          </div>

          <h1 className="text-7xl md:text-9xl font-bold tracking-tight mb-4 relative inline-block z-10 reveal-up">
            تواصل<span className="text-3xl md:text-5xl absolute top-0 -left-12 brutalist-border rounded-full w-12 h-12 flex items-center justify-center bg-white animate-float z-20 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] border-2 border-black">٢٤</span>
          </h1>
          <p className="text-lg md:text-xl font-medium mb-8 relative z-10 reveal-up" style={{ transitionDelay: '100ms' }}>
            حدث افتراضي لرواد التقنية | ٢٢ يونيو، ٢٠٢٦
          </p>
          <button onClick={(e) => handleRegisterClick(e)} className="bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-colors brutalist-border relative z-10 hover:scale-105 transform duration-300 reveal-up" style={{ transitionDelay: '200ms' }}>
            سجل الآن
          </button>
        </section>

        <section className="max-w-4xl mx-auto px-4 mb-24 relative z-20">
          {timeLeft.isOver ? (
            <div className="bg-[#d7ff00] brutalist-border rounded-2xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] reveal-scale">
              <h2 className="text-4xl md:text-5xl font-bold mb-2">لقد بدأ الحدث!</h2>
              <p className="text-lg font-medium opacity-80">انضم إلينا الآن لمتابعة البث المباشر.</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
              {[
                { value: timeLeft.totalDays, label: 'أيام', bg: 'bg-[#c8c0ff]' },
                { value: timeLeft.hours, label: 'ساعات', bg: 'bg-[#d7ff00]' },
                { value: timeLeft.minutes, label: 'دقائق', bg: 'bg-white' },
                { value: timeLeft.seconds, label: 'ثواني', bg: 'bg-[#4ade80]' }
              ].map((unit, i) => (
                <div 
                  key={i} 
                  className={`${unit.bg} brutalist-border rounded-2xl w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300 reveal-up`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black mb-1 tracking-tighter" dir="ltr">
                    {unit.value.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs md:text-sm font-bold uppercase opacity-80">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden border-y-[1.5px] border-[#1a1a1a] bg-white py-4 relative z-20">
          <div className="animate-marquee gap-4 pr-4">
            {[...marqueeItemsRow1, ...speakers.map(s => s.name), ...marqueeItemsRow1, ...speakers.map(s => s.name)].map((item, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full brutalist-border whitespace-nowrap shrink-0 ${i % 3 === 0 ? 'bg-[#c8c0ff]' : i % 5 === 0 ? 'bg-[#d7ff00]' : 'bg-white'}`}>
                {i % 2 === 0 ? <div className="w-6 h-6 rounded-full bg-gray-200 brutalist-border overflow-hidden"><img src={`https://ui-avatars.com/api/?name=${item}&background=random&color=fff`} alt="" className="w-full h-full object-cover"/></div> : null}
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="animate-marquee-reverse gap-4 pr-4 mt-4">
            {[...marqueeItemsRow2, ...marqueeItemsRow2, ...marqueeItemsRow2].map((item, i) => (
              <div key={`rev-${i}`} className={`flex items-center gap-2 px-4 py-2 rounded-none brutalist-border whitespace-nowrap shrink-0 ${i % 4 === 0 ? 'bg-black text-white' : 'bg-white'}`}>
                <span className="font-medium text-lg tracking-widest uppercase">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-20 text-center reveal-up relative">
          <div className="absolute top-10 left-10 w-8 h-8 text-[#d7ff00] animate-spin-slow hidden md:block">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10z"/></svg>
          </div>
          <div className="absolute bottom-10 right-10 w-6 h-6 text-[#ff90e8] animate-float hidden md:block">
            <div className="w-full h-full rounded-full border-2 border-current"></div>
          </div>

          <h2 className="text-3xl md:text-5xl leading-tight font-medium relative z-10">
            انضم إلينا افتراضياً في{' '}
            <span className="inline-block bg-[#c8c0ff] px-4 py-1 rounded-full brutalist-border translate-y-1 hover:rotate-3 transition-transform cursor-default shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">٢٢ يونيو</span>{' '}
            واحصل على وصول حصري لأحدث المنتجات والتحديثات المصممة لمساعدتك على{' '}
            <span className="inline-block bg-[#d7ff00] px-4 py-1 rounded-md brutalist-border translate-y-1 font-bold hover:-rotate-3 transition-transform cursor-default shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">بناء مستقبل التكنولوجيا المالية.</span>
          </h2>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 brutalist-border rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            {stats.map((stat, i) => (
              <div key={i} className={`${stat.bg} ${stat.text} p-8 text-center border-b md:border-b-0 md:border-l-[1.5px] border-[#1a1a1a] last:border-l-0 flex flex-col justify-center transition-all duration-300 hover:brightness-95 group reveal-up`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="text-5xl md:text-6xl font-bold mb-2 transition-transform duration-300 group-hover:scale-110" dir="ltr">{stat.number}</div>
                <div className="text-sm md:text-base font-medium opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-20 reveal-scale">
          <div className="bg-[#1a1a1a] text-white brutalist-border rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-[8px_8px_0px_0px_rgba(200,192,255,1)] hover:shadow-[12px_12px_0px_0px_rgba(200,192,255,1)] transition-shadow duration-500">
            <div className="absolute inset-0 bg-texture opacity-20 pointer-events-none mix-blend-overlay"></div>
            
            <div className="md:w-1/2 relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">أنشئ هويتك الافتراضية</h2>
              <p className="text-gray-300 mb-8 font-medium text-lg">قم بتخصيص تذكرتك الفريدة قبل التسجيل. هذا النمط واللون سيكون واجهتك الرقمية داخل الحدث.</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={(e) => handleRegisterClick(e, defaultTicket, ticketStyle.id)} // تمرير التذكرة الافتراضية ومعرف الكارد
                  className="flex-1 bg-[#d7ff00] text-black px-8 py-4 rounded-full font-bold brutalist-border hover:bg-white hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all text-lg text-center"
                >
                  احجز هذه التذكرة
                </button>
                <button 
                  onClick={regenerateTicket}
                  className="flex items-center justify-center gap-3 bg-white text-black px-6 py-4 rounded-full font-bold brutalist-border hover:bg-gray-200 transition-colors group text-lg w-full sm:w-auto"
                >
                  <RefreshCw size={24} className={`transition-transform duration-500 ${ticketStyle.isRegenerating ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                </button>
              </div>
            </div>

            <div className="md:w-1/2 flex justify-center relative z-10 w-full">
              <div 
                className={`w-full max-w-[320px] aspect-[1/1.5] brutalist-border rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-300 text-black shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] ${ticketStyle.rotation} ${ticketStyle.isRegenerating ? 'ticket-regenerate-anim' : 'hover:scale-105'}`}
                style={{ backgroundColor: ticketStyle.color }}
              >
                <div className="flex justify-between items-start border-b-[2px] border-black pb-4">
                  <div className="font-bold text-2xl tracking-tighter">تواصل ٢٤</div>
                  <div className="w-12 h-12 brutalist-border rounded-full bg-white flex items-center justify-center">
                    <div className="w-5 h-5 bg-black rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="py-8 flex-1 flex flex-col justify-center items-center text-center">
                  <div className="text-5xl font-black mb-4 tracking-tighter" dir="ltr">#{ticketStyle.id}</div>
                  <div className="font-bold bg-white px-4 py-2 rounded-full brutalist-border text-sm">تذكرة دخول حصري</div>
                </div>

                <div className="border-t-[2px] border-black pt-4 flex gap-1 justify-between h-16 items-end overflow-hidden">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="bg-black rounded-t-sm" style={{ width: `${Math.random() * 6 + 2}px`, height: `${Math.random() * 80 + 20}%` }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="speakers" className="max-w-6xl mx-auto px-4 py-12 reveal-up">
          <div className="brutalist-border rounded-3xl overflow-hidden bg-white/50 relative shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
             <div className="absolute inset-0 bg-texture opacity-20 pointer-events-none"></div>
             
             <div className="p-6 md:p-8 relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-full bg-[#c8c0ff] brutalist-border flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">المتحدثون</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 brutalist-border bg-[#1a1a1a] p-[1.5px]">
                  {speakers.map((speaker, index) => (
                    <div key={index} className={`bg-white h-full flex flex-col p-[1.5px] ${speaker.highlight ? 'bg-[#d7ff00]' : 'bg-white'} reveal-scale`} style={{ transitionDelay: `${index * 50}ms` }}>
                      <div className={`flex-1 p-4 ${speaker.highlight ? 'bg-[#d7ff00]' : 'bg-white'} brutalist-border flex flex-col justify-between group`}>
                        <div className="mb-4 aspect-square w-full rounded-md brutalist-border overflow-hidden bg-gray-100 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500">
                          <img src={`https://ui-avatars.com/api/?name=${speaker.name}&background=e9e4fc&color=1a1a1a&size=200&font-size=0.33`} alt={speaker.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{speaker.name}</h3>
                          <p className="text-sm opacity-80 mt-1">{speaker.role}</p>
                          <p className="text-xs font-medium opacity-60 mt-1">{speaker.company}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </section>

        <section id="agenda" className="max-w-6xl mx-auto px-4 py-20 flex flex-col md:flex-row gap-12 relative">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#ff90e8] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
          
          <div className="md:w-1/3 relative reveal-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">ماذا سيحدث؟</h2>
            <div className="hidden md:block absolute -right-32 top-1/2 -translate-y-1/2 w-64 h-64 text-[#1a1a1a] z-0 animate-float-delayed">
               <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform scale-x-[-1]">
                <path d="M0,100 C50,100 50,50 100,50 C150,50 150,150 200,150 C250,150 250,100 300,100" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
                <path d="M100,50 C100,-20 -20,-20 -20,50 C-20,120 100,120 100,50 Z" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </div>
          </div>

          <div className="md:w-2/3 brutalist-border rounded-xl bg-white overflow-hidden relative z-10 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] reveal-up">
            {agendaItems.map((item, index) => (
              <div 
                key={index} 
                className={`border-b-[1.5px] border-[#1a1a1a] last:border-b-0 transition-colors duration-300 cursor-pointer ${activeAgenda === index ? 'bg-[#c8c0ff]' : 'hover:bg-gray-50'}`}
                onClick={() => setActiveAgenda(activeAgenda === index ? null : index)}
              >
                <div className="p-6 flex justify-between items-center">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <div className="w-8 h-8 rounded-full border border-black flex items-center justify-center bg-white shrink-0">
                     {activeAgenda === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                
                <div className={`px-6 pb-6 text-sm leading-relaxed overflow-hidden transition-all duration-300 ${activeAgenda === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 p-0 m-0'}`}>
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing / Tickets Section */}
        <section className="max-w-7xl mx-auto px-4 py-24 relative">
          <div className="text-center mb-16 relative z-10 reveal-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">اختر التذكرة المناسبة</h2>
            <p className="text-lg font-medium opacity-80 max-w-2xl mx-auto">خيارات متعددة تناسب الأفراد والشركات للوصول إلى أفضل محتوى في عالم التكنولوجيا المالية.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-6 relative z-10 px-4 md:px-0">
            {tickets.map((ticket, i) => (
              <div key={i} className={`${ticket.bg} ${ticket.text} brutalist-border rounded-2xl p-8 flex flex-col relative transition-all duration-300 hover:-translate-y-2 ${ticket.highlight ? 'lg:-translate-y-4 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] z-20 hover:shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]' : 'shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] z-10 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]'} reveal-up`} style={{ transitionDelay: `${i * 150}ms` }}>
                {ticket.highlight && (
                  <span className="absolute -top-5 right-8 bg-[#c8c0ff] text-black px-4 py-1 rounded-full text-sm font-bold brutalist-border animate-pulse rotate-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-30">الأكثر طلباً</span>
                )}
                <h3 className="text-2xl font-bold mb-2">{ticket.name}</h3>
                <div className="text-5xl font-bold mb-6 pb-6 border-b-[1.5px] border-current opacity-90">{ticket.price}</div>
                <ul className="flex-1 space-y-4 mb-8">
                  {ticket.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm md:text-base font-medium">
                      <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full brutalist-border bg-[#c8c0ff] flex items-center justify-center text-black">
                        <Check size={12} strokeWidth={4} />
                      </div>
                      <span className="opacity-90">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={(e) => handleRegisterClick(e, ticket)} // تمرير التذكرة المحددة هنا
                  className={`w-full py-4 rounded-full font-bold brutalist-border ${ticket.buttonBg} hover:scale-[1.02] transition-transform`}
                >
                  حجز التذكرة
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="py-24 border-y-[1.5px] border-[#1a1a1a] bg-[#c8c0ff] overflow-hidden relative reveal-up">
          <div className="absolute inset-0 bg-texture opacity-30 pointer-events-none mix-blend-multiply"></div>
          
          <div className="max-w-6xl mx-auto px-4 text-center mb-12 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">شركاء النجاح</h2>
            <p className="font-medium opacity-80">الشركات الرائدة التي تجعل هذا الحدث ممكناً</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto px-4 relative z-10">
            {sponsors.map((sponsor, i) => (
              <div key={i} className="bg-white brutalist-border px-8 py-4 rounded-full shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] font-bold text-xl md:text-2xl hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] hover:bg-[#d7ff00] transition-all cursor-pointer select-none reveal-scale" style={{ transitionDelay: `${i * 50}ms` }}>
                {sponsor}
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="max-w-3xl mx-auto px-4 py-20 reveal-up">
          <h2 className="text-4xl font-bold mb-10">الأسئلة الشائعة</h2>
          <div className="space-y-0 border-t-[1.5px] border-[#1a1a1a]">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b-[1.5px] border-[#1a1a1a]">
                <button 
                  className="w-full text-right py-6 flex justify-between items-center focus:outline-none"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <span className="font-medium text-lg">{faq.q}</span>
                  <ChevronDown 
                    size={20} 
                    className={`transform transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 text-gray-700 leading-relaxed ${activeFaq === index ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <section className="max-w-4xl mx-auto px-4 pb-20 relative z-10 reveal-scale">
        <div className="bg-[#1a1a1a] text-white rounded-3xl p-12 text-center brutalist-border relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(200,192,255,1)] hover:shadow-[12px_12px_0px_0px_rgba(200,192,255,1)] transition-shadow duration-500">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#c8c0ff] rounded-full mix-blend-overlay opacity-20 -translate-x-1/2 -translate-y-1/2 animate-spin-slow"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#d7ff00] rounded-full mix-blend-overlay opacity-10 translate-x-1/3 translate-y-1/3 animate-float"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 relative z-10">احجز مقعدك</h2>
          <p className="text-gray-300 mb-8 max-w-md mx-auto relative z-10">
            لا تفوت فرصة التعرف على أحدث المنتجات، تحديثات الميزات، والرؤى التي تساعدك على تنمية أعمالك.
          </p>
          <button onClick={(e) => handleRegisterClick(e)} className="bg-white text-black px-8 py-4 rounded-full text-lg font-bold hover:bg-[#d7ff00] transition-colors brutalist-border relative z-10 inline-flex items-center gap-2 group">
            <span>سجل حضورك الآن</span>
            <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <TicketCheck />

      <footer className="border-t-[1.5px] border-[#1a1a1a] bg-white pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
            
            <div className="md:col-span-2">
              <a href="https://mahmoud-salah-portfolio.netlify.app/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity mb-6 inline-block">
                <div className="h-10 w-18 brutalist-border bg-black flex items-center justify-center overflow-hidden rounded-md">
                  <img src={Logo} alt="MD Logo" className="h-full w-full object-contain" />
                </div>
              </a>
              <p className="font-medium text-gray-600 max-w-sm leading-relaxed">
                الحدث التقني الأبرز في المنطقة. نجمع بين المبتكرين، المطورين، ورواد الأعمال لبناء مستقبل التكنولوجيا المالية والخدمات المصرفية المفتوحة.
              </p>
              
              <div className="flex gap-3 mt-6">
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xl mb-6">روابط سريعة</h4>
              <ul className="space-y-3 font-medium text-gray-600">
                <li><a href="#" className="hover:text-black hover:translate-x-[-4px] inline-block transition-transform">الحدث</a></li>
                <li><a href="#" className="hover:text-black hover:translate-x-[-4px] inline-block transition-transform">المتحدثون</a></li>
                <li><a href="#" className="hover:text-black hover:translate-x-[-4px] inline-block transition-transform">الجدول الزمني</a></li>
                <li><a href="#" className="hover:text-black hover:translate-x-[-4px] inline-block transition-transform">الأسئلة الشائعة</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xl mb-6">تواصل معنا</h4>
              <ul className="space-y-4 font-medium text-gray-600">
                <li>
                  <div className="flex items-center gap-3 hover:text-black transition-colors">
                    <MapPin size={18} />
                    <span>القاهرة ، جمهورية مصر العربية</span>
                  </div>
                </li>
                <li>
                  <a href="mailto:mahmodsalah.2026@gmail.com" className="flex items-center gap-3 hover:text-black transition-colors" dir="ltr">
                    <Mail size={18} />
                    <span>mahmodsalah.2026@gmail.com</span>
                  </a>
                </li>
                <li className="flex gap-3 mt-6 pt-2">
                  <a href="#" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full brutalist-border bg-white flex items-center justify-center hover:bg-[#d7ff00] hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all text-black" title="Github">
                    <Github size={20} />
                  </a>
                  <a href="https://www.linkedin.com/in/mahmoud-salah-351309208?" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full brutalist-border bg-white flex items-center justify-center hover:bg-[#ff90e8] hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all text-black" title="LinkedIn">
                    <Linkedin size={20} />
                  </a>
                  <a href="https://mahmoud-salah-portfolio.netlify.app/#projects" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full brutalist-border bg-white flex items-center justify-center hover:bg-[#c8c0ff] hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all text-black" title="Portfolio">
                    <Globe size={20} />
                  </a>
                </li>
              </ul>
            </div>
            
          </div>
          
          <div className="border-t-[1.5px] border-[#1a1a1a] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 font-medium text-sm text-gray-500">
            <p>© محمود صلاح محمد عبدالعال</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-black transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-black transition-colors">الشروط والأحكام</a>
            </div>
          </div>
        </div>
      </footer>

      {/* --- Registration Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white brutalist-border rounded-3xl w-full max-w-md relative shadow-[8px_8px_0px_0px_rgba(215,255,0,1)] max-h-[90vh] overflow-y-auto overflow-x-hidden">
            
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 left-6 p-2 hover:bg-[#e9e4fc] rounded-full transition-colors brutalist-border bg-white z-10"
            >
              <X size={20} />
            </button>
            
            <div className="p-8 md:p-10">
              {isSubmitted ? (
                /* 1. Success Message & Ticket */
                <div className="text-center py-4 animate-fade-in-up">
                  <Confetti />
                  <h3 className="text-3xl font-bold mb-6">اكتمل حجزك!</h3>
                  
                  <div className="flex justify-center mb-6">
                    <div 
                      className={`w-full max-w-[240px] aspect-[1/1.5] brutalist-border rounded-xl p-5 flex flex-col justify-between relative shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] text-black`}
                      style={{ backgroundColor: selectedTicketToBuy.price !== 'مجاناً' ? selectedTicketToBuy.bg.replace('bg-[', '').replace(']', '') : ticketStyle.color }}
                    >
                      <div className="flex justify-between items-start border-b-[2px] border-black pb-3">
                        <div className="font-bold text-lg tracking-tighter">تواصل ٢٤</div>
                        <div className="w-8 h-8 brutalist-border rounded-full bg-white flex items-center justify-center">
                          <Check size={16} strokeWidth={4} className="text-black" />
                        </div>
                      </div>
                      
                      <div className="py-4 flex-1 flex flex-col justify-center items-center text-center">
                        <div className="text-4xl font-black mb-2 tracking-tighter" dir="ltr">#{uniqueTicketId}</div>
                        <div className="font-bold bg-white/50 px-3 py-1 rounded-full brutalist-border text-sm mb-2 w-full truncate text-black">
                          {formData.name || 'ضيف مميز'}
                        </div>
                        <div className="text-xs font-bold uppercase opacity-70 text-black">
                          {selectedTicketToBuy.name}
                        </div>
                      </div>

                      <div className="border-t-[2px] border-black pt-3 flex gap-1 justify-between h-10 items-end overflow-hidden">
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className="bg-black rounded-t-sm" style={{ width: `${Math.random() * 4 + 2}px`, height: `${Math.random() * 80 + 20}%` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 font-medium text-base">تم إرسال نسخة من التذكرة إلى بريدك الإلكتروني. نراك قريباً!</p>
                </div>

              ) : isPaymentStep ? (
                /* 2. Vodafone Cash Payment Step */
                <div className="animate-fade-in-up">
                  <div className="mb-6 text-center">
                    <div className="w-16 h-16 bg-[#e60000] brutalist-border rounded-full flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] text-white">
                      <Smartphone size={32} />
                    </div>
                    <h3 className="text-3xl font-bold mb-2">الدفع لتأكيد الحجز</h3>
                    <p className="text-gray-600 font-medium text-sm">لقد اخترت <span className="font-bold text-black">{selectedTicketToBuy.name}</span></p>
                  </div>
                  
                  <div className="bg-gray-50 brutalist-border rounded-xl p-5 mb-6 text-center">
                    <p className="text-sm font-bold mb-2">يرجى تحويل مبلغ <span className="text-lg text-[#e60000] mx-1">{selectedTicketToBuy.price}</span> عبر فودافون كاش إلى الرقم التالي:</p>
                    <div className="text-3xl font-black tracking-widest bg-white p-3 rounded-lg brutalist-border inline-block mt-2 mb-2" dir="ltr">
                      01022420372
                    </div>
                  </div>

                  <form onSubmit={handlePaymentConfirm} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1.5">رقم الهاتف المحول منه</label>
                      <input 
                        required 
                        type="tel"
                        value={transferPhone}
                        onChange={(e) => setTransferPhone(e.target.value)}
                        className="w-full p-3.5 bg-white brutalist-border rounded-xl focus:outline-none focus:bg-[#e9e4fc] transition-colors font-bold text-center text-lg tracking-wider" 
                        placeholder="01X XXXX XXXX" 
                        dir="ltr"
                      />
                      <p className="text-xs text-gray-500 font-medium mt-2 text-center">سيتم التحقق من التحويل وإصدار التذكرة فوراً</p>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`w-full bg-[#e60000] text-white font-bold text-lg py-4 rounded-xl brutalist-border hover:bg-black hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 transition-all mt-4 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <span>جاري التأكيد...</span>
                      ) : (
                        <>
                          <span>تأكيد التحويل</span>
                          <Check size={20} />
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsPaymentStep(false)}
                      className="w-full text-center text-sm font-bold text-gray-500 hover:text-black transition-colors mt-2"
                    >
                      العودة للبيانات
                    </button>
                  </form>
                </div>

              ) : (
                /* 3. Initial Registration Form */
                <div className="animate-fade-in-up">
                  <div className="mb-8 text-center">
                    <h3 className="text-3xl font-bold mb-2">سجل حضورك</h3>
                    <p className="text-gray-600 font-medium text-sm mb-4">احجز مقعدك الآن وانضم لأكبر حدث تكنولوجي.</p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <div className="inline-flex items-center gap-2 bg-gray-100 brutalist-border px-3 py-1.5 rounded-full text-xs font-bold">
                         <span className="opacity-70">نوع التذكرة:</span> 
                         <span className={selectedTicketToBuy.price !== 'مجاناً' ? 'text-[#e60000]' : ''}>{selectedTicketToBuy.name} ({selectedTicketToBuy.price})</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-gray-100 brutalist-border px-3 py-1.5 rounded-full text-xs font-bold">
                         <div className="w-3 h-3 rounded-full brutalist-border" style={{ backgroundColor: selectedTicketToBuy.price !== 'مجاناً' ? selectedTicketToBuy.bg.replace('bg-[', '').replace(']', '') : ticketStyle.color }}></div>
                         <span>رقم التذكرة: <span dir="ltr">#{uniqueTicketId}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={handleInitialSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1.5">الاسم الكامل</label>
                      <input 
                        required 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        type="text" 
                        className="w-full p-3.5 bg-gray-50 brutalist-border rounded-xl focus:outline-none focus:bg-[#e9e4fc] transition-colors font-medium text-sm" 
                        placeholder="مثال: أحمد محمد" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5">البريد الإلكتروني</label>
                      <input 
                        required 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        type="email" 
                        className="w-full p-3.5 bg-gray-50 brutalist-border rounded-xl focus:outline-none focus:bg-[#e9e4fc] transition-colors font-medium text-sm" 
                        placeholder="ahmed@example.com" 
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5">المسمى الوظيفي (اختياري)</label>
                      <input 
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        type="text" 
                        className="w-full p-3.5 bg-gray-50 brutalist-border rounded-xl focus:outline-none focus:bg-[#e9e4fc] transition-colors font-medium text-sm" 
                        placeholder="مثال: مطور برمجيات" 
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`w-full bg-black text-white font-bold text-lg py-4 rounded-xl brutalist-border hover:bg-[#d7ff00] hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 transition-all mt-4 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? 'جاري التسجيل...' : (selectedTicketToBuy.price === 'مجاناً' ? 'تأكيد التسجيل' : 'متابعة الدفع')}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
