import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import Icon from "./Icon.js";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackDialog({ open, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setMessage("");
      setStatus("idle");
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  async function handleSubmit() {
    if (!message.trim() || status === "sending") return;
    setStatus("sending");
    try {
      await api.submitFeedback(message.trim());
      setStatus("done");
      setTimeout(() => {
        setMessage("");
        setStatus("idle");
        onClose();
      }, 1500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* 背景半透明遮罩（僅在 lg 以下） */}
      <div
        className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        onClick={onClose}
        aria-hidden
      />

      {/* 對話框：桌面版浮在左側欄上方，手機版由底部滑上（bottom-20 = 80px，閃過底部 nav bar） */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="問題回報"
        className="fixed z-50 flex max-h-[80vh] flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-xl
          bottom-20 left-4 right-4
          lg:bottom-6 lg:left-4 lg:right-auto lg:w-56"
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3">
          <div className="flex items-center gap-2 text-label-md font-bold text-on-surface">
            <Icon name="bug_report" className="text-lg text-primary" />
            問題回報
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high"
            aria-label="關閉"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* 內容（overflow-y-auto 確保手機小螢幕可捲動） */}
        <div className="overflow-y-auto p-4">
          {status === "done" ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Icon name="check_circle" className="text-3xl text-primary" filled />
              <p className="text-label-md font-semibold text-on-surface">已送出，謝謝！</p>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="描述你遇到的問題或建議…"
                maxLength={1000}
                rows={4}
                className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <div className="mt-1 flex justify-end">
                <span className="text-label-xs text-on-surface-variant/50">
                  {message.length}/1000
                </span>
              </div>
              {status === "error" && (
                <p className="mt-1 text-label-sm text-error">送出失敗，請稍後再試</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-outline-variant px-3 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!message.trim() || status === "sending"}
                  className="flex-1 rounded-xl bg-primary px-3 py-2 text-label-md font-bold text-on-primary transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {status === "sending" ? "送出中…" : "確認送出"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
