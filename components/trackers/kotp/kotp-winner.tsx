import { motion } from "framer-motion";
import { Trophy, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KOTPWinnerProps {
  className?: string;
}

export default function KOTPWinner({ className }: KOTPWinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6,
        ease: "easeOut"
      }}
      className={cn("w-full max-w-3xl mx-auto", className)}
    >
      <Card className="relative overflow-hidden border-2 border-amber-400/20">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5" />
        
        <CardHeader className="relative z-10 flex flex-col items-center text-center space-y-6 pb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="relative">
              <Trophy className="h-16 w-16 md:h-20 md:w-20 text-amber-400 drop-shadow-lg" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ 
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 2,
                  repeatDelay: 1
                }}
                className="absolute -inset-2 rounded-full bg-amber-400/20 blur-lg"
              />
            </div>
          </motion.div>
          
          <div className="space-y-4">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
              King of the Playoffs - Round 1 Champion
            </Badge>
            
            <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Jalen Brunson
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 flex flex-col items-center text-center pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-md mx-auto mt-6">
            <StatBox
              icon={<Star className="h-5 w-5 text-amber-400" />}
              value="189"
              label="Total Points"
            />
            <StatBox
              icon={<Star className="h-5 w-5 text-amber-400" />}
              value="31.5"
              label="Points Per Game"
            />
            <StatBox
              icon={<Star className="h-5 w-5 text-amber-400" />}
              value="4-2"
              label="Series Result"
            />
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8 text-muted-foreground max-w-lg text-sm md:text-base"
          >
            Congratulations to Jalen Brunson for his outstanding performance throughout the first round 
            of the playoffs, earning him the King of the Playoffs crown with an impressive 
            31.5 points per game average.
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatBoxProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatBox({ icon, value, label }: StatBoxProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="flex flex-col items-center p-4 rounded-lg bg-card border shadow-sm"
    >
      <div className="mb-2">{icon}</div>
      <span className="text-xl sm:text-2xl font-bold mb-1">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </motion.div>
  );
}