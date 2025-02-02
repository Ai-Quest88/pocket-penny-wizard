import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate("/");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Try admin/admin",
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
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
        {/* Left column - AI Image */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
          <img 
            src="/lovable-uploads/422cbd9a-d7b1-4e06-83ab-3b705ffa7b76.png"
            alt="AI Financial Analysis"
            className="max-w-full lg:max-w-[600px] h-auto rounded-lg shadow-2xl animate-fadeIn"
          />
        </div>

        {/* Right column - Login Form */}
        <div className="w-full lg:w-1/2 max-w-md space-y-8 p-8 relative">
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
                Welcome Back
              </h2>
              <p className="text-muted-foreground mt-2 animate-fadeIn">
                Please sign in to your account
              </p>
            </div>
            
            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
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
                  placeholder="••••••••"
                  required
                  className="bg-white/50 backdrop-blur-sm border-white/20 focus:border-primary/50"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              >
                Sign in
              </Button>
            </form>
            
            <p className="text-center text-sm text-muted-foreground animate-fadeIn">
              Default credentials: admin/admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;