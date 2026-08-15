"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../src/hooks/useAuth";

type AuthMode =
  | "login"
  | "register";

export default function Home() {
  const router = useRouter();

  const {
    isLoading,
    isAuthenticated,
    login,
    register,
  } = useAuth();

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    authError,
    setAuthError,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated
    ) {
      router.replace(
        "/documents",
      );
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
  ]);

  function switchMode(
    nextMode: AuthMode,
  ) {
    setMode(nextMode);

    setAuthError("");
    setPassword("");
    setConfirmPassword("");

    if (
      nextMode === "login"
    ) {
      setName("");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedEmail =
      email.trim();

    const trimmedName =
      name.trim();

    if (!trimmedEmail) {
      setAuthError(
        "Enter your email address.",
      );
      return;
    }

    if (!password) {
      setAuthError(
        "Enter your password.",
      );
      return;
    }

    if (
      mode === "register"
    ) {
      if (!trimmedName) {
        setAuthError(
          "Enter your name.",
        );
        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setAuthError(
          "Passwords do not match.",
        );
        return;
      }
    }

    setAuthError("");
    setIsSubmitting(true);

    try {
      if (
        mode === "login"
      ) {
        await login(
          trimmedEmail,
          password,
        );
      } else {
        await register(
          trimmedName,
          trimmedEmail,
          password,
        );
      }

      router.replace(
        "/documents",
      );
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : mode === "login"
            ? "Unable to sign in"
            : "Unable to create account",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (
    isLoading ||
    isAuthenticated
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f12]">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />

          <span className="text-[13px] text-zinc-500">
            Opening workspace…
          </span>
        </div>
      </main>
    );
  }

  const isRegister =
    mode === "register";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d0f12] text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-[100px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize:
              "64px 64px",
          }}
        />
      </div>

      <header className="relative z-10 flex h-16 items-center border-b border-white/[0.06] px-6 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-zinc-100 text-[11px] font-bold text-zinc-950">
            C
          </div>

          <span className="text-[14px] font-semibold tracking-[-0.02em]">
            Collab
          </span>
        </div>

        <div className="ml-auto hidden items-center gap-2 text-[12px] text-zinc-600 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

          Real-time workspace
        </div>
      </header>

      <div className="relative z-10 grid min-h-[calc(100vh-64px)] lg:grid-cols-[1fr_520px]">
        <section className="hidden border-r border-white/[0.06] lg:flex lg:items-center">
          <div className="mx-auto w-full max-w-[620px] px-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
              Collaborative workspace
            </p>

            <h1 className="mt-5 max-w-[560px] text-[48px] font-semibold leading-[1.05] tracking-[-0.045em] text-zinc-100 xl:text-[56px]">
              Write together.
              <br />
              Stay in sync.
            </h1>

            <p className="mt-6 max-w-[480px] text-[15px] leading-7 text-zinc-500">
              A focused workspace for creating,
              editing, and sharing documents with
              your team in real time.
            </p>

            <div className="mt-12 grid max-w-[500px] grid-cols-2 gap-x-10 gap-y-8">
              <Feature
                number="01"
                title="Live collaboration"
                description="Work together without overwriting each other's changes."
              />

              <Feature
                number="02"
                title="Always saved"
                description="Your document stays synchronized while you work."
              />

              <Feature
                number="03"
                title="Simple sharing"
                description="Give people edit or view access when you need to."
              />

              <Feature
                number="04"
                title="Focused writing"
                description="A clean workspace designed to stay out of your way."
              />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[380px]">
            <div className="mb-8 flex border-b border-white/[0.06]">
              <button
                type="button"
                onClick={() =>
                  switchMode(
                    "login",
                  )
                }
                className={[
                  "relative flex-1 pb-3 text-[12px] font-medium transition-colors",
                  mode === "login"
                    ? "text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-400",
                ].join(" ")}
              >
                Sign in

                {mode ===
                  "login" && (
                  <span className="absolute inset-x-0 bottom-0 h-px bg-zinc-200" />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  switchMode(
                    "register",
                  )
                }
                className={[
                  "relative flex-1 pb-3 text-[12px] font-medium transition-colors",
                  mode ===
                  "register"
                    ? "text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-400",
                ].join(" ")}
              >
                Create account

                {mode ===
                  "register" && (
                  <span className="absolute inset-x-0 bottom-0 h-px bg-zinc-200" />
                )}
              </button>
            </div>

            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.035em] text-zinc-100">
                {isRegister
                  ? "Create your workspace"
                  : "Welcome back"}
              </h2>

              <p className="mt-2 text-[13px] leading-5 text-zinc-500">
                {isRegister
                  ? "Create an account and start collaborating."
                  : "Sign in to continue to your workspace."}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8"
            >
              {isRegister && (
                <div>
                  <label
                    htmlFor="name"
                    className="text-[12px] font-medium text-zinc-400"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(
                        event.target.value,
                      );

                      if (
                        authError
                      ) {
                        setAuthError(
                          "",
                        );
                      }
                    }}
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    className="mt-2 h-11 w-full rounded-[8px] border border-white/[0.09] bg-[#15181d] px-3.5 text-[13px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 hover:border-white/[0.13] focus:border-white/[0.22] focus:bg-[#171a20]"
                  />
                </div>
              )}

              <div
                className={
                  isRegister
                    ? "mt-5"
                    : ""
                }
              >
                <label
                  htmlFor="email"
                  className="text-[12px] font-medium text-zinc-400"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value,
                    );

                    if (
                      authError
                    ) {
                      setAuthError(
                        "",
                      );
                    }
                  }}
                  required
                  autoComplete="email"
                  autoFocus={
                    !isRegister
                  }
                  placeholder="you@example.com"
                  className="mt-2 h-11 w-full rounded-[8px] border border-white/[0.09] bg-[#15181d] px-3.5 text-[13px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 hover:border-white/[0.13] focus:border-white/[0.22] focus:bg-[#171a20]"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="password"
                  className="text-[12px] font-medium text-zinc-400"
                >
                  Password
                </label>

                <div className="relative mt-2">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) => {
                      setPassword(
                        event.target.value,
                      );

                      if (
                        authError
                      ) {
                        setAuthError(
                          "",
                        );
                      }
                    }}
                    required
                    autoComplete={
                      isRegister
                        ? "new-password"
                        : "current-password"
                    }
                    placeholder={
                      isRegister
                        ? "Create a password"
                        : "Enter your password"
                    }
                    className="h-11 w-full rounded-[8px] border border-white/[0.09] bg-[#15181d] px-3.5 pr-16 text-[13px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 hover:border-white/[0.13] focus:border-white/[0.22] focus:bg-[#171a20]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-zinc-600 transition-colors hover:text-zinc-300"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="mt-5">
                  <label
                    htmlFor="confirm-password"
                    className="text-[12px] font-medium text-zinc-400"
                  >
                    Confirm password
                  </label>

                  <input
                    id="confirm-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(event) => {
                      setConfirmPassword(
                        event.target
                          .value,
                      );

                      if (
                        authError
                      ) {
                        setAuthError(
                          "",
                        );
                      }
                    }}
                    required
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    className="mt-2 h-11 w-full rounded-[8px] border border-white/[0.09] bg-[#15181d] px-3.5 text-[13px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 hover:border-white/[0.13] focus:border-white/[0.22] focus:bg-[#171a20]"
                  />
                </div>
              )}

              {authError && (
                <div className="mt-4 rounded-[8px] border border-red-500/20 bg-red-500/[0.07] px-3 py-2.5">
                  <p className="text-[12px] leading-5 text-red-300">
                    {authError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting
                }
                className="mt-6 flex h-11 w-full items-center justify-center rounded-[8px] bg-zinc-100 px-4 text-[13px] font-medium text-zinc-950 transition-all hover:bg-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />

                    {isRegister
                      ? "Creating account…"
                      : "Signing in…"}
                  </span>
                ) : isRegister ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-[11px] leading-5 text-zinc-700">
              {isRegister
                ? "By creating an account, you can create, share, and collaborate on documents."
                : "Your session is securely restored when you return."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

interface FeatureProps {
  number: string;
  title: string;
  description: string;
}

function Feature({
  number,
  title,
  description,
}: FeatureProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-zinc-700">
          {number}
        </span>

        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      <h3 className="mt-3 text-[13px] font-medium text-zinc-300">
        {title}
      </h3>

      <p className="mt-1.5 text-[11px] leading-5 text-zinc-600">
        {description}
      </p>
    </div>
  );
}