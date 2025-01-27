"use client";

import * as React from "react";
import { Link, useNavigate } from "react-router-dom"; // Correct import for React Router
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import { useUserData } from "@/UserDataContext";

// Validation schema using Zod
const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long.",
  }),
});

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>; // Ensure onLogin returns a promise
}

export function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { refetchUserData } = useUserData();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const navigate = useNavigate(); // To navigate after successful login

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setErrorMessage(null); // Reset error message

    try {
      await onLogin(values.email, values.password); // Perform the login API call
      await refetchUserData(); // Add this line to fetch user data after successful login
    } catch (error) {
      setErrorMessage("Login failed. Please check your credentials.");
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Login handler

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-400">Login to your account</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="email">
              Email
            </label>
            <Input id="email" placeholder="m@example.com" type="email" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white" htmlFor="password">
                Password
              </label>
              <Link to="/forgot-password" className="text-sm text-zinc-400 hover:text-white">
                Forgot your password?
              </Link>
            </div>
            <Input id="password" type="password" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("password")} />
            {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
          </div>

          {/* Error Message */}
          {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full bg-white text-black hover:bg-zinc-100">
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-zinc-400">Or continue with</span>
          </div>
        </div>

        {/* Social login buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" type="button" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white">
            <Icons.apple className="h-4 w-4" />
          </Button>
          <Button variant="outline" type="button" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white">
            <Icons.google className="h-4 w-4" />
          </Button>
          <Button variant="outline" type="button" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white">
            <Icons.gitHub className="h-4 w-4" />
          </Button>
        </div>

        {/* Links for Sign Up */}
        <div className="text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="underline hover:text-white">
            Sign up
          </Link>
        </div>
        <div className="text-center text-xs text-zinc-400">
          By clicking continue, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-white">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline hover:text-white">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
