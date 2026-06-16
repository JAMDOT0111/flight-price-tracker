import { useRef, useState } from "react";
import { api } from "../api.js";
import Icon from "./Icon.js";

export interface CurrentUser {
  tag: string;
  isAdmin: boolean;
}

interface Props {
  onLogin: (user: CurrentUser) => void;
}

const inputCls =
  "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function LoginModal({ onLogin }: Props) {
  const [tag, setTag] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const tagRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimTag = tag.trim();
    if (!trimTag || !password) {
      setError("請填寫名稱與密碼");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await api.login(trimTag, password);
      if (!result.ok || !result.tag) {
        setError(result.message ?? "登入失敗");
        return;
      }
      const user: CurrentUser = { tag: result.tag, isAdmin: result.isAdmin ?? false };
      localStorage.setItem("flight-tracker-user", JSON.stringify(user));
      localStorage.removeItem("flight-tracker-tag");
      setCreated(!!result.created);
      onLogin(user);
    } catch {
      setError("無法連線至伺服器，請確認網路狀態");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Icon name="flight_takeoff" filled className="text-4xl text-primary" />
          <h1 className="text-title-lg font-bold text-on-surface">機票最低價追蹤</h1>
          <p className="text-label-md text-on-surface-variant text-center">
            請輸入你的名稱與密碼以開始使用
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-label-md text-on-surface-variant">你的名稱</label>
            <input
              ref={tagRef}
              className={inputCls}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="輸入你的暱稱，如：小明"
              maxLength={20}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-2 block text-label-md text-on-surface-variant">密碼</label>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="設定你的密碼"
              maxLength={50}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-error-container px-4 py-3 text-label-md text-on-error-container">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-label-lg font-bold text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            <Icon name="login" className="text-xl" />
            {loading ? "驗證中…" : "登入 / 建立帳號"}
          </button>
        </form>

        <p className="mt-4 text-center text-label-xs text-on-surface-variant/60">
          首次使用某名稱將自動建立帳號，下次憑相同密碼登入
        </p>
      </div>
    </div>
  );
}
