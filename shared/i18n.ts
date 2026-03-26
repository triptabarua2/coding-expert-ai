/**
 * Localization strings for Coding Expert AI
 * Supports Bengali (bn) and English (en)
 */

export type Language = "en" | "bn";

export const translations = {
  en: {
    // Header & Navigation
    appTitle: "Coding Expert",
    appSubtitle: "AI-Powered Code Solutions",
    online: "Online",
    newChat: "+ New Chat",
    chatHistory: "💬 CHAT HISTORY",
    close: "✕",

    // Chat Interface
    askQuestion: "Ask a coding question...",
    send: "Send",
    copy: "Copy",
    copied: "✓ Copied!",
    delete: "Delete",
    deleteChat: "Delete this chat?",
    confirm: "Confirm",
    cancel: "Cancel",

    // Messages
    codingExpertReady: "Coding Expert Ready!",
    askCodingQuestion: "Ask any coding question",
    bengaliSupport: "Ask in Bengali or English",
    onlyCodeQuestions: "I only help with coding questions 🤖",
    connectionError: "❌ Connection error. Please try again.",
    noResponse: "No response received.",

    // Suggestions
    pythonCalculator: "Python দিয়ে calculator বানাও",
    reactUseState: "React useState explain করো",
    fixError: "এই error fix করো",
    asyncAwait: "JavaScript async/await কী?",
    debugCode: "Debug this code",
    optimizeCode: "Optimize this code",
    codeReview: "Review this code",
    explainConcept: "Explain this concept",

    // File Upload
    uploadCode: "Upload Code File",
    selectFile: "Select a file to review",
    fileSize: "File size:",
    fileName: "File name:",
    uploadSuccess: "File uploaded successfully",
    uploadError: "Error uploading file",
    supportedFormats: "Supported: .js .ts .py .java .go .rs .cpp .cs .rb .php .swift .kt .dart .lua .zig .r .hs .ex .sql .html .css .sh and more",

    // Language Toggle
    language: "Language",
    english: "English",
    bengali: "বাংলা",

    // Code Display
    language_label: "Language",
    code_block: "code",
    javascript: "javascript",
    python: "python",
    java: "java",
    cpp: "cpp",
    go: "go",
    rust: "rust",
    typescript: "typescript",
    jsx: "jsx",
    tsx: "tsx",

    // Empty States
    emptyConversation: "No messages yet. Start by asking a coding question!",
    loadingMessages: "Loading messages...",
    loadingResponse: "AI is thinking...",

    // Errors
    error: "Error",
    tryAgain: "Try Again",
    invalidInput: "Please enter a valid question",
    fileTooLarge: "File is too large (max 10MB)",
  },

  bn: {
    // Header & Navigation
    appTitle: "কোডিং এক্সপার্ট",
    appSubtitle: "AI-চালিত কোড সমাধান",
    online: "অনলাইন",
    newChat: "+ নতুন চ্যাট",
    chatHistory: "💬 চ্যাট ইতিহাস",
    close: "✕",

    // Chat Interface
    askQuestion: "একটি কোডিং প্রশ্ন জিজ্ঞাসা করুন...",
    send: "পাঠান",
    copy: "কপি করুন",
    copied: "✓ কপি হয়েছে!",
    delete: "মুছুন",
    deleteChat: "এই চ্যাট মুছবেন?",
    confirm: "নিশ্চিত করুন",
    cancel: "বাতিল করুন",

    // Messages
    codingExpertReady: "কোডিং এক্সপার্ট প্রস্তুত!",
    askCodingQuestion: "যেকোনো কোডিং প্রশ্ন জিজ্ঞাসা করুন",
    bengaliSupport: "বাংলা বা ইংরেজিতে জিজ্ঞাসা করুন",
    onlyCodeQuestions: "আমি শুধু কোডিং এ সাহায্য করি 🤖",
    connectionError: "❌ সংযোগে সমস্যা। আবার চেষ্টা করুন।",
    noResponse: "কোনো উত্তর পাওয়া যায়নি।",

    // Suggestions
    pythonCalculator: "Python দিয়ে calculator বানাও",
    reactUseState: "React useState explain করো",
    fixError: "এই error fix করো",
    asyncAwait: "JavaScript async/await কী?",
    debugCode: "এই কোড debug করুন",
    optimizeCode: "এই কোড optimize করুন",
    codeReview: "এই কোড review করুন",
    explainConcept: "এই concept explain করুন",

    // File Upload
    uploadCode: "কোড ফাইল আপলোড করুন",
    selectFile: "রিভিউ এর জন্য একটি ফাইল নির্বাচন করুন",
    fileSize: "ফাইল সাইজ:",
    fileName: "ফাইলের নাম:",
    uploadSuccess: "ফাইল সফলভাবে আপলোড হয়েছে",
    uploadError: "ফাইল আপলোড করতে ত্রুটি",
    supportedFormats: "সমর্থিত: .js .ts .py .java .go .rs .cpp .cs .rb .php .swift .kt .dart .lua .zig .r .hs .ex .sql .html .css .sh এবং আরো",

    // Language Toggle
    language: "ভাষা",
    english: "English",
    bengali: "বাংলা",

    // Code Display
    language_label: "ভাষা",
    code_block: "কোড",
    javascript: "javascript",
    python: "python",
    java: "java",
    cpp: "cpp",
    go: "go",
    rust: "rust",
    typescript: "typescript",
    jsx: "jsx",
    tsx: "tsx",

    // Empty States
    emptyConversation: "এখনো কোনো বার্তা নেই। একটি কোডিং প্রশ্ন জিজ্ঞাসা করে শুরু করুন!",
    loadingMessages: "বার্তা লোড হচ্ছে...",
    loadingResponse: "AI চিন্তা করছে...",

    // Errors
    error: "ত্রুটি",
    tryAgain: "আবার চেষ্টা করুন",
    invalidInput: "অনুগ্রহ করে একটি বৈধ প্রশ্ন লিখুন",
    fileTooLarge: "ফাইল খুব বড় (সর্বোচ্চ 10MB)",
  },
};

export function t(language: Language, key: keyof typeof translations.en): string {
  return translations[language][key as keyof typeof translations[Language]] || key;
}
