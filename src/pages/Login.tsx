
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{password?: string}>({});
  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isSigningUp, setIsSigningUp] = useState(false);

  const validateForm = () => {
    const newErrors: {password?: string} = {};
    
    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isSigningUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link.",
        });
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Dynamic background with multiple layers */}
      <div className="fixed inset-0 w-full h-full overflow-hidden">
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        
        {/* Background image layer with overlay */}
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d')] bg-cover bg-center opacity-10"
          style={{ mixBlendMode: 'overlay' }}
        />
        
        {/* Animated gradient orbs */}
        <div className="absolute -top-1/2 -left-1/2 w-full h-full animate-[spin_100s_linear_infinite]">
          <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent opacity-50" />
        </div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full animate-[spin_80s_linear_infinite]">
          <div className="absolute inset-0 bg-gradient-radial from-secondary/10 to-transparent opacity-50" />
        </div>
        
        {/* Additional animated elements */}
        <div className="absolute inset-0">
          <div className="absolute top-[20%] left-[15%] w-64 h-64 bg-primary/10 rounded-full mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite] blur-xl" />
          <div className="absolute top-[40%] right-[15%] w-72 h-72 bg-secondary/10 rounded-full mix-blend-multiply animate-[pulse_12s_ease-in-out_infinite] blur-xl" />
          <div className="absolute bottom-[20%] left-[25%] w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply animate-[pulse_10s_ease-in-out_infinite] blur-xl" />
          <div className="absolute top-[60%] right-[25%] w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply animate-[pulse_15s_ease-in-out_infinite] blur-xl" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-primary/20 rounded-full
                animate-[pulse_${3 + i}s_ease-in-out_infinite]`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content container with two columns */}
      <div className="container max-w-7xl mx-auto px-8 md:px-12 lg:px-16 flex flex-col lg:flex-row items-center justify-center gap-12 relative z-10">
        {/* Left column - AI Image */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
          <img 
            src="/lovable-uploads/422cbd9a-d7b1-4e06-83ab-3b705ffa7b76.png" 
            alt="AI Financial Analysis" 
            width="1920"
            height="1920"
            className="max-w-full lg:max-w-[600px] h-auto rounded-lg shadow-2xl animate-fadeIn"
          />
        </div>

        {/* Right column - Login Form */}
        <div className="w-full lg:w-1/2 max-w-md p-8 relative">
          {/* Glassmorphism effect for form background */}
          <div className="absolute inset-0 bg-white/30 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg" />
          
          <div className="relative space-y-8">
            {/* Logo and heading */}
            <div className="text-center">
              <img 
                src="/logo.svg" 
                alt="FinSight" 
                className="h-12 mx-auto mb-4 dark:invert animate-fadeIn"
              />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {isSigningUp ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground mt-2 animate-fadeIn">
                {isSigningUp ? "Sign up for an account" : "Please sign in to your account"}
              </p>
            </div>
            
            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="login-email-input"
                  className="bg-white/50 backdrop-blur-sm border-white/20 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="login-password-input"
                  className={`bg-white/50 backdrop-blur-sm border-white/20 focus:border-primary/50 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>
              <Button 
                type="submit" 
                data-testid="login-submit-button"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              >
                {isSigningUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>
            
            {/* Google Sign In */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={loginWithGoogle}
              data-testid="login-google-button"
              className="w-full bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/70"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
            
            <div className="text-center space-y-4">
              <button
                type="button"
                onClick={() => {
                  setIsSigningUp(!isSigningUp);
                  setErrors({});
                }}
                data-testid="login-toggle-signup-button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSigningUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
