import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRight } from "lucide-react";

// Schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["patient", "employee"], { required_error: "Please select a role" }),
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { login, register, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "patient"
    }
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    await login(data);
    setLocation("/");
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    await register(data);
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-slate-100">
        <CardHeader className="text-center space-y-2">
          <Link href="/">
             <a className="font-serif text-2xl font-bold text-primary block mb-2">CareNaija</a>
          </Link>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to write reviews and manage your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    {...loginForm.register("email")} 
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    {...loginForm.register("password")} 
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 space-y-1 border">
                  <p className="font-semibold">Demo Credentials:</p>
                  <p>Patient: <code className="bg-white px-1 border rounded">patient@example.com</code></p>
                  <p>Employee: <code className="bg-white px-1 border rounded">doctor@example.com</code></p>
                  <p>Admin: <code className="bg-white px-1 border rounded">admin@example.com</code></p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input 
                    id="reg-name" 
                    placeholder="John Doe" 
                    {...registerForm.register("name")} 
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    {...registerForm.register("email")} 
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    {...registerForm.register("password")} 
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 cursor-pointer">
                      <input 
                        type="radio" 
                        value="patient" 
                        id="role-patient" 
                        className="accent-primary"
                        {...registerForm.register("role")}
                      />
                      <Label htmlFor="role-patient" className="cursor-pointer">Patient</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 cursor-pointer">
                      <input 
                        type="radio" 
                        value="employee" 
                        id="role-employee" 
                        className="accent-primary"
                        {...registerForm.register("role")}
                      />
                      <Label htmlFor="role-employee" className="cursor-pointer">Healthcare Worker</Label>
                    </div>
                  </div>
                  {registerForm.formState.errors.role && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.role.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                   {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                     <span className="flex items-center">
                       Create Account <ArrowRight className="ml-2 h-4 w-4" />
                     </span>
                   )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <p className="text-xs text-center text-slate-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
