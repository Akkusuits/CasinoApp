import { useState, useEffect, useRef } from "react";
import { UserBalance } from "@/components/user-balance";
import { GameHistoryList } from "@/components/game-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateCrashPoint } from "@/lib/game-logic";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Crash() {
  const [bet, setBet] = useState("10");
  const [multiplier, setMultiplier] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCashed, setHasCashed] = useState(false);
  const crashPoint = useRef(0);
  const animationFrame = useRef(0);
  const { toast } = useToast();

  const startGame = async () => {
    const betAmount = parseFloat(bet);
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({ title: "Error", description: "Invalid bet amount", variant: "destructive" });
      return;
    }

    setIsPlaying(true);
    setHasCashed(false);
    setMultiplier(1);
    crashPoint.current = generateCrashPoint();

    const animate = () => {
      setMultiplier((prev) => {
        if (prev >= crashPoint.current) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 0.01;
      });
      animationFrame.current = requestAnimationFrame(animate);
    };
    animationFrame.current = requestAnimationFrame(animate);
  };

  const cashOut = async () => {
    if (!isPlaying || hasCashed) return;

    const betAmount = parseFloat(bet);
    const payout = betAmount * multiplier;

    try {
      await apiRequest("POST", "/api/game/result", {
        gameType: "crash",
        betAmount,
        multiplier,
        payout,
        userId: 1, // Will be set by backend
      });

      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game/history"] });

      setHasCashed(true);
      toast({ title: "Success", description: `Cashed out at ${multiplier.toFixed(2)}x!` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to cash out", variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlaying && !hasCashed && multiplier > 1) {
      toast({ title: "Game Over", description: "Crashed!" });
    }
  }, [isPlaying, hasCashed, multiplier]);

  return (
    <div className="space-y-6">
      <UserBalance />

      <Card className="bg-black/50 border-primary/20">
        <CardHeader>
          <CardTitle>Crash</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            className="text-6xl font-bold text-center p-8"
            animate={{
              scale: isPlaying ? 1.1 : 1,
              color: !isPlaying && !hasCashed && multiplier > 1 ? "#ef4444" : "#ffffff",
            }}
          >
            {multiplier.toFixed(2)}x
          </motion.div>

          <div className="flex gap-2">
            <Input
              type="number"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              min="0"
              step="0.1"
              disabled={isPlaying}
            />
            {isPlaying ? (
              <Button
                onClick={cashOut}
                disabled={hasCashed}
                className="bg-green-500 hover:bg-green-600"
              >
                Cash Out
              </Button>
            ) : (
              <Button onClick={startGame}>
                Start Game
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <GameHistoryList />
    </div>
  );
}