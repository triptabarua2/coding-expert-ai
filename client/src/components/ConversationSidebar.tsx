import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import type { Conversation } from "../../../drizzle/schema";
import { Trash2, Search, X } from "lucide-react";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 z-40 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 md:z-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="text-sm font-semibold text-emerald-400 tracking-wider">
            {t("chatHistory")}
          </span>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-200"
          >
            {t("close")}
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="mx-4 mt-3 px-3 py-2 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
        >
          {t("newChat")}
        </button>

        {/* Search */}
        <div className="px-4 mt-3 relative">
          <Search size={14} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-8 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              {search ? "No results found." : t("emptyConversation")}
            </p>
          ) : (
            filtered.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                  activeId === conv.id
                    ? "bg-emerald-500/20 border border-emerald-500/40"
                    : "hover:bg-slate-800/50 border border-transparent"
                }`}
                onClick={() => {
                  onSelect(conv.id);
                  onClose();
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      activeId === conv.id ? "text-emerald-400" : "text-slate-300"
                    }`}
                  >
                    {conv.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
