"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import LoginLayout from "@/components/LoginLayout";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Get the callback URL from query parameters
  const callbackUrl = (router.query.callbackUrl as string) || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError("Invalid credentials");
      setIsLoading(false);
    } else {
      // Redirect will be handled by the useEffect above
    }
  };

  // Show loading if checking authentication status
  if (status === "loading") {
    return (
      <LoginLayout>
        <div className="hero min-h-screen bg-base-200">
          <div className="hero-content text-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </LoginLayout>
    );
  }

  // Don't render login form if already authenticated
  if (status === "authenticated") {
    return (
      <LoginLayout>
        <div className="hero min-h-screen bg-base-200">
          <div className="hero-content text-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout>
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content flex-col lg:flex-row-reverse max-w-6xl">
          <div className="text-center lg:text-left lg:w-1/2">
            <h1 className="text-5xl font-bold text-primary mb-4">
              Welcome to Nolingo
            </h1>
            <p className="py-6 text-lg">
              Your language learning journey starts here. Sign in to access your
              account, practice with image descriptions, and connect with fellow
              learners.
            </p>
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📸</span>
                <span>Practice describing images in your target language</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <span>Engage with posts and replies from other learners</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌍</span>
                <span>Learn languages through visual context</span>
              </div>
            </div>
          </div>
          <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100 lg:w-1/2">
            <form className="card-body" onSubmit={handleSubmit}>
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">Sign In</h2>
                <p className="text-sm text-base-content/70">
                  Enter your credentials to continue
                </p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="input input-bordered"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="input input-bordered"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="alert alert-error">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-control mt-6">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </LoginLayout>
  );
}
