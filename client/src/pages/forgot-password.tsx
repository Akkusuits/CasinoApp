
import { useState } from "react";
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [resetSent, setResetSent] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      const result = await response.json();

      if (response.ok) {
        setResetSent(true);
        toast({
          title: "Success",
          description: result.message || "Password reset link sent to your email",
        });
      } else {
        throw new Error(result.message || "Failed to send reset link");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link",
        variant: "destructive",
      });
    }
  };

  if (resetSent) {
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
              We've sent a password reset link to your email address. Please click the link to reset your password.
            </p>
            <Button
              variant="link"
              className="mt-4 w-full"
              onClick={() => window.location.href = "/auth"}
            >
              Back to Login
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
            Forgot Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Send Reset Link
              </Button>
              <Button
                variant="link"
                className="w-full"
                onClick={() => window.location.href = "/auth"}
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
