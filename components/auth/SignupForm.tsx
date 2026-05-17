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
  const isPurple = role === "shopper";
  const primaryBg = isPurple ? "bg-shopper-primary" : "bg-shoppee-primary";
  const linkColor = isPurple ? "text-shopper-primary" : "text-shoppee-primary";

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
          className={`mt-2 w-full rounded-[10px] py-3 text-button text-white disabled:opacity-60 ${primaryBg}`}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-auto pt-8 text-center">
        <p className="text-meta text-text-secondary">
          Already have an account?{" "}
          <Link href={`/login?role=${role}`} className={linkColor}>
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
