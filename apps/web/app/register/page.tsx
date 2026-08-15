"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAuth } from "../../src/hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerError, setRegisterError] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleRegister(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setRegisterError("");
    setIsSubmitting(true);

    try {
      await register(name, email, password);
      window.location.href = "/";
    } catch (error) {
      setRegisterError(
        error instanceof Error
          ? error.message
          : "Registration failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow"
      >
        <h1 className="text-3xl font-bold text-zinc-900">
          Create account
        </h1>

        <p className="mt-2 text-zinc-600">
          Create an account to start collaborating.
        </p>

        <div className="mt-6">
          <label
            htmlFor="name"
            className="text-sm font-medium text-zinc-800"
          >
            Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            required
            autoComplete="name"
            className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-zinc-500"
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="email"
            className="text-sm font-medium text-zinc-800"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
            autoComplete="email"
            className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-zinc-500"
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-800"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-zinc-500"
          />
        </div>

        {registerError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {registerError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Creating account..."
            : "Create account"}
        </button>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link
            href="/"
            className="font-medium text-zinc-900 underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}