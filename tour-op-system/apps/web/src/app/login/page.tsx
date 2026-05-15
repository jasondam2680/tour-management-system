'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { AxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tour OP System</h1>
          <p className="text-slate-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Server Error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900
                  placeholder:text-slate-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:bg-slate-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900
                  placeholder:text-slate-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:bg-slate-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700
                text-white font-medium rounded-lg text-sm
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Admin', email: 'admin@demotourop.com' },
                { role: 'Sales', email: 'sales@demotourop.com' },
                { role: 'OP', email: 'op@demotourop.com' },
                { role: 'Finance', email: 'finance@demotourop.com' },
              ].map((acc) => (
                <div
                  key={acc.role}
                  className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2"
                >
                  <span className="font-medium text-slate-700">{acc.role}:</span>
                  <br />
                  <span className="text-slate-400">{acc.email}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Admin pass: <code className="bg-slate-100 px-1 rounded">Admin@123456</code>
              {' · '}Others: <code className="bg-slate-100 px-1 rounded">Password@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
