import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { MessageDisplay } from "@/components/MessageDisplay";
import { FileUploadButton, type SelectedFile } from "@/components/FileUploadButton";
import { Button } from "@/components/ui/button";
import { Menu, Send, Square, Sun, Moon, LogOut, Download } from "lucide-react";
import type { Message } from "../../../drizzle/schema";

export default function ChatPage() {
  const { user, loading: isLoading, logout } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [localMessages, setLocalMessages] = useState<Array<{ id: number; role: "user" | "assistant"; content: string; conversationId: number; codeBlocks: string | null; createdAt: Date }>>([]);

  const { sendMessage: streamSend, isStreaming, streamingContent, cancel } = useStreamingChat();
  const utils = trpc.useUtils();

  // Queries
  const { data: conversations = [] } = trpc.chat.listConversations.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: fetchedMessages = [] } = trpc.chat.getMessages.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );

  // Sync fetched messages into local state when conversation changes
  useEffect(() => {
    setLocalMessages(fetchedMessages as typeof localMessages);
  }, [fetchedMessages]);

  const messages = localMessages;

  // Mutations
  const createConvMutation = trpc.chat.createConversation.useMutation();
  const deleteConvMutation = trpc.chat.deleteConversation.useMutation();

  // Initialize first conversation
  useEffect(() => {
    if (!user) return;

    if (conversations.length === 0) {
      createConvMutation.mutate({ language }, {
        onSuccess: (result) => {
          setActiveConversationId(result.id);
        },
      });
    } else if (!activeConversationId) {
      setActiveConversationId(conversations[0]!.id);
    }
  }, [user, conversations.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedFile) || !activeConversationId || isStreaming) return;

    // Build message: prepend file content if attached
    let userMessage = input.trim();
    if (selectedFile) {
      const fileHeader = `**File: ${selectedFile.file.name}**\n\`\`\`${selectedFile.language}\n${selectedFile.content}\n\`\`\``;
      userMessage = userMessage ? `${fileHeader}\n\n${userMessage}` : fileHeader;
      setSelectedFile(null);
    }
    setInput("");

    // Optimistically add user message to local state
    const tempUserMsg = {
      id: Date.now(),
      role: "user" as const,
      content: userMessage,
      conversationId: activeConversationId,
      codeBlocks: null,
      createdAt: new Date(),
    };
    setLocalMessages((prev) => [...prev, tempUserMsg]);

    await streamSend(
      activeConversationId,
      userMessage,
      (_token) => {
        // tokens are shown via streamingContent
      },
      (fullContent) => {
        // Streaming done — add final assistant message and refresh
        const assistantMsg = {
          id: Date.now() + 1,
          role: "assistant" as const,
          content: fullContent,
          conversationId: activeConversationId,
          codeBlocks: null,
          createdAt: new Date(),
        };
        setLocalMessages((prev) => [...prev, assistantMsg]);
        // Refresh conversation list (title may have changed)
        utils.chat.listConversations.invalidate();
      },
      (errMsg) => {
        const errAssistant = {
          id: Date.now() + 1,
          role: "assistant" as const,
          content: errMsg,
          conversationId: activeConversationId,
          codeBlocks: null,
          createdAt: new Date(),
        };
        setLocalMessages((prev) => [...prev, errAssistant]);
      }
    );
  };

  const handleNewChat = () => {
    createConvMutation.mutate({ language }, {
      onSuccess: (result) => {
        setActiveConversationId(result.id);
        setSidebarOpen(false);
      },
    });
  };

  const handleDeleteConversation = (id: number) => {
    if (confirm(t("deleteChat"))) {
      deleteConvMutation.mutate({ conversationId: id }, {
        onSuccess: () => {
          if (activeConversationId === id) {
            setActiveConversationId(null);
          }
        },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExport = () => {
    if (!messages.length) return;
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    const title = activeConv?.title || "conversation";

    const md = messages
      .map((m) => {
        const label = m.role === "user" ? "**You**" : "**Coding Expert**";
        return `${label}\n\n${m.content}`;
      })
      .join("\n\n---\n\n");

    const fullMd = `# ${title}\n\n${md}\n`;
    const blob = new Blob([fullMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, isLoading]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400">{t("loadingMessages")}</p>
        </div>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className={`flex h-screen ${isDark ? "bg-slate-950 text-slate-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-emerald-400">{t("appTitle")}</h1>
              <p className="text-xs text-slate-400">{t("appSubtitle")}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "bn" : "en")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                language === "en"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {language === "en" ? "EN" : "বাংলা"}
            </button>

            {/* Export */}
            {messages.length > 0 && (
              <button
                onClick={handleExport}
                className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                title="Export conversation as Markdown"
              >
                <Download size={16} />
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>

            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400">{t("online")}</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">⌨️</div>
              <h2 className="text-xl font-semibold text-emerald-400 mb-2">
                {t("codingExpertReady")}
              </h2>
              <p className="text-slate-400 mb-6 max-w-md">
                {t("askCodingQuestion")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md">
                {[
                  t("pythonCalculator"),
                  t("reactUseState"),
                  t("fixError"),
                  t("asyncAwait"),
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="p-3 rounded-lg border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50 text-sm text-slate-300 hover:text-slate-100 transition-all text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageDisplay
                key={msg.id}
                content={msg.content}
                role={msg.role as "user" | "assistant"}
              />
            ))
          )}

          {isStreaming && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-600 text-white">
                ⌨
              </div>
              <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                {streamingContent ? (
                  <MessageDisplay content={streamingContent} role="assistant" streaming />
                ) : (
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <div className="flex-1 flex flex-col gap-2">
              {/* File preview above textarea */}
              <FileUploadButton
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                disabled={isStreaming}
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedFile ? "Add a message about this file..." : t("askQuestion")}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none min-h-12 max-h-32 font-mono text-sm"
              />
              <p className="text-xs text-slate-500">
                {t("bengaliSupport")}
              </p>
            </div>
            {isStreaming ? (
              <Button
                onClick={cancel}
                className="self-end bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-3 h-12 flex items-center gap-2"
              >
                <Square size={18} />
                <span className="hidden sm:inline">Stop</span>
              </Button>
            ) : (
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() && !selectedFile}
                className="self-end bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-3 h-12 flex items-center gap-2"
              >
                <Send size={18} />
                <span className="hidden sm:inline">{t("send")}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
