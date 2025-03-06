
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*]/, "Password must contain at least one special character")
    .regex(/^[a-zA-Z0-9!@#$%^&*]+$/, "Only alphanumeric and special characters allowed"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccessful, setResetSuccessful] = useState(false);
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid reset token",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [token, navigate, toast]);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    try {
      const response = await apiRequest("POST", `/api/auth/reset-password/${token}`, {
        password: data.password,
      });
      const result = await response.json();

      if (response.ok) {
        setResetSuccessful(true);
        toast({
          title: "Success",
          description: result.message || "Your password has been reset",
        });
      } else {
        throw new Error(result.message || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  if (resetSuccessful) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px] bg-black/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Password Reset Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Your password has been reset successfully. You can now login with your new password.
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => navigate("/auth")}
            >
              Go to Login
            </Button>
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
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                        />
                        <div
                          className="absolute right-3 top-3 cursor-pointer"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                        />
                        <div
                          className="absolute right-3 top-3 cursor-pointer"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-2 text-sm text-muted-foreground">
                <p className="font-medium">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 6 characters long</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character (!@#$%^&*)</li>
                  <li>Only alphanumeric and special characters allowed</li>
                </ul>
              </div>
              <Button type="submit" className="w-full">
                Reset Password
              </Button>
              <Button
                variant="link"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Back to Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
