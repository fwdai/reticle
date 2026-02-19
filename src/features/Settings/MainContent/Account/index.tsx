import {
  Briefcase,
  Camera,
  GraduationCap,
  Home,
  Sparkles,
  User,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import GenericSelect from "@/components/Layout/Select";
import { getOrCreateAccount, upsertAccount } from "@/lib/storage";
import type { Account } from "@/types";

const USAGE_CONTEXT_OPTIONS: {
  value: Account["usage_context"];
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "work", label: "Work", icon: <Briefcase className="size-4" /> },
  { value: "personal", label: "Personal", icon: <Home className="size-4" /> },
  {
    value: "education",
    label: "Education",
    icon: <GraduationCap className="size-4" />,
  },
  { value: "other", label: "Other", icon: <Sparkles className="size-4" /> },
];

const USE_CASE_OPTIONS = [
  "Prompt engineering",
  "Evaluations",
  "Prototyping",
  "Documentation",
  "Research",
  "Other",
];

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Denver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const INPUT_STYLES =
  "w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

function Account() {
  const [isLoading, setIsLoading] = useState(true);

  const [avatar, setAvatar] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [useCase, setUseCase] = useState("");
  const [timezone, setTimezone] = useState("");
  const [usageContext, setUsageContext] =
    useState<Account["usage_context"]>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const acc = await getOrCreateAccount();
        setAvatar(acc.avatar ?? null);
        setFirstName(acc.first_name ?? "");
        setLastName(acc.last_name ?? "");
        setRole(acc.role ?? "");
        setUseCase(acc.use_case ?? "");
        setTimezone(acc.timezone ?? "");
        setUsageContext(acc.usage_context ?? null);
      } catch (error) {
        console.error("Failed to load account:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const saveField = async (
    updates: Partial<
      Pick<
        Account,
        | "first_name"
        | "last_name"
        | "avatar"
        | "role"
        | "use_case"
        | "timezone"
        | "usage_context"
      >
    >
  ) => {
    try {
      const merged = {
        first_name: updates.first_name ?? firstName,
        last_name: updates.last_name ?? lastName,
        avatar: updates.avatar !== undefined ? updates.avatar : avatar,
        role: updates.role ?? role,
        use_case: updates.use_case ?? useCase,
        timezone: updates.timezone ?? timezone,
        usage_context: updates.usage_context ?? usageContext,
      };
      await upsertAccount(merged);
    } catch (error) {
      console.error("Failed to save account:", error);
    }
  };

  const getInitials = () => {
    const first = firstName.trim().charAt(0);
    const last = lastName.trim().charAt(0);
    if (first || last) return `${first}${last}`.toUpperCase();
    return null;
  };

  const handleAvatarClick = () => avatarInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatar(dataUrl);
      saveField({ avatar: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatar(null);
    saveField({ avatar: null });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">
          Your profile helps personalize your experience. All data is stored
          locally on your device.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="relative group flex items-center justify-center size-20 rounded-full bg-slate-100 border-2 border-slate-200 hover:border-primary/50 transition-colors overflow-hidden"
          >
            {avatar ? (
              <>
                <img
                  src={avatar}
                  alt="Profile"
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="size-6 text-white" />
                </div>
              </>
            ) : getInitials() ? (
              <span className="text-2xl font-bold text-slate-400">
                {getInitials()}
              </span>
            ) : (
              <User className="size-10 text-slate-400" />
            )}
          </button>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="text-sm font-medium text-primary hover:underline"
            >
              {avatar ? "Change photo" : "Add photo"}
            </button>
            {avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-sm text-slate-500 hover:text-red-600 text-left"
              >
                Remove photo
              </button>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </section>

      <hr className="border-slate-100" />

      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              First name
            </label>
            <Input
              className={INPUT_STYLES}
              placeholder="e.g. Alex"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => saveField({ first_name: firstName || null })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Last name
            </label>
            <Input
              className={INPUT_STYLES}
              placeholder="e.g. Smith"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => saveField({ last_name: lastName || null })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Role
            </label>
            <Input
              className={INPUT_STYLES}
              placeholder="e.g. Engineer, Researcher, PM"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onBlur={() => saveField({ role: role || null })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Primary use case
            </label>
            <GenericSelect
              items={USE_CASE_OPTIONS}
              getItemId={(item) => item}
              getItemLabel={(item) => item}
              onSelect={(item) => {
                setUseCase(item);
                saveField({ use_case: item || null });
              }}
              placeholder="Select..."
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          What best describes how you use this app?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {USAGE_CONTEXT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setUsageContext(opt.value);
                saveField({ usage_context: opt.value });
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                usageContext === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <span
                className={
                  usageContext === opt.value ? "text-primary" : "text-slate-500"
                }
              >
                {opt.icon}
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  usageContext === opt.value ? "text-primary" : "text-slate-600"
                }`}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-xs">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Your timezone
          </label>
          <GenericSelect
            items={TIMEZONE_OPTIONS}
            getItemId={(item) => item}
            getItemLabel={(item) => item.replace(/_/g, " ")}
            onSelect={(item) => {
              setTimezone(item);
              saveField({ timezone: item || null });
            }}
            placeholder="Select timezone..."
          />
        </div>
      </section>
    </div>
  );
}

export default Account;
