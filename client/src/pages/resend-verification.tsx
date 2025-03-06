
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

const resendVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ResendVerification() {
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      const response = await apiRequest("POST", "/api/auth/resend-verification", data);
      const result = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast({
          title: "Success",
          description: result.message || "Verification email has been resent",
        });
      } else {
        throw new Error(result.message || "Failed to resend verification email");
      }
    } catch (error: any) {
      console.error("Resend verification error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email",
        variant: "destructive",
      });
    }
  };

  if (emailSent) {
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
            Resend Verification Email
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
                Resend Verification Email
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
