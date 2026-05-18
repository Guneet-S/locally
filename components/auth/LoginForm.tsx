"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/app/actions/auth";

interface Props {
  role: "shopper" | "shoppee";
}

export default function LoginForm({ role }: Props) {
  const isShoppee = role === "shoppee";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const result = await loginAction({ ...data, role });
    if (result?.error) toast.error(result.error);
  };

  if (isShoppee) {
    return (
      <div className="flex min-h-screen flex-col bg-shoppee-bg px-4 pb-8 pt-16 font-[family-name:var(--font-dm-sans)]">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-shoppee-primary">
            Locally
          </h1>
          <p className="mt-1 text-sm italic text-shoppee-textSecondary">
            Discover fashion near you
          </p>
        </div>

        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-shoppee-textPrimary">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-shoppee-textSecondary">
            Sign in to explore stores near you
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <input
              {...register("email")}
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border border-shoppee-border bg-white px-3 py-2.5 text-sm text-shoppee-textPrimary placeholder:text-shoppee-textSecondary focus:border-shoppee-primary focus:outline-none focus:ring-1 focus:ring-shoppee-primary"
            />
            {errors.email && (
              <p className="mt-1 text-meta text-danger">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className="w-full rounded-lg border border-shoppee-border bg-white px-3 py-2.5 text-sm text-shoppee-textPrimary placeholder:text-shoppee-textSecondary focus:border-shoppee-primary focus:outline-none focus:ring-1 focus:ring-shoppee-primary"
            />
            {errors.password && (
              <p className="mt-1 text-meta text-danger">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Link href="/forgot" className="text-sm text-shoppee-primary">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg bg-shoppee-primary py-3 text-sm font-semibold text-white hover:bg-shoppee-primaryHover disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-auto pt-8 text-center text-sm text-shoppee-textSecondary">
          No account?{" "}
          <Link href={`/signup?role=${role}`} className="font-semibold text-shoppee-primary">
            Sign up
          </Link>
        </p>
      </div>
    );
  }

  // Shopper (purple) — original design preserved
  return (
    <div className="flex min-h-screen flex-col px-4 pb-8 pt-16">
      <div className="mb-8">
        <h1 className="text-h1 text-text-primary">Welcome back</h1>
        <p className="mt-1 text-body text-text-secondary">Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Email"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.email && (
            <p className="mt-1 text-meta text-danger">{errors.email.message}</p>
          )}
        </div>

        <div>
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.password && (
            <p className="mt-1 text-meta text-danger">{errors.password.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Link href="/forgot" className="text-meta text-shopper-primary">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-[10px] bg-shopper-primary py-3 text-button text-white disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-auto pt-8 text-center text-meta text-text-secondary">
        No account?{" "}
        <Link href={`/signup?role=${role}`} className="text-shopper-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}
