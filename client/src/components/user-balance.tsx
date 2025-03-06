import { useQuery } from "@tanstack/react-query";
import { type NumericUser } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";

export function UserBalance() {
  const { data: user } = useQuery<NumericUser>({
    queryKey: ["/api/user/me"],
  });

  if (!user) return null;

  return (
    <Card className="bg-black/50 border-primary/20">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Balance</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            ${user.balance.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}