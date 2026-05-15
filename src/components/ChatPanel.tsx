import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Loader2 } from "lucide-react";
import ChatInput from "./ChatInput";
import ToolTimeline from "./ToolTimeline";
import type { Message } from "../types";
import { getMessageCopyText } from "../util/messageUtils";

type ChatPanelProps = {
  messages: Message[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  copiedMessageId: string | null;
  isAgentRunning: boolean;
  agentStatusAnchorId: string | null;
  agentStatusText: string;
  onCopyMessage: (msg: Message) => void;
  onSendMessage: (msg: string) => void;
};

export default function ChatPanel({
  messages,
  scrollRef,
  copiedMessageId,
  isAgentRunning,
  agentStatusAnchorId,
  agentStatusText,
  onCopyMessage,
  onSendMessage,
}: ChatPanelProps) {
  return (
    <main className="flex flex-1 flex-col min-w-[350px]">
      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto bg-white min-h-0 [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent]
          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-200/50
          hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/60
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full">
            <p className="text-gray-400 text-center text-base">
              👋 Enter your instructions to start the decision process
              <br />
              (example: help me predict land use change)
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`group flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex flex-col space-y-2 max-w-[85%]">
                  {msg.role === "user" && (
                    <div className="p-3 rounded-lg bg-gray-200/50 text-black rounded-tr-none self-end">
                      <p className="text-base">{msg.content}</p>
                    </div>
                  )}

                  {(() => {
                    const canCopy = getMessageCopyText(msg).length > 0;
                    const copied = copiedMessageId === msg.id;

                    return (
                      <button
                        type="button"
                        disabled={!canCopy}
                        onClick={() => onCopyMessage(msg)}
                        className={`inline-flex items-center gap-1 text-xs ${msg.role === "user" ? "self-end" : "self-start"} transition-all duration-150 ${copied ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${
                          canCopy
                            ? "text-gray-600 hover:text-gray-900"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                        aria-label="复制消息"
                        title={canCopy ? "复制消息" : "暂无可复制内容"}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? "已复制" : "复制"}</span>
                      </button>
                    );
                  })()}

                  {msg.role === "AI" && (
                    <div className="flex flex-col space-y-2 w-full max-w-4xl">
                      {isAgentRunning &&
                        msg.id === agentStatusAnchorId &&
                        !msg.tools?.length &&
                        !msg.profile && (
                          <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700 self-start">
                            <Loader2 size={14} className="animate-spin" />
                            <span>{agentStatusText}</span>
                          </div>
                        )}

                      {(Boolean(msg.tools?.length) || Boolean(msg.profile)) && (
                        <div className="self-start w-full md:w-[800px]">
                          <ToolTimeline msg={msg} />
                        </div>
                      )}

                      {msg.content && (
                        <div className="p-4 text-black w-full">
                          <article
                            className="prose max-w-none text-black
                              **:text-black
                              prose-headings:font-bold
                              prose-h2:mt-8 prose-h2:mb-4
                              prose-h3:mt-6
                              prose-p:text-black
                              prose-strong:text-black
                              marker:text-black marker:font-semibold
                              prose-table:border prose-table:rounded-xl
                              prose-code:before:content-none prose-code:after:content-none
                              prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                              prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                              prose-pre:text-sm prose-pre:text-black"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </article>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="h-4" />
          </div>
        )}
      </div>

      <ChatInput onSend={onSendMessage} />
    </main>
  );
}