"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signupAction } from "@/app/actions/auth";

interface Props {
  role: "shopper" | "shoppee";
}

export default function SignupForm({ role }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    const result = await signupAction({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || undefined,
      password: data.password,
      role,
    });
    if (result?.error) toast.error(result.error);
  };

  if (role === "shoppee") {
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
            Create account
          </h2>
          <p className="mt-1 text-sm text-shoppee-textSecondary">
            Join to explore stores in your area
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <input
              {...register("full_name")}
              type="text"
              placeholder="Full name"
              className="w-full rounded-lg border border-shoppee-border bg-white px-3 py-2.5 text-sm text-shoppee-textPrimary placeholder:text-shoppee-textSecondary focus:border-shoppee-primary focus:outline-none focus:ring-1 focus:ring-shoppee-primary"
            />
            {errors.full_name && (
              <p className="mt-1 text-meta text-danger">
                {errors.full_name.message}
              </p>
            )}
          </div>

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
              {...register("phone")}
              type="tel"
              placeholder="Phone (optional)"
              className="w-full rounded-lg border border-shoppee-border bg-white px-3 py-2.5 text-sm text-shoppee-textPrimary placeholder:text-shoppee-textSecondary focus:border-shoppee-primary focus:outline-none focus:ring-1 focus:ring-shoppee-primary"
            />
          </div>

          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className="w-full rounded-lg border border-shoppee-border bg-white px-3 py-2.5 text-sm text-shoppee-textPrimary placeholder:text-shoppee-textSecondary focus:border-shoppee-primary focus:outline-none focus:ring-1 focus:ring-shoppee-primary"
            />
            {errors.password && (
              <p className="mt-1 text-meta text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...register("confirm_password")}
              type="password"
              placeholder="Confirm password"
              className="w-full rounded-lg border border-shoppee-border bg-white px-3 py-2.5 text-sm text-shoppee-textPrimary placeholder:text-shoppee-textSecondary focus:border-shoppee-primary focus:outline-none focus:ring-1 focus:ring-shoppee-primary"
            />
            {errors.confirm_password && (
              <p className="mt-1 text-meta text-danger">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg bg-shoppee-primary py-3 text-sm font-semibold text-white hover:bg-shoppee-primaryHover disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-auto pt-8 text-center">
          <p className="text-sm text-shoppee-textSecondary">
            Already have an account?{" "}
            <Link
              href={`/login?role=${role}`}
              className="font-semibold text-shoppee-primary"
            >
              Login
            </Link>
          </p>
          <p className="mt-2 text-xs text-shoppee-textSecondary">
            By signing up you agree to our Terms &amp; Privacy
          </p>
        </div>
      </div>
    );
  }

  // Shopper signup (not currently reachable — invite-only via role page)
  return (
    <div className="flex min-h-screen flex-col px-4 pb-8 pt-16">
      <div className="mb-8">
        <h1 className="text-h1 text-text-primary">Create your account</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <input
            {...register("full_name")}
            type="text"
            placeholder="Full name"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.full_name && (
            <p className="mt-1 text-meta text-danger">
              {errors.full_name.message}
            </p>
          )}
        </div>

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
            {...register("phone")}
            type="tel"
            placeholder="Phone (optional)"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
        </div>

        <div>
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.password && (
            <p className="mt-1 text-meta text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <input
            {...register("confirm_password")}
            type="password"
            placeholder="Confirm password"
            className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
          />
          {errors.confirm_password && (
            <p className="mt-1 text-meta text-danger">
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-[10px] bg-shopper-primary py-3 text-button text-white disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-auto pt-8 text-center">
        <p className="text-meta text-text-secondary">
          Already have an account?{" "}
          <Link href={`/login?role=${role}`} className="text-shopper-primary">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-meta text-text-tertiary">
          By signing up you agree to our Terms &amp; Privacy
        </p>
      </div>
    </div>
  );
}
