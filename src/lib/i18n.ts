export type Language = "mn" | "en";

export const translations = {
  mn: {
    // Navbar
    nav_login: "Нэвтрэх",
    nav_register: "Бүртгүүлэх",
    nav_features: "Онцлог",
    nav_pricing: "Үнэ",
    nav_howItWorks: "Хэрхэн ажилладаг",
    nav_contact: "Холбоо барих",

    // Hero
    hero_title: "Бизнесийн AI Чатбот",
    hero_subtitle:
      "Instagram болон Facebook Messenger-т ажилладаг ухаалаг AI чатботтой өөрийн бизнесийг автоматжуулаарай. Монгол бизнест зориулсан шийдэл.",
    hero_cta: "Одоо эхлэх",
    hero_demo: "Демо үзэх",

    // Features
    features_title: "Яагаад Nexon сонгох вэ?",
    features_subtitle:
      "Монгол дахь жижиг бизнесүүдэд зориулсан хамгийн дэвшилтэт AI чатбот шийдэл",
    feature1_title: "Instagram & Messenger дэмжлэг",
    feature1_desc:
      "Instagram Direct болон Facebook Messenger-т нэгэн зэрэг ажиллах боломжтой. Хэрэглэгчдийн асуултад 24/7 хариулна.",
    feature2_title: "Тохируулах боломжтой бот",
    feature2_desc:
      "Таны бизнест тохирсон хариулт, байдал, дуу хоолойтой AI ботыг бүрэн тохируулах боломжтой.",
    feature3_title: "Хяналтын самбар",
    feature3_desc:
      "Харилцааны статистик, мессежийн тоо, кредитийн зарцуулалтыг бодит цагт хянаарай.",

    // Pricing
    pricing_title: "Үнийн Мэдээлэл",
    pricing_subtitle:
      "Танд тохирсон төлөвлөгөөг сонгоорой. Сарын болон кредитийн сонголт байна.",
    pricing_monthly: "Сарын Төлөвлөгөө",
    pricing_credits: "Кредит Багц",
    pricing_popular: "Алдартай",
    pricing_messages: "мессеж",
    pricing_unlimited: "Хязгааргүй мессеж",
    pricing_custom_price: "Тохиролцооны үнэ",
    pricing_cta: "Одоо эхлэх",
    pricing_contact: "Холбоо барих",
    pricing_per_month: "/сар",
    pricing_credits_label: "кредит",
    pricing_never_expire: "Хэзээ ч дуусдаггүй",

    // How it works
    how_title: "Хэрхэн Ажилладаг вэ?",
    how_step1_title: "Бүртгүүлэх",
    how_step1_desc: "Nexon платформд бүртгүүлж, бизнесийн мэдээллээ оруулаарай.",
    how_step2_title: "Тохируулах",
    how_step2_desc:
      "Instagram болон Messenger акаунтаа холбож, AI ботын тохиргоог хийгээрэй.",
    how_step3_title: "Ажиллуулах",
    how_step3_desc:
      "Бот 24/7 хэрэглэгчдийн асуултад хариулж, таны бизнест туслана.",

    // Contact
    contact_title: "Холбоо Барих",
    contact_subtitle: "Асуух зүйл байвал бидэнтэй холбоо барь",
    contact_phone: "Утас",
    contact_email: "И-мэйл",
    contact_name: "Нэр",
    contact_message: "Мессеж",
    contact_send: "Илгээх",
    contact_sending: "Илгээж байна...",
    contact_success: "Мессеж амжилттай илгээгдлээ!",

    // Auth
    login_title: "Нэвтрэх",
    login_email: "И-мэйл",
    login_password: "Нууц үг",
    login_submit: "Нэвтрэх",
    login_google: "Google-ээр нэвтрэх",
    login_no_account: "Бүртгэл байхгүй юу?",
    login_register: "Бүртгүүлэх",
    register_title: "Бүртгүүлэх",
    register_name: "Нэр",
    register_email: "И-мэйл",
    register_password: "Нууц үг",
    register_confirm: "Нууц үг давтах",
    register_submit: "Бүртгүүлэх",
    register_google: "Google-ээр бүртгүүлэх",
    register_has_account: "Бүртгэл байна уу?",
    register_login: "Нэвтрэх",

    // Dashboard
    dashboard_title: "Хяналтын Самбар",
    dashboard_no_business:
      "Таны бизнесийг идэвхжүүлж байна, админтай холбоо барина уу",
    dashboard_plan: "Одоогийн Төлөвлөгөө",
    dashboard_credits: "Кредит",
    dashboard_credits_remaining: "Үлдсэн кредит",
    dashboard_credits_purchased: "Нийт худалдан авсан",
    dashboard_credits_used: "Энэ сард зарцуулсан",
    dashboard_buy_credits: "Кредит авах",
    dashboard_messages_used: "Ашигласан мессеж",
    dashboard_messages_limit: "Хязгаар",
    dashboard_days_until_reset: "Дахин эхлэх хүртэл",
    dashboard_days: "өдөр",
    dashboard_upgrade: "Шинэчлэх",
    dashboard_recent_activity: "Сүүлийн үйл ажиллагаа",
    dashboard_date: "Огноо",
    dashboard_conversations: "Харилцаа",
    dashboard_credits_used_col: "Кредит зарцуулсан",
    dashboard_platform: "Платформ",
    dashboard_logout: "Гарах",

    // Footer
    footer_rights: "Бүх эрх хуулиар хамгаалагдсан",
    footer_tagline: "Монгол бизнест зориулсан AI шийдэл",

    // Admin
    admin_title: "Админ Самбар",
    admin_total_clients: "Нийт клиент",
    admin_revenue: "Энэ сарын орлого",
    admin_messages: "Нийт мессеж",
    admin_credits_sold: "Нийт кредит зарагдсан",
    admin_clients: "Клиентүүд",
    admin_add_client: "Клиент нэмэх",
    admin_search: "Хайх...",
    admin_name: "Нэр",
    admin_plan: "Төлөвлөгөө",
    admin_status: "Статус",
    admin_last_active: "Сүүлийн идэвхтэй",
    admin_actions: "Үйлдэл",
    admin_view: "Харах",
    admin_active: "Идэвхтэй",
    admin_paused: "Түр зогссон",
    admin_cancelled: "Цуцлагдсан",

    // QPay
    qpay_title: "Кредит Худалдан Авах",
    qpay_select_pack: "Багц сонгох",
    qpay_scan: "QR код уншуулах",
    qpay_waiting: "Төлбөр хүлээж байна...",
    qpay_success: "Төлбөр амжилттай!",
    qpay_credits_added: "Таны дансанд кредит нэмэгдлээ",
    qpay_close: "Хаах",
    qpay_popular: "Алдартай",
  },

  en: {
    // Navbar
    nav_login: "Login",
    nav_register: "Register",
    nav_features: "Features",
    nav_pricing: "Pricing",
    nav_howItWorks: "How It Works",
    nav_contact: "Contact",

    // Hero
    hero_title: "Business AI Chatbot",
    hero_subtitle:
      "Automate your business with a smart AI chatbot that works on Instagram and Facebook Messenger. The solution designed for Mongolian businesses.",
    hero_cta: "Get Started",
    hero_demo: "View Demo",

    // Features
    features_title: "Why Choose Nexon?",
    features_subtitle:
      "The most advanced AI chatbot solution designed for small businesses in Mongolia",
    feature1_title: "Instagram & Messenger Support",
    feature1_desc:
      "Works simultaneously on Instagram Direct and Facebook Messenger. Answers customer questions 24/7.",
    feature2_title: "Customizable Bot",
    feature2_desc:
      "Fully customize the AI bot with responses, behavior, and tone tailored to your business.",
    feature3_title: "Control Dashboard",
    feature3_desc:
      "Monitor conversation statistics, message counts, and credit usage in real time.",

    // Pricing
    pricing_title: "Pricing",
    pricing_subtitle:
      "Choose the plan that suits you. Monthly and credit options available.",
    pricing_monthly: "Monthly Plans",
    pricing_credits: "Credit Packs",
    pricing_popular: "Popular",
    pricing_messages: "messages",
    pricing_unlimited: "Unlimited messages",
    pricing_custom_price: "Custom price",
    pricing_cta: "Get Started",
    pricing_contact: "Contact Us",
    pricing_per_month: "/mo",
    pricing_credits_label: "credits",
    pricing_never_expire: "Never expires",

    // How it works
    how_title: "How Does It Work?",
    how_step1_title: "Register",
    how_step1_desc:
      "Sign up on the Nexon platform and enter your business information.",
    how_step2_title: "Set Up",
    how_step2_desc:
      "Connect your Instagram and Messenger accounts and configure the AI bot settings.",
    how_step3_title: "Launch",
    how_step3_desc:
      "The bot answers customer questions 24/7 and helps your business grow.",

    // Contact
    contact_title: "Contact Us",
    contact_subtitle: "If you have any questions, get in touch with us",
    contact_phone: "Phone",
    contact_email: "Email",
    contact_name: "Name",
    contact_message: "Message",
    contact_send: "Send",
    contact_sending: "Sending...",
    contact_success: "Message sent successfully!",

    // Auth
    login_title: "Login",
    login_email: "Email",
    login_password: "Password",
    login_submit: "Login",
    login_google: "Continue with Google",
    login_no_account: "Don't have an account?",
    login_register: "Register",
    register_title: "Register",
    register_name: "Name",
    register_email: "Email",
    register_password: "Password",
    register_confirm: "Confirm Password",
    register_submit: "Register",
    register_google: "Register with Google",
    register_has_account: "Already have an account?",
    register_login: "Login",

    // Dashboard
    dashboard_title: "Dashboard",
    dashboard_no_business:
      "Your business is being activated, please contact the admin",
    dashboard_plan: "Current Plan",
    dashboard_credits: "Credits",
    dashboard_credits_remaining: "Credits Remaining",
    dashboard_credits_purchased: "Total Purchased",
    dashboard_credits_used: "Used This Month",
    dashboard_buy_credits: "Buy Credits",
    dashboard_messages_used: "Messages Used",
    dashboard_messages_limit: "Limit",
    dashboard_days_until_reset: "Days Until Reset",
    dashboard_days: "days",
    dashboard_upgrade: "Upgrade",
    dashboard_recent_activity: "Recent Activity",
    dashboard_date: "Date",
    dashboard_conversations: "Conversations",
    dashboard_credits_used_col: "Credits Used",
    dashboard_platform: "Platform",
    dashboard_logout: "Logout",

    // Footer
    footer_rights: "All rights reserved",
    footer_tagline: "AI solutions designed for Mongolian businesses",

    // Admin
    admin_title: "Admin Panel",
    admin_total_clients: "Total Clients",
    admin_revenue: "Monthly Revenue",
    admin_messages: "Total Messages",
    admin_credits_sold: "Total Credits Sold",
    admin_clients: "Clients",
    admin_add_client: "Add Client",
    admin_search: "Search...",
    admin_name: "Name",
    admin_plan: "Plan",
    admin_status: "Status",
    admin_last_active: "Last Active",
    admin_actions: "Actions",
    admin_view: "View",
    admin_active: "Active",
    admin_paused: "Paused",
    admin_cancelled: "Cancelled",

    // QPay
    qpay_title: "Buy Credits",
    qpay_select_pack: "Select Pack",
    qpay_scan: "Scan QR Code",
    qpay_waiting: "Waiting for payment...",
    qpay_success: "Payment Successful!",
    qpay_credits_added: "Credits have been added to your account",
    qpay_close: "Close",
    qpay_popular: "Popular",
  },
};

export type TranslationKey = keyof typeof translations.mn;
