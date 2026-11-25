"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import {
  updateBuyerProfileAction,
  requestEmailChangeAction,
  requestReauthenticationCodeAction,
  changeBuyerPasswordAction,
  sendBuyerPasswordRecoveryEmailAction,
  sendMagicLoginLinkAction,
  signOutOtherDevicesAction,
  signOutAllDevicesAction,
} from "./actions";
import { signOut, resendVerificationEmail } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  Moon,
  Monitor,
  User,
  MapPin,
  Lock,
  Mail,
  Store,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Link2,
  Laptop,
  Send,
  Copy,
  Trash2,
  RefreshCw,
} from "lucide-react";

const ABUJA_DISTRICTS = [
  "Wuse 2",
  "Gwarinpa",
  "Maitama",
  "Banex / Wuse",
  "Garki",
  "Utako",
  "Jabi",
  "Asokoro",
  "Lugbe",
  "Kubwa",
  "Lokogoma",
  "Central Area",
];

interface AuthInfoProps {
  emailConfirmedAt: string | null;
  newEmail: string | null;
  lastSignInAt: string | null;
  createdAt: string | null;
  providers: string[];
}

interface EnrolledFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at?: string;
}

export function BuyerSettingsClient({
  user,
  profile,
  authInfo,
}: {
  user: { id: string; email: string } | null;
  profile: any;
  authInfo?: AuthInfoProps;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Profile State
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Email Change & Verification State
  const [emailLoading, setEmailLoading] = useState(false);
  const [resendVerifyLoading, setResendVerifyLoading] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(
    authInfo?.newEmail || null,
  );
  const [emailMsg, setEmailMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Connected Providers State
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [providerMsg, setProviderMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password, Reauthentication & Magic Link State
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);
  const [showReauthInput, setShowReauthInput] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Two-Factor Authentication (TOTP MFA) State
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaFactors, setMfaFactors] = useState<EnrolledFactor[]>([]);
  const [enrollingMfa, setEnrollingMfa] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [verifyingMfa, setVerifyingMfa] = useState(false);
  const [removingFactorId, setRemovingFactorId] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [mfaMsg, setMfaMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sessions State
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionMsg, setSessionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadMfaFactors = useCallback(async () => {
    if (!user) {
      setMfaLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        const verifiedTotp = (data.totp || []).filter(
          (f: any) => f.status === "verified",
        );
        setMfaFactors(verifiedTotp);
      }
    } catch {}
    setMfaLoading(false);
  }, [user]);

  useEffect(() => {
    setMounted(true);
    loadMfaFactors();
  }, [loadMfaFactors]);

  const isSeller =
    profile?.role === "seller" ||
    profile?.is_seller === true ||
    Boolean(profile?.business_name);

  const providers = authInfo?.providers || ["email"];
  const hasGoogleLinked = providers.includes("google");
  const hasEmailPassword = providers.includes("email");
  const isEmailConfirmed = Boolean(authInfo?.emailConfirmedAt);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateBuyerProfileAction(formData);

    setProfileLoading(false);
    if (res?.error) {
      setProfileMsg({ type: "error", text: res.error });
    } else if (res?.success) {
      setProfileMsg({ type: "success", text: res.success });
    }
  }

  async function handleEmailChangeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg(null);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    const res = await requestEmailChangeAction(formData);

    setEmailLoading(false);
    if (res?.error) {
      setEmailMsg({ type: "error", text: res.error });
    } else if (res?.success) {
      setEmailMsg({ type: "success", text: res.success });
      if (res.pendingEmail) setPendingNewEmail(res.pendingEmail);
      formEl.reset();
    }
  }

  async function handleResendConfirmation() {
    if (!user?.email) return;
    setResendVerifyLoading(true);
    setEmailMsg(null);
    const res = await resendVerificationEmail(user.email);
    setResendVerifyLoading(false);
    if (res?.error) {
      setEmailMsg({ type: "error", text: res.error });
    } else {
      setEmailMsg({
        type: "success",
        text: `Verification email resent to ${user.email}.`,
      });
    }
  }

  async function handleLinkGoogle() {
    setLinkingGoogle(true);
    setProviderMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        },
      });
      if (error) {
        setProviderMsg({ type: "error", text: error.message });
        setLinkingGoogle(false);
      }
    } catch {
      setProviderMsg({
        type: "error",
        text: "Could not start Google account linking. Ensure Manual Linking is enabled in Supabase Auth settings.",
      });
      setLinkingGoogle(false);
    }
  }

  async function handleRequestReauthCode() {
    setReauthLoading(true);
    setPwMsg(null);
    const res = await requestReauthenticationCodeAction();
    setReauthLoading(false);
    if (res?.error) {
      setPwMsg({ type: "error", text: res.error });
      return;
    }
    setShowReauthInput(true);
    setPwMsg({ type: "success", text: res.success || "Security code sent." });
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwLoading(true);
    setPwMsg(null);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    const res = await changeBuyerPasswordAction(formData);

    setPwLoading(false);
    if (res?.error) {
      setPwMsg({ type: "error", text: res.error });
      if ("requiresReauth" in res && res.requiresReauth) {
        setShowReauthInput(true);
      }
    } else if (res?.success) {
      setPwMsg({ type: "success", text: res.success });
      setShowReauthInput(false);
      formEl.reset();
    }
  }

  async function handleSendRecoveryEmail() {
    setRecoveryLoading(true);
    setPwMsg(null);
    const res = await sendBuyerPasswordRecoveryEmailAction(user?.email);
    setRecoveryLoading(false);
    if (res?.error) {
      setPwMsg({ type: "error", text: res.error });
    } else if (res?.success) {
      setPwMsg({ type: "success", text: res.success });
    }
  }

  async function handleSendMagicLink() {
    setMagicLinkLoading(true);
    setPwMsg(null);
    const res = await sendMagicLoginLinkAction();
    setMagicLinkLoading(false);
    if (res?.error) {
      setPwMsg({ type: "error", text: res.error });
    } else if (res?.success) {
      setPwMsg({ type: "success", text: res.success });
    }
  }

  async function handleStartMfaEnroll() {
    setEnrollingMfa(true);
    setMfaMsg(null);
    setMfaCode("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `BenchTech Authenticator (${new Date().toLocaleDateString("en-NG")})`,
      });

      if (error || !data) {
        setMfaMsg({
          type: "error",
          text: error?.message || "Could not start two-factor setup.",
        });
        setEnrollingMfa(false);
        return;
      }

      setMfaSetup({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch {
      setMfaMsg({
        type: "error",
        text: "Unable to initialize authenticator setup.",
      });
    }
    setEnrollingMfa(false);
  }

  async function handleVerifyMfaEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaSetup || mfaCode.length !== 6) return;

    setVerifyingMfa(true);
    setMfaMsg(null);

    try {
      const supabase = createClient();
      const { data: challengeData, error: challengeErr } =
        await supabase.auth.mfa.challenge({
          factorId: mfaSetup.factorId,
        });

      if (challengeErr || !challengeData) {
        setMfaMsg({
          type: "error",
          text: challengeErr?.message || "Could not create MFA challenge.",
        });
        setVerifyingMfa(false);
        return;
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaSetup.factorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyErr) {
        setMfaMsg({
          type: "error",
          text: verifyErr.message || "Invalid 6-digit authenticator code.",
        });
        setVerifyingMfa(false);
        return;
      }

      setMfaSetup(null);
      setMfaCode("");
      setMfaMsg({
        type: "success",
        text: "Two-factor authentication is now active on your account.",
      });
      await loadMfaFactors();
    } catch {
      setMfaMsg({
        type: "error",
        text: "Verification failed. Please try again.",
      });
    }
    setVerifyingMfa(false);
  }

  async function handleCancelMfaEnroll() {
    if (!mfaSetup) return;
    try {
      const supabase = createClient();
      await supabase.auth.mfa.unenroll({ factorId: mfaSetup.factorId });
    } catch {}
    setMfaSetup(null);
    setMfaCode("");
  }

  async function handleRemoveMfaFactor(factorId: string) {
    setRemovingFactorId(factorId);
    setMfaMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        setMfaMsg({ type: "error", text: error.message });
      } else {
        setMfaMsg({
          type: "success",
          text: "Authenticator device removed from your account.",
        });
        await loadMfaFactors();
      }
    } catch {
      setMfaMsg({
        type: "error",
        text: "Could not remove authenticator device.",
      });
    }
    setRemovingFactorId(null);
  }

  async function handleSignOutOtherDevices() {
    setSessionLoading(true);
    setSessionMsg(null);
    const res = await signOutOtherDevicesAction();
    setSessionLoading(false);
    if (res?.error) {
      setSessionMsg({ type: "error", text: res.error });
    } else if (res?.success) {
      setSessionMsg({ type: "success", text: res.success });
    }
  }

  function handleCopySecret(secret: string) {
    navigator.clipboard?.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & Verification Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Account Settings &amp; Security
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your profile, sign-in methods, email verification, two-factor
            security, and sessions.
          </p>
        </div>

        {user && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={`text-xs font-bold py-1 px-3 rounded-xl ${
                isEmailConfirmed
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {isEmailConfirmed ? "Email Verified" : "Email Unverified"}
            </Badge>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold py-1 px-3 rounded-xl">
              {user.email}
            </Badge>
          </div>
        )}
      </div>

      {/* 1. DISPLAY APPEARANCE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm lg:text-base font-black text-slate-900 dark:text-white">
            Display Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose between Light Mode, Dark Mode, or follow your device&apos;s
            system setting.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light", label: "Light Mode", icon: Sun },
            { id: "dark", label: "Dark Mode", icon: Moon },
            { id: "system", label: "System Default", icon: Monitor },
          ].map((option) => {
            const Icon = option.icon;
            const isSelected = mounted && theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? "border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5" />
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <span className="text-xs lg:text-[13px] font-bold block">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PERSONAL & ABUJA DELIVERY DETAILS */}
      {user && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm lg:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Personal &amp; Default Abuja Delivery Info
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Used to pre-fill your contact and delivery location during
              checkout.
            </p>
          </div>

          {profileMsg && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                profileMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
              }`}
            >
              {profileMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  defaultValue={profile?.full_name || ""}
                  required
                  placeholder="Your full name"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs lg:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number (For Delivery Courier OTP)
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={profile?.phone || ""}
                  placeholder="080 1234 5678"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs lg:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Abuja District
                </label>
                <select
                  name="district"
                  defaultValue={profile?.district || "Wuse 2"}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs lg:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ABUJA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Street / Delivery Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="streetAddress"
                    defaultValue={
                      profile?.street_address || profile?.address || ""
                    }
                    placeholder="House number, street, landmark"
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs lg:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={profileLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs lg:text-[13px] rounded-xl h-10 px-6 cursor-pointer gap-2"
              >
                {profileLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 3. EMAIL ADDRESS & CONNECTED SIGN-IN METHODS */}
      {user && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm lg:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Email Address &amp; Sign-In Methods
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your account email with confirmation, or connect Google
              Sign-In for faster login.
            </p>
          </div>

          {emailMsg && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                emailMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
              }`}
            >
              {emailMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{emailMsg.text}</span>
            </div>
          )}

          {!isEmailConfirmed && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-amber-800 dark:text-amber-200">
                Your email address ({user.email}) is not confirmed yet.
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={resendVerifyLoading}
                onClick={handleResendConfirmation}
                className="text-xs font-bold rounded-xl h-9 border-amber-300 dark:border-amber-700 gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${resendVerifyLoading ? "animate-spin" : ""}`}
                />
                <span>Resend Confirmation</span>
              </Button>
            </div>
          )}

          {pendingNewEmail && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200 font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Pending email change to <strong>{pendingNewEmail}</strong>.
                Check your inbox and click the confirmation link to complete the
                switch.
              </span>
            </div>
          )}

          {/* Change Email Form */}
          <form onSubmit={handleEmailChangeSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs lg:text-sm font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Email Address
                </label>
                <input
                  type="email"
                  name="newEmail"
                  required
                  placeholder="new-email@example.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs lg:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer gap-1.5"
                >
                  {emailLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Update</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Connected Providers */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Connected Sign-In Providers
            </span>

            {providerMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  providerMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700"
                    : "bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700 dark:text-red-300"
                }`}
              >
                {providerMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Email &amp; Password
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {hasEmailPassword
                        ? "Active sign-in method"
                        : "Set a password below to enable"}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`text-[10px] font-bold ${
                    hasEmailPassword
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {hasEmailPassword ? "Enabled" : "Not Set"}
                </Badge>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Link2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Google Account
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {hasGoogleLinked
                        ? "Connected for 1-click sign-in"
                        : "Not linked yet"}
                    </p>
                  </div>
                </div>
                {hasGoogleLinked ? (
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                    Connected
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={linkingGoogle}
                    onClick={handleLinkGoogle}
                    className="h-8 text-[11px] font-bold rounded-lg border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {linkingGoogle ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Link Google"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PASSWORD, REAUTHENTICATION & PASSWORDLESS SIGN-IN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm lg:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Password, Reauthentication &amp; Recovery
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your password with optional 6-digit email reauthentication,
              request recovery, or send a one-time sign-in link.
            </p>
          </div>
        </div>

        {pwMsg && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              pwMsg.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
            }`}
          >
            {pwMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{pwMsg.text}</span>
          </div>
        )}

        {user && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    minLength={6}
                    required
                    placeholder="Minimum 6 characters"
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs lg:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  minLength={6}
                  required
                  placeholder="Re-enter new password"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs lg:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {showReauthInput && (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                <label className="block text-xs font-bold text-blue-900 dark:text-blue-200">
                  6-Digit Reauthentication Security Code (Sent to {user.email})
                </label>
                <input
                  type="text"
                  name="nonce"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter security code"
                  className="w-full sm:w-64 h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 font-mono text-sm font-black tracking-[0.2em] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={reauthLoading}
                onClick={handleRequestReauthCode}
                className="text-xs font-bold rounded-xl h-10 px-4 border-slate-200 dark:border-slate-700 cursor-pointer gap-1.5"
              >
                {reauthLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>Send 6-Digit Security Code</span>
              </Button>

              <Button
                type="submit"
                disabled={pwLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs lg:text-[13px] rounded-xl h-10 px-6 cursor-pointer gap-2"
              >
                {pwLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </Button>
            </div>
          </form>
        )}

        {/* Recovery & Magic Link Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Password Recovery Link</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Send a reset link from admin@shopbenchtech.com if you forgot
                your password.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={recoveryLoading}
              onClick={handleSendRecoveryEmail}
              className="w-full text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-700 cursor-pointer gap-1.5"
            >
              {recoveryLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              <span>Send Recovery Link</span>
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>One-Time Sign-In Link / OTP</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Email yourself a passwordless sign-in link and code for logging
                in on another device.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={magicLinkLoading}
              onClick={handleSendMagicLink}
              className="w-full text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-700 cursor-pointer gap-1.5"
            >
              {magicLinkLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              <span>Send One-Time Link</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 5. TWO-FACTOR AUTHENTICATION (AUTHENTICATOR APP / MFA) */}
      {user && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm lg:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Two-Factor Authentication (Authenticator App)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Protect your account, wallet, and orders with a 6-digit code
                from Google Authenticator, Authy, or 1Password.
              </p>
            </div>

            <Badge
              className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${
                mfaFactors.length > 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {mfaFactors.length > 0 ? "2FA Active" : "Not Configured"}
            </Badge>
          </div>

          {mfaMsg && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                mfaMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
              }`}
            >
              {mfaMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{mfaMsg.text}</span>
            </div>
          )}

          {mfaLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking authenticator status...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Enrolled Factors List */}
              {mfaFactors.length > 0 && (
                <div className="space-y-2.5">
                  {mfaFactors.map((factor) => (
                    <div
                      key={factor.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {factor.friendly_name || "Authenticator App (TOTP)"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Active 6-digit verification app
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={removingFactorId === factor.id}
                        onClick={() => handleRemoveMfaFactor(factor.id)}
                        className="text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl h-8 px-3 gap-1 cursor-pointer"
                      >
                        {removingFactorId === factor.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Enrollment Step (QR Code + 6-Digit Verify) */}
              {mfaSetup ? (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-900 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-4 flex justify-center">
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mfaSetup.qrCode}
                          alt="Two-Factor QR Code"
                          className="w-40 h-40"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-8 space-y-3 text-xs">
                      <p className="font-black text-sm text-slate-900 dark:text-white">
                        1. Scan QR Code in Your Authenticator App
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        Open Google Authenticator, Authy, or Microsoft
                        Authenticator and scan this QR code, or enter the manual
                        key below:
                      </p>

                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <code className="flex-1 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 break-all">
                          {mfaSetup.secret}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopySecret(mfaSetup.secret)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 cursor-pointer shrink-0"
                          title="Copy manual key"
                        >
                          {secretCopied ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <form
                        onSubmit={handleVerifyMfaEnroll}
                        className="flex flex-wrap items-center gap-2 pt-1"
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={mfaCode}
                          onChange={(e) =>
                            setMfaCode(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="6-digit code"
                          className="h-10 w-36 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm font-black tracking-widest text-center"
                        />
                        <Button
                          type="submit"
                          disabled={verifyingMfa || mfaCode.length !== 6}
                          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer gap-1.5"
                        >
                          {verifyingMfa && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          )}
                          <span>Verify &amp; Activate</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelMfaEnroll}
                          className="h-10 px-3 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={enrollingMfa}
                  onClick={handleStartMfaEnroll}
                  className="text-xs font-bold rounded-xl h-10 px-4 border-slate-200 dark:border-slate-700 cursor-pointer gap-2"
                >
                  {enrollingMfa ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  )}
                  <span>
                    {mfaFactors.length > 0
                      ? "Add Another Authenticator App"
                      : "Set Up Authenticator App (2FA)"}
                  </span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. ACTIVE SESSIONS & DEVICE SECURITY */}
      {user && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm lg:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              Active Sessions &amp; Devices
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sign out of lost or shared browsers immediately if you notice
              unfamiliar activity.
            </p>
          </div>

          {sessionMsg && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                sessionMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
              }`}
            >
              {sessionMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{sessionMsg.text}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Current Session
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Last sign-in:{" "}
                {authInfo?.lastSignInAt
                  ? new Date(authInfo.lastSignInAt).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Active now"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={sessionLoading}
                onClick={handleSignOutOtherDevices}
                className="text-xs font-bold rounded-xl h-9 px-3.5 border-slate-200 dark:border-slate-700 cursor-pointer gap-1.5"
              >
                {sessionLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Sign Out Other Devices</span>
              </Button>

              <form action={signOutAllDevicesAction}>
                <Button
                  type="submit"
                  variant="outline"
                  className="text-xs font-bold rounded-xl h-9 px-3.5 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Everywhere</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 7. SELLER WORKSPACE & SIGN OUT */}
      {user && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs lg:text-sm font-black text-slate-900 dark:text-white">
                {isSeller
                  ? "Seller Account Active"
                  : "Want to Sell Hardware on BenchTech?"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isSeller
                  ? "Manage your listings, orders, and payouts in the Seller Hub."
                  : "Complete your one-time Individual or Business verification to start listing."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href={isSeller ? "/seller/dashboard" : "/seller/onboarding"}>
              <Button
                variant="outline"
                className="text-xs font-bold rounded-xl h-9 px-4 border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {isSeller ? "Open Seller Hub" : "Become a Seller"}
              </Button>
            </Link>

            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                className="text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl h-9 px-3 gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
