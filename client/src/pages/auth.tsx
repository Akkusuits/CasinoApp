import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, loginSchema } from "@shared/schema"; // Assuming loginSchema is defined here
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Eye, EyeOff } from "lucide-react";

const PASSWORD_REQUIREMENTS = [
  "At least 6 characters long",
  "At least one uppercase letter",
  "At least one number",
  "At least one special character (!@#$%^&*)",
  "Only alphanumeric and special characters allowed"
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Added state for verification status
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(isLogin ? loginSchema : insertUserSchema),
    defaultValues: {
      login: "",      // for login
      username: "",   // for registration
      email: "",      // for registration
      password: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    if (verified === 'true') {
      setIsVerified(true); // Set isVerified to true if verified param is present
      toast({
        title: "Email Verified",
        description: "Your email has been verified. You can now log in.",
        action: <ToastAction onClick={()=> window.location.href = "/login"}>Go to Login</ToastAction>
      });
    }
  }, []);


  const onSubmit = async (data: any) => {
    try {
      if (isLogin) {
        const response = await apiRequest("POST", "/api/auth/login", {login: data.login, password: data.password});
        const result = await response.json();
        if(response.ok){
          if(!result.isVerified){
            setVerificationSent(true); // Show resend verification option
          } else {
            window.location.href = "/";
          }
        } else {
          throw new Error(result.message || "Invalid credentials");
        }
      } else {
        const response = await apiRequest("POST", "/api/auth/register", data);
        const result = await response.json();
        if (response.ok) {
          setVerificationSent(true);
          toast({
            title: "Success",
            description: result.message || "Please check your email for verification link",
          });
        } else {
          throw new Error(result.message || "Registration failed");
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error.message || (isLogin ? "Invalid credentials" : "Registration failed"),
        variant: "destructive",
      });
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px] bg-black/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Check Your Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              We've sent a verification link to your email address. Please click the link to verify your account.
            </p>
            <Button onClick={()=> window.location.href = "/auth/resend-verification"}>Resend Verification Email</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified && isLogin) { // Check for verification status on login
    return (
      <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px] bg-black/50 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Verify Your Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your email address is not verified. Please check your email for a verification link or resend it.</p>
          <Button onClick={()=> window.location.href = "/auth/resend-verification"}>Resend Verification Email</Button>
        </CardContent>
      </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px] bg-black/50 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isLogin ? (
                <FormField
                  control={form.control}
                  name="login"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username or Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {!isLogin && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gmail Address</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="example@gmail.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    {!isLogin && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p className="font-medium">Password requirements:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {PASSWORD_REQUIREMENTS.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {isLogin ? "Login" : "Register"}
              </Button>

              
            </form>
          </Form>
          <Button
            variant="link"
            className="mt-4 w-full"
            onClick={() => {
              setIsLogin(!isLogin);
              setVerificationSent(false);
              form.reset();
            }}
          >
            {isLogin ? "Need an account?" : "Already have an account?"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}