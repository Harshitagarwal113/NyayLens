"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Left Side - Marketing/Branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-slate-950 relative overflow-hidden flex-col justify-between p-12 lg:p-24 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/30 blur-[120px]" />
          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0">
              <img src="/logo.jpg" alt="NyayLens Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold tracking-tight">NyayLens</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] mb-6">
            The intelligent operating system for modern legal teams.
          </h1>
          <p className="text-slate-400 text-lg max-w-lg leading-relaxed font-medium">
            Upload complex agreements, instantly extract obligations, and let AI streamline your entire document review workflow securely.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-slate-300 bg-white/5 w-fit px-4 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <span>Bank-grade encryption & enterprise security</span>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-slate-200 shrink-0">
              <img src="/logo.jpg" alt="NyayLens Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">NyayLens</span>
          </div>

          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Create an account</h2>
            <p className="text-slate-500 font-medium">Enter your details below to get started.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="email">
                  Email address
                </label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-slate-200 bg-slate-50 focus-visible:ring-blue-600 transition-shadow"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="password">
                  Password
                </label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="h-12 border-slate-200 bg-slate-50 focus-visible:ring-blue-600 transition-shadow"
                />
                <p className="text-xs text-slate-500 font-medium mt-1.5">Must be at least 6 characters long.</p>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-base shadow-md transition-all active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account securely"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 font-medium pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
