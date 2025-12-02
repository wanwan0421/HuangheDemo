import { ArrowUp } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

export default function ChatInput({ onSend }: { onSend: (msg: string) => void }) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const MAX_HEIGHT = 200;
    // Automatic adjust height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }

        const ta = textareaRef.current;
        if (!ta) return;

        ta.style.height = "auto"
        const scrollHeight = ta.scrollHeight;

        if (scrollHeight <= MAX_HEIGHT) {
            ta.style.height = scrollHeight + "px";
            ta.style.overflowY = "hidden";
        } else {
            ta.style.height = MAX_HEIGHT + "px";
            ta.style.overflowY = "auto";
        }
    }, [input]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full bg-white px-4 py-3 items-center">
            <div className="relative max-w-4xl mx-auto">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask question..."
                    className="chat-textarea w-full resize-none overflow-hidden p-3 pr-12 rounded-2xl border border-gray-300 focus:ring-2 ring-blue-300 text-black shadow-sm"
                    rows={1}
                />

                <button
                    onClick={handleSend}
                    className="absolute right-3 bottom-3 w-9 h-9 flex items-center justify-center rounded-full bg-black text-white">
                    <ArrowUp size={20} />
                </button>
            </div>
        </div>
    )
}