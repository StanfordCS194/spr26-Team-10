"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/navigation/app-nav";
import LanguageDropdown, {
  languages,
  type LanguageOption,
} from "@/app/chat/LanguageDropdown";
import {
  getStoredLanguageCode,
  setPreferredLanguage,
} from "@/lib/language-preference";
import {
  IconArrowRight,
  IconPlayerPlay,
  IconLock,
  IconEyeOff,
  IconFileCertificate,
  IconAccessible,
  IconUpload,
  IconScan,
  IconMessageCircle,
  IconShieldHeart,
  IconWorld,
} from "@tabler/icons-react";
import styles from "./landing-page.module.css";

const TRUST = [
  { icon: IconLock },
  { icon: IconEyeOff },
  { icon: IconFileCertificate },
  { icon: IconAccessible },
];

const STEPS = [
  { icon: IconUpload },
  { icon: IconScan },
  { icon: IconMessageCircle },
];

const VALUES = [
  { icon: IconShieldHeart },
  { icon: IconAccessible },
  { icon: IconWorld },
];

const LANDING_COPY = {
  en: {
    heroTag: "Free to use. Sign up in seconds",
    heroTitleLine1: "Government forms",
    heroTitleLine2: "shouldn't be",
    heroTitleAccent: "this hard.",
    heroBody:
      "reads your government forms for you and answers your questions in plain language, in your language. No jargon. No confusion. No stress.",
    getStarted: "Get started free",
    seeHowItWorks: "See how it works",

    stats: [
      { num: "50+", label: "Forms understood by real people", blue: false },
      { num: "5", label: "Languages supported", blue: true },
      { num: "4.9/5", label: "Average user satisfaction", blue: false },
      {
        num: "Zero",
        label: "Documents stored after your session ends",
        blue: false,
      },
    ],

    trust: [
      "End to end encrypted",
      "No data stored",
      "All major government forms",
      "Built for everyone",
    ],

    howItWorksEyebrow: "How it works",
    howItWorksTitleLine1: "Three steps.",
    howItWorksTitleLine2: "Zero confusion.",

    steps: [
      {
        num: "Step 01",
        title: "Upload your form",
        desc: "Take a photo or upload a PDF. We accept any government document: tax forms, visa applications, benefits paperwork, and more.",
      },
      {
        num: "Step 02",
        title: "We read it for you",
        desc: "Our AI reads every field and extracts the key information. You confirm what we found. You are always in control.",
      },
      {
        num: "Step 03",
        title: "Ask anything",
        desc: "Ask questions in plain language. We explain every field, deadline, and requirement clearly, and in your language.",
      },
    ],

    valuesEyebrow: "Our values",
    valuesTitleLine1: "Built with care,",
    valuesTitleLine2: "for real people.",

    values: [
      {
        title: "Privacy first",
        desc: "We never store your documents. Everything is processed in your session and deleted when you're done. Your data is yours.",
      },
      {
        title: "Designed for everyone",
        desc: "Built for elderly users, first-generation immigrants, and anyone who finds government paperwork overwhelming. Clarity is the goal.",
      },
      {
        title: "Your language, always",
        desc: "We answer in your language, not the form's language. Five languages supported today, with more planned.",
      },
    ],

    languagesEyebrow: "Languages",
    languagesTitleLine1: "We speak",
    languagesTitleLine2: "your language.",
    languagesSubtitleBeforeBrand:
      "Ask your questions in the language you're most comfortable with.",
    languagesSubtitleAfterBrand:
      "responds in your language. No translation needed.",

    ctaTitleLine1: "Ready to understand",
    ctaTitleLine2: "your form?",
    ctaTitleAccent: "Let's go.",
    ctaSub: "Free. Private. Takes 30 seconds to sign up. Just upload and ask.",
    uploadForm: "Upload your form",

    footerCopy: "© 2026 formly.ai · Privacy · Terms",
  },

  es: {
    heroTag: "Gratis. Regístrate en segundos",
    heroTitleLine1: "Los formularios del gobierno",
    heroTitleLine2: "no deberían ser",
    heroTitleAccent: "tan difíciles.",
    heroBody:
      "lee tus formularios del gobierno y responde tus preguntas en lenguaje claro, en tu idioma. Sin jerga. Sin confusión. Sin estrés.",
    getStarted: "Comenzar gratis",
    seeHowItWorks: "Ver cómo funciona",

    stats: [
      {
        num: "50+",
        label: "Formularios entendidos por personas reales",
        blue: false,
      },
      { num: "5", label: "Idiomas disponibles", blue: true },
      {
        num: "4.9/5",
        label: "Satisfacción promedio de usuarios",
        blue: false,
      },
      {
        num: "Cero",
        label: "Documentos guardados después de terminar tu sesión",
        blue: false,
      },
    ],

    trust: [
      "Cifrado de extremo a extremo",
      "No guardamos datos",
      "Principales formularios del gobierno",
      "Creado para todos",
    ],

    howItWorksEyebrow: "Cómo funciona",
    howItWorksTitleLine1: "Tres pasos.",
    howItWorksTitleLine2: "Cero confusión.",

    steps: [
      {
        num: "Paso 01",
        title: "Sube tu formulario",
        desc: "Toma una foto o sube un PDF. Aceptamos documentos del gobierno: impuestos, visas, beneficios y más.",
      },
      {
        num: "Paso 02",
        title: "Lo leemos por ti",
        desc: "Nuestra IA lee cada campo y extrae la información clave. Tú confirmas lo que encontramos. Siempre tienes el control.",
      },
      {
        num: "Paso 03",
        title: "Pregunta lo que quieras",
        desc: "Haz preguntas en lenguaje sencillo. Explicamos cada campo, fecha límite y requisito claramente, en tu idioma.",
      },
    ],

    valuesEyebrow: "Nuestros valores",
    valuesTitleLine1: "Creado con cuidado,",
    valuesTitleLine2: "para personas reales.",

    values: [
      {
        title: "Privacidad primero",
        desc: "Nunca guardamos tus documentos. Todo se procesa durante tu sesión y se elimina cuando terminas. Tus datos son tuyos.",
      },
      {
        title: "Diseñado para todos",
        desc: "Creado para personas mayores, inmigrantes de primera generación y cualquiera que encuentre difícil el papeleo del gobierno.",
      },
      {
        title: "Tu idioma, siempre",
        desc: "Respondemos en tu idioma, no en el idioma del formulario. Hoy hay cinco idiomas disponibles, con más en camino.",
      },
    ],

    languagesEyebrow: "Idiomas",
    languagesTitleLine1: "Hablamos",
    languagesTitleLine2: "tu idioma.",
    languagesSubtitleBeforeBrand:
      "Haz preguntas en el idioma con el que te sientas más cómodo.",
    languagesSubtitleAfterBrand:
      "responde en tu idioma. No necesitas traducir.",

    ctaTitleLine1: "¿Listo para entender",
    ctaTitleLine2: "tu formulario?",
    ctaTitleAccent: "Vamos.",
    ctaSub:
      "Gratis. Privado. Registrarte toma 30 segundos. Solo sube y pregunta.",
    uploadForm: "Sube tu formulario",

    footerCopy: "© 2026 formly.ai · Privacidad · Términos",
  },

  fr: {
    heroTag: "Gratuit. Inscription en quelques secondes",
    heroTitleLine1: "Les formulaires administratifs",
    heroTitleLine2: "ne devraient pas être",
    heroTitleAccent: "si compliqués.",
    heroBody:
      "lit vos formulaires administratifs et répond à vos questions en langage simple, dans votre langue. Pas de jargon. Pas de confusion. Pas de stress.",
    getStarted: "Commencer gratuitement",
    seeHowItWorks: "Voir comment ça marche",

    stats: [
      {
        num: "50+",
        label: "Formulaires compris par de vraies personnes",
        blue: false,
      },
      { num: "5", label: "Langues disponibles", blue: true },
      {
        num: "4.9/5",
        label: "Satisfaction moyenne des utilisateurs",
        blue: false,
      },
      {
        num: "Zéro",
        label: "Document conservé après la fin de votre session",
        blue: false,
      },
    ],

    trust: [
      "Chiffrement de bout en bout",
      "Aucune donnée stockée",
      "Principaux formulaires administratifs",
      "Conçu pour tout le monde",
    ],

    howItWorksEyebrow: "Comment ça marche",
    howItWorksTitleLine1: "Trois étapes.",
    howItWorksTitleLine2: "Zéro confusion.",

    steps: [
      {
        num: "Étape 01",
        title: "Téléversez votre formulaire",
        desc: "Prenez une photo ou téléversez un PDF. Nous acceptons les documents administratifs : impôts, visas, prestations, et plus encore.",
      },
      {
        num: "Étape 02",
        title: "Nous le lisons pour vous",
        desc: "Notre IA lit chaque champ et extrait les informations importantes. Vous confirmez ce que nous avons trouvé. Vous gardez toujours le contrôle.",
      },
      {
        num: "Étape 03",
        title: "Posez vos questions",
        desc: "Posez des questions en langage simple. Nous expliquons chaque champ, échéance et exigence clairement, dans votre langue.",
      },
    ],

    valuesEyebrow: "Nos valeurs",
    valuesTitleLine1: "Conçu avec soin,",
    valuesTitleLine2: "pour de vraies personnes.",

    values: [
      {
        title: "Priorité à la confidentialité",
        desc: "Nous ne conservons jamais vos documents. Tout est traité pendant votre session et supprimé lorsque vous avez terminé.",
      },
      {
        title: "Conçu pour tout le monde",
        desc: "Conçu pour les personnes âgées, les immigrants de première génération et toute personne qui trouve les démarches administratives difficiles.",
      },
      {
        title: "Votre langue, toujours",
        desc: "Nous répondons dans votre langue, pas dans celle du formulaire. Cinq langues sont disponibles aujourd’hui, et d’autres arrivent.",
      },
    ],

    languagesEyebrow: "Langues",
    languagesTitleLine1: "Nous parlons",
    languagesTitleLine2: "votre langue.",
    languagesSubtitleBeforeBrand:
      "Posez vos questions dans la langue avec laquelle vous êtes le plus à l’aise.",
    languagesSubtitleAfterBrand:
      "répond dans votre langue. Aucune traduction nécessaire.",

    ctaTitleLine1: "Prêt à comprendre",
    ctaTitleLine2: "votre formulaire ?",
    ctaTitleAccent: "Allons-y.",
    ctaSub:
      "Gratuit. Privé. L’inscription prend 30 secondes. Téléversez simplement votre document et posez vos questions.",
    uploadForm: "Téléverser votre formulaire",

    footerCopy: "© 2026 formly.ai · Confidentialité · Conditions",
  },

  zh: {
    heroTag: "免费使用。几秒钟即可注册",
    heroTitleLine1: "政府表格",
    heroTitleLine2: "不应该",
    heroTitleAccent: "这么难。",
    heroBody:
      "会帮你阅读政府表格，并用简单清楚的语言、用你的语言回答问题。没有术语。没有困惑。没有压力。",
    getStarted: "免费开始",
    seeHowItWorks: "查看使用方式",

    stats: [
      { num: "50+", label: "真实用户可理解的表格", blue: false },
      { num: "5", label: "支持的语言", blue: true },
      { num: "4.9/5", label: "平均用户满意度", blue: false },
      {
        num: "零",
        label: "会话结束后保存的文件数量",
        blue: false,
      },
    ],

    trust: ["端到端加密", "不保存数据", "支持主要政府表格", "为每个人而设计"],

    howItWorksEyebrow: "使用方式",
    howItWorksTitleLine1: "三个步骤。",
    howItWorksTitleLine2: "不再困惑。",

    steps: [
      {
        num: "步骤 01",
        title: "上传你的表格",
        desc: "拍照或上传 PDF。我们支持各种政府文件：税务表格、签证申请、福利文件等。",
      },
      {
        num: "步骤 02",
        title: "我们帮你阅读",
        desc: "我们的 AI 会读取每个字段并提取关键信息。你确认我们找到的内容。控制权始终在你手中。",
      },
      {
        num: "步骤 03",
        title: "随时提问",
        desc: "用简单自然的语言提问。我们会用你的语言清楚解释每个字段、截止日期和要求。",
      },
    ],

    valuesEyebrow: "我们的价值观",
    valuesTitleLine1: "用心打造，",
    valuesTitleLine2: "服务真实的人。",

    values: [
      {
        title: "隐私优先",
        desc: "我们绝不会保存你的文件。所有内容都只在你的会话中处理，并在你完成后删除。你的数据属于你。",
      },
      {
        title: "为所有人设计",
        desc: "为老年用户、第一代移民，以及任何觉得政府文件复杂难懂的人而设计。目标是清楚明白。",
      },
      {
        title: "始终使用你的语言",
        desc: "我们用你的语言回答，而不是只用表格上的语言。目前支持五种语言，未来会支持更多。",
      },
    ],

    languagesEyebrow: "语言",
    languagesTitleLine1: "我们使用",
    languagesTitleLine2: "你的语言。",
    languagesSubtitleBeforeBrand: "用你最舒服的语言提问。",
    languagesSubtitleAfterBrand: "会用你的语言回答。不需要自己翻译。",

    ctaTitleLine1: "准备好理解",
    ctaTitleLine2: "你的表格了吗？",
    ctaTitleAccent: "开始吧。",
    ctaSub: "免费。私密。注册只需 30 秒。上传文件，然后提问即可。",
    uploadForm: "上传你的表格",

    footerCopy: "© 2026 formly.ai · 隐私 · 条款",
  },

  ar: {
    heroTag: "مجاني للاستخدام. سجّل خلال ثوانٍ",
    heroTitleLine1: "النماذج الحكومية",
    heroTitleLine2: "لا ينبغي أن تكون",
    heroTitleAccent: "بهذه الصعوبة.",
    heroBody:
      "يقرأ نماذجك الحكومية نيابةً عنك ويجيب عن أسئلتك بلغة بسيطة، وبلغتك. بلا مصطلحات معقدة. بلا ارتباك. بلا توتر.",
    getStarted: "ابدأ مجانًا",
    seeHowItWorks: "شاهد كيف يعمل",

    stats: [
      { num: "50+", label: "نماذج يفهمها أشخاص حقيقيون", blue: false },
      { num: "5", label: "لغات مدعومة", blue: true },
      { num: "4.9/5", label: "متوسط رضا المستخدمين", blue: false },
      {
        num: "صفر",
        label: "مستندات يتم الاحتفاظ بها بعد انتهاء جلستك",
        blue: false,
      },
    ],

    trust: [
      "تشفير من طرف إلى طرف",
      "لا يتم تخزين البيانات",
      "يدعم أهم النماذج الحكومية",
      "مصمم للجميع",
    ],

    howItWorksEyebrow: "كيف يعمل",
    howItWorksTitleLine1: "ثلاث خطوات.",
    howItWorksTitleLine2: "بدون ارتباك.",

    steps: [
      {
        num: "الخطوة 01",
        title: "ارفع النموذج",
        desc: "التقط صورة أو ارفع ملف PDF. نقبل المستندات الحكومية مثل نماذج الضرائب وطلبات التأشيرة وأوراق المساعدات وغيرها.",
      },
      {
        num: "الخطوة 02",
        title: "نقرأه لك",
        desc: "يقرأ الذكاء الاصطناعي كل حقل ويستخرج المعلومات المهمة. أنت تؤكد ما وجدناه. أنت دائمًا المتحكم.",
      },
      {
        num: "الخطوة 03",
        title: "اسأل أي شيء",
        desc: "اطرح أسئلتك بلغة بسيطة. نشرح كل حقل وموعد نهائي ومتطلب بوضوح، وبلغتك.",
      },
    ],

    valuesEyebrow: "قيمنا",
    valuesTitleLine1: "مصمم بعناية،",
    valuesTitleLine2: "لأشخاص حقيقيين.",

    values: [
      {
        title: "الخصوصية أولًا",
        desc: "لا نخزن مستنداتك أبدًا. تتم معالجة كل شيء أثناء جلستك ويتم حذفه عند الانتهاء. بياناتك ملكك.",
      },
      {
        title: "مصمم للجميع",
        desc: "مصمم لكبار السن والمهاجرين من الجيل الأول وكل من يجد الأوراق الحكومية مرهقة أو صعبة الفهم.",
      },
      {
        title: "لغتك دائمًا",
        desc: "نجيب بلغتك، وليس فقط بلغة النموذج. ندعم خمس لغات اليوم، والمزيد قادم.",
      },
    ],

    languagesEyebrow: "اللغات",
    languagesTitleLine1: "نتحدث",
    languagesTitleLine2: "لغتك.",
    languagesSubtitleBeforeBrand:
      "اطرح أسئلتك باللغة التي تشعر براحة أكبر عند استخدامها.",
    languagesSubtitleAfterBrand: "يرد بلغتك. لا حاجة للترجمة.",

    ctaTitleLine1: "هل أنت مستعد لفهم",
    ctaTitleLine2: "نموذجك؟",
    ctaTitleAccent: "لنبدأ.",
    ctaSub: "مجاني. خاص. يستغرق التسجيل 30 ثانية فقط. ارفع النموذج واسأل.",
    uploadForm: "ارفع النموذج",

    footerCopy: "© 2026 formly.ai · الخصوصية · الشروط",
  },
};

function stepHref(path: string, lang: LanguageOption) {
  return `${path}?language=${encodeURIComponent(lang.code)}`;
}

export function LandingPageClient() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(
    languages[0],
  );

  useEffect(() => {
    const code = getStoredLanguageCode();
    if (!code) return;

    const opt = languages.find((l) => l.code === code);
    if (opt) setSelectedLanguage(opt);
  }, []);

  const handleLanguageChange = (lang: LanguageOption) => {
    setSelectedLanguage(lang);
    setPreferredLanguage(lang.code);
  };

  const copy =
    LANDING_COPY[selectedLanguage.code as keyof typeof LANDING_COPY] ??
    LANDING_COPY.en;

  const trustItems = TRUST.map((item, index) => ({
    ...item,
    label: copy.trust[index],
  }));

  const stepItems = STEPS.map((item, index) => ({
    ...item,
    ...copy.steps[index],
  }));

  const valueItems = VALUES.map((item, index) => ({
    ...item,
    ...copy.values[index],
  }));

  const isRtl = selectedLanguage.code === "ar";

  return (
    <div
      className={styles.page}
      lang={selectedLanguage.code}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <AppNav
        landing
        landingRight={
          <LanguageDropdown
            variant="nav"
            selected={selectedLanguage}
            onSelect={handleLanguageChange}
          />
        }
      />

      <div className={styles.heroWrap}>
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroTag}>
              <span className={styles.heroTagDot} />
              <span className={styles.heroTagText}>{copy.heroTag}</span>
            </div>

            <h1 className={styles.heroH1}>
              {copy.heroTitleLine1}
              <br />
              {copy.heroTitleLine2}
              <br />
              <em className={styles.heroAccent}>{copy.heroTitleAccent}</em>
            </h1>

            <p className={styles.heroBody}>
              <span className={styles.heroBrand}>
                formly<span className={styles.logoAccent}>.ai</span>
              </span>{" "}
              {copy.heroBody}
            </p>

            <div className={styles.heroActions}>
              <div className={styles.heroActionButtons}>
                <Link
                  href={stepHref("/step/1", selectedLanguage)}
                  className={styles.btnHero}
                >
                  {copy.getStarted}
                  <IconArrowRight size={14} aria-hidden />
                </Link>

                <a href="#how-it-works" className={styles.btnHeroSec}>
                  <IconPlayerPlay size={13} aria-hidden />
                  {copy.seeHowItWorks}
                </a>
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            {copy.stats.map((s) => (
              <div
                key={s.label}
                className={`${styles.statCard} ${
                  s.blue ? styles.statCardBlue : ""
                }`}
              >
                <div className={styles.statNum}>{s.num}</div>
                <div className={styles.statLabel}>{s.label}</div>

                {s.blue ? (
                  <div className={styles.langChips}>
                    {languages.map((l) => (
                      <span key={l.code} className={styles.langChip}>
                        {l.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.trustStrip}>
        {trustItems.map(({ icon: Icon, label }) => (
          <div key={label} className={styles.trustItem}>
            <Icon size={16} aria-hidden />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.sectionWrap}>
        <section id="how-it-works" className={styles.section}>
          <p className={styles.sectionEyebrow}>{copy.howItWorksEyebrow}</p>

          <h2 className={styles.sectionH2}>
            {copy.howItWorksTitleLine1}
            <br />
            {copy.howItWorksTitleLine2}
          </h2>

          <div className={styles.stepsGrid}>
            {stepItems.map(({ icon: Icon, num, title, desc }) => (
              <div key={num} className={styles.stepCol}>
                <div className={styles.stepIcon}>
                  <Icon size={20} stroke={1.5} aria-hidden />
                </div>
                <p className={styles.stepNum}>{num}</p>
                <p className={styles.stepTitle}>{title}</p>
                <p className={styles.stepDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.sectionWrap}>
        <section className={styles.sectionNoBorder}>
          <p className={styles.sectionEyebrow}>{copy.valuesEyebrow}</p>

          <h2 className={styles.sectionH2}>
            {copy.valuesTitleLine1}
            <br />
            {copy.valuesTitleLine2}
          </h2>

          <div className={styles.valuesGrid}>
            {valueItems.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.valueCard}>
                <div className={styles.valueIcon}>
                  <Icon size={22} stroke={1.5} aria-hidden />
                </div>
                <p className={styles.valueTitle}>{title}</p>
                <p className={styles.valueDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.langWrap}>
        <section id="languages" className={styles.langSection}>
          <div>
            <p className={styles.sectionEyebrow}>{copy.languagesEyebrow}</p>

            <h2 className={styles.langH2}>
              {copy.languagesTitleLine1}
              <br />
              {copy.languagesTitleLine2}
            </h2>

            <p className={styles.langSubtitle}>
              {copy.languagesSubtitleBeforeBrand}{" "}
              <span className={styles.heroBrand}>
                formly<span className={styles.logoAccent}>.ai</span>
              </span>{" "}
              {copy.languagesSubtitleAfterBrand}
            </p>
          </div>

          <div className={styles.langList}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={`${styles.langBadge} ${
                  selectedLanguage.code === lang.code
                    ? styles.langBadgeActive
                    : ""
                }`}
                onClick={() => handleLanguageChange(lang)}
                aria-pressed={selectedLanguage.code === lang.code}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.ctaWrap}>
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaH2}>
            {copy.ctaTitleLine1}
            <br />
            {copy.ctaTitleLine2}{" "}
            <em className={styles.heroAccent}>{copy.ctaTitleAccent}</em>
          </h2>

          <p className={styles.ctaSub}>{copy.ctaSub}</p>

          <Link
            href={stepHref("/step/1", selectedLanguage)}
            className={styles.btnCtaLarge}
          >
            {copy.uploadForm}
            <IconArrowRight size={16} aria-hidden />
          </Link>
        </section>
      </div>

      <footer id="privacy" className={styles.footer}>
        <div className={styles.footerLogo}>
          formly<span className={styles.logoAccent}>.ai</span>
        </div>
        <div className={styles.footerCopy}>{copy.footerCopy}</div>
      </footer>
    </div>
  );
}
