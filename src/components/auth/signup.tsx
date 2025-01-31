"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate from react-router-dom

// Update the cohortNumber field to accept a string
const formSchema = z.object({
  first_name: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  last_name: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long.",
  }),
  cohort_number: z
    .string()
    .regex(/^\d+$/, {
      message: "Cohort number must be a valid number.",
    })
    .transform((val) => parseInt(val, 10)), // Transform string to integer
  jsd_number: z.string().regex(/^GEN\d+_\d+$/, {
    message: "JSD number must be in format GEN{number}_{number}",
  }),
  project_group: z.string().min(1, {
    message: "Project group is required.",
  }),
  genmate_group: z.string().min(1, {
    message: "Genmate group is required.",
  }),
  zoom_name: z.string().min(1, {
    message: "Zoom name is required.",
  }),
});

interface SignUpProps {
  onSignUp: (first_name: string, last_name: string, email: string, password: string, cohort_number: number, jsd_number: string, project_group: string, genmate_group: string, zoom_name: string) => void;
}

export function SignUp({ onSignUp }: SignUpProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      cohort_number: "", // Change default value to empty string
      jsd_number: "",
      project_group: "", // Add default value for project_group
      genmate_group: "", // Add default value for genmate_group
      zoom_name: "", // Add default value for zoom_name
    },
  });
  const navigate = useNavigate();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await onSignUp(values.first_name, values.last_name, values.email, values.password, values.cohort_number, values.jsd_number, values.project_group, values.genmate_group, values.zoom_name);
      navigate("/login");
    } catch (error) {
      console.error("Sign-up error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-gray-400">Enter your information to get started</p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="first_name">
              First Name
            </label>
            <Input id="first_name" placeholder="John" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("first_name")} />
            {form.formState.errors.first_name && <p className="text-sm text-red-500">{form.formState.errors.first_name.message}</p>}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="last_name">
              Last Name
            </label>
            <Input id="last_name" placeholder="Doe" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("last_name")} />
            {form.formState.errors.last_name && <p className="text-sm text-red-500">{form.formState.errors.last_name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="email">
              Email
            </label>
            <Input id="email" placeholder="m@example.com" type="email" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="password">
              Password
            </label>
            <Input id="password" type="password" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("password")} />
            {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
          </div>

          {/* Cohort Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="cohortNumber">
              Cohort Number
            </label>
            <Input
              id="cohortNumber"
              type="text" // Change input type to text to accept string
              disabled={isLoading}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400"
              {...form.register("cohort_number")}
            />
            {form.formState.errors.cohort_number && <p className="text-sm text-red-500">{form.formState.errors.cohort_number.message}</p>}
          </div>

          {/* JSD Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="jsdNumber">
              JSD Number
            </label>
            <Input id="jsdNumber" placeholder="GEN9_17" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("jsd_number")} />
            {form.formState.errors.jsd_number && <p className="text-sm text-red-500">{form.formState.errors.jsd_number.message}</p>}
          </div>

          {/* Project Group */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="project_group">
              Project Group
            </label>
            <Input id="project_group" type="text" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("project_group")} />
            {form.formState.errors.project_group && <p className="text-sm text-red-500">{form.formState.errors.project_group.message}</p>}
          </div>

          {/* Genmate Group */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="genmate_group">
              Genmate Group
            </label>
            <Input id="genmate_group" type="text" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("genmate_group")} />
            {form.formState.errors.genmate_group && <p className="text-sm text-red-500">{form.formState.errors.genmate_group.message}</p>}
          </div>

          {/* Zoom Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="zoom_name">
              Zoom Name
            </label>
            <Input id="zoom_name" type="text" disabled={isLoading} className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400" {...form.register("zoom_name")} />
            {form.formState.errors.zoom_name && <p className="text-sm text-red-500">{form.formState.errors.zoom_name.message}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-white text-black hover:bg-zinc-100">
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
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

        <div className="text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="underline hover:text-white">
            Login
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
