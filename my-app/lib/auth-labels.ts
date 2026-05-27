export type AuthLabels = {
  loginTitle: string;
  loginSubtitle: string;
  loginFooterText: string;
  loginFooterLink: string;
  signupTitle: string;
  signupSubtitle: string;
  signupFooterText: string;
  signupFooterLink: string;
  useAsGuest: string;
  or: string;
  email: string;
  password: string;
  fullName: string;
  forgotPassword: string;
  signingIn: string;
  signIn: string;
  creatingAccount: string;
  createAccount: string;
  passwordHint: string;
};

export const authLabels: Record<string, AuthLabels> = {
  en: {
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to keep working on your forms.",
    loginFooterText: "New to formly.ai?",
    loginFooterLink: "Create an account",
    signupTitle: "Create your account",
    signupSubtitle: "Save your forms and pick up where you left off.",
    signupFooterText: "Already have an account?",
    signupFooterLink: "Sign in",
    useAsGuest: "Use as a guest",
    or: "or",
    email: "Email",
    password: "Password",
    fullName: "Full name",
    forgotPassword: "Forgot password?",
    signingIn: "Signing in…",
    signIn: "Sign in",
    creatingAccount: "Creating account…",
    createAccount: "Create account",
    passwordHint: "At least 8 characters.",
  },
  es: {
    loginTitle: "Bienvenido de nuevo",
    loginSubtitle: "Inicia sesión para continuar con tus formularios.",
    loginFooterText: "¿Nuevo en formly.ai?",
    loginFooterLink: "Crear una cuenta",
    signupTitle: "Crea tu cuenta",
    signupSubtitle: "Guarda tus formularios y retoma donde lo dejaste.",
    signupFooterText: "¿Ya tienes una cuenta?",
    signupFooterLink: "Iniciar sesión",
    useAsGuest: "Continuar como invitado",
    or: "o",
    email: "Correo electrónico",
    password: "Contraseña",
    fullName: "Nombre completo",
    forgotPassword: "¿Olvidaste tu contraseña?",
    signingIn: "Iniciando sesión…",
    signIn: "Iniciar sesión",
    creatingAccount: "Creando cuenta…",
    createAccount: "Crear cuenta",
    passwordHint: "Al menos 8 caracteres.",
  },
  zh: {
    loginTitle: "欢迎回来",
    loginSubtitle: "登录以继续处理你的表格。",
    loginFooterText: "还没有账户？",
    loginFooterLink: "创建账户",
    signupTitle: "创建你的账户",
    signupSubtitle: "保存你的表格，随时继续。",
    signupFooterText: "已有账户？",
    signupFooterLink: "登录",
    useAsGuest: "以访客身份使用",
    or: "或",
    email: "电子邮件",
    password: "密码",
    fullName: "全名",
    forgotPassword: "忘记密码？",
    signingIn: "登录中…",
    signIn: "登录",
    creatingAccount: "创建账户中…",
    createAccount: "创建账户",
    passwordHint: "至少 8 个字符。",
  },
  ar: {
    loginTitle: "مرحباً بعودتك",
    loginSubtitle: "سجّل الدخول لمتابعة العمل على نماذجك.",
    loginFooterText: "جديد على formly.ai؟",
    loginFooterLink: "إنشاء حساب",
    signupTitle: "أنشئ حسابك",
    signupSubtitle: "احفظ نماذجك وتابع من حيث توقفت.",
    signupFooterText: "لديك حساب بالفعل؟",
    signupFooterLink: "تسجيل الدخول",
    useAsGuest: "المتابعة كضيف",
    or: "أو",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    forgotPassword: "نسيت كلمة المرور؟",
    signingIn: "جارٍ تسجيل الدخول…",
    signIn: "تسجيل الدخول",
    creatingAccount: "جارٍ إنشاء الحساب…",
    createAccount: "إنشاء حساب",
    passwordHint: "8 أحرف على الأقل.",
  },
  fr: {
    loginTitle: "Bon retour",
    loginSubtitle: "Connectez-vous pour continuer à travailler sur vos formulaires.",
    loginFooterText: "Nouveau sur formly.ai ?",
    loginFooterLink: "Créer un compte",
    signupTitle: "Créez votre compte",
    signupSubtitle: "Enregistrez vos formulaires et reprenez là où vous en étiez.",
    signupFooterText: "Vous avez déjà un compte ?",
    signupFooterLink: "Se connecter",
    useAsGuest: "Continuer en tant qu'invité",
    or: "ou",
    email: "E-mail",
    password: "Mot de passe",
    fullName: "Nom complet",
    forgotPassword: "Mot de passe oublié ?",
    signingIn: "Connexion en cours…",
    signIn: "Se connecter",
    creatingAccount: "Création du compte…",
    createAccount: "Créer un compte",
    passwordHint: "Au moins 8 caractères.",
  },
};

export function getAuthLabels(languageCode: string | null | undefined): AuthLabels {
  return authLabels[languageCode ?? "en"] ?? authLabels.en;
}
