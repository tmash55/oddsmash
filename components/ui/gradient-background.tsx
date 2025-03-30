export function GradientBackground({ className }: { className?: string }) {
  return (
    <div className={`absolute inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Main gradient elements */}
      <div className="absolute top-0 left-0 right-0 h-[500px] w-full">
        <div className="absolute -top-[100px] -left-[100px] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5 animate-pulse-slow" />
        <div className="absolute -top-[150px] right-[10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px] dark:bg-primary/5 animate-pulse-medium" />
      </div>

      {/* Bottom gradient elements */}
      <div className="absolute bottom-0 left-0 right-0 h-[300px] w-full">
        <div className="absolute -bottom-[100px] left-[20%] h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px] dark:bg-primary/5 animate-pulse-medium" />
        <div className="absolute -bottom-[150px] right-[5%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5 animate-pulse-slow" />
      </div>

      {/* Starry dot pattern - top section */}
      <div className="absolute top-[5%] left-[5%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[7%] left-[10%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[9%] left-[15%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[6%] left-[20%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[8%] left-[25%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[5%] left-[30%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[7%] left-[35%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[9%] left-[40%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[6%] left-[45%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[8%] left-[50%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[5%] left-[55%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[7%] left-[60%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[9%] left-[65%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[6%] left-[70%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[8%] left-[75%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[5%] left-[80%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[7%] left-[85%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[9%] left-[90%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[6%] left-[95%] h-0.75 w-0.75 rounded-full bg-primary/25" />

      {/* Starry dot pattern - middle top section */}
      <div className="absolute top-[15%] left-[7%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[17%] left-[12%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[19%] left-[17%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[16%] left-[22%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[18%] left-[27%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[15%] left-[32%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[17%] left-[37%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[19%] left-[42%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[16%] left-[47%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[18%] left-[52%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[15%] left-[57%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[17%] left-[62%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[19%] left-[67%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[16%] left-[72%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[18%] left-[77%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[15%] left-[82%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[17%] left-[87%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[19%] left-[92%] h-0.75 w-0.75 rounded-full bg-primary/30" />

      {/* Starry dot pattern - middle section */}
      <div className="absolute top-[25%] left-[3%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[27%] left-[8%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[29%] left-[13%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[26%] left-[18%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[28%] left-[23%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[25%] left-[28%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[27%] left-[33%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[29%] left-[38%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[26%] left-[43%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[28%] left-[48%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[25%] left-[53%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[27%] left-[58%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[29%] left-[63%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[26%] left-[68%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[28%] left-[73%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[25%] left-[78%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[27%] left-[83%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[29%] left-[88%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[26%] left-[93%] h-0.75 w-0.75 rounded-full bg-primary/20" />

      {/* Starry dot pattern - middle bottom section */}
      <div className="absolute top-[35%] left-[5%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[37%] left-[10%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[39%] left-[15%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[36%] left-[20%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[38%] left-[25%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[35%] left-[30%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[37%] left-[35%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[39%] left-[40%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[36%] left-[45%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[38%] left-[50%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[35%] left-[55%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[37%] left-[60%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[39%] left-[65%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[36%] left-[70%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[38%] left-[75%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[35%] left-[80%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[37%] left-[85%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[39%] left-[90%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[36%] left-[95%] h-0.75 w-0.75 rounded-full bg-primary/15" />

      {/* Starry dot pattern - bottom section */}
      <div className="absolute top-[45%] left-[7%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[47%] left-[12%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[49%] left-[17%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[46%] left-[22%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[48%] left-[27%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[45%] left-[32%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[47%] left-[37%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[49%] left-[42%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[46%] left-[47%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[48%] left-[52%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[45%] left-[57%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[47%] left-[62%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[49%] left-[67%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[46%] left-[72%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[48%] left-[77%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[45%] left-[82%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[47%] left-[87%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[49%] left-[92%] h-0.75 w-0.75 rounded-full bg-primary/30" />

      {/* Starry dot pattern - more bottom section */}
      <div className="absolute top-[55%] left-[3%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[57%] left-[8%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[59%] left-[13%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[56%] left-[18%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[58%] left-[23%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[55%] left-[28%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[57%] left-[33%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[59%] left-[38%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[56%] left-[43%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[58%] left-[48%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[55%] left-[53%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[57%] left-[58%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[59%] left-[63%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[56%] left-[68%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[58%] left-[73%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[55%] left-[78%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[57%] left-[83%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[59%] left-[88%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[56%] left-[93%] h-0.75 w-0.75 rounded-full bg-primary/20" />

      {/* Starry dot pattern - even more bottom section */}
      <div className="absolute top-[65%] left-[5%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[67%] left-[10%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[69%] left-[15%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[66%] left-[20%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[68%] left-[25%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[65%] left-[30%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[67%] left-[35%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[69%] left-[40%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[66%] left-[45%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[68%] left-[50%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[65%] left-[55%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[67%] left-[60%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[69%] left-[65%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[66%] left-[70%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[68%] left-[75%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[65%] left-[80%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[67%] left-[85%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[69%] left-[90%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[66%] left-[95%] h-0.75 w-0.75 rounded-full bg-primary/15" />

      {/* Starry dot pattern - bottom most section */}
      <div className="absolute top-[75%] left-[7%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[77%] left-[12%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[79%] left-[17%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[76%] left-[22%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[78%] left-[27%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[75%] left-[32%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[77%] left-[37%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[79%] left-[42%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[76%] left-[47%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[78%] left-[52%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[75%] left-[57%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[77%] left-[62%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[79%] left-[67%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[76%] left-[72%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[78%] left-[77%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[75%] left-[82%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[77%] left-[87%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[79%] left-[92%] h-0.75 w-0.75 rounded-full bg-primary/30" />

      {/* Starry dot pattern - very bottom section */}
      <div className="absolute top-[85%] left-[3%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[87%] left-[8%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[89%] left-[13%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[86%] left-[18%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[88%] left-[23%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[85%] left-[28%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[87%] left-[33%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[89%] left-[38%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[86%] left-[43%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[88%] left-[48%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[85%] left-[53%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[87%] left-[58%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[89%] left-[63%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[86%] left-[68%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[88%] left-[73%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[85%] left-[78%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[87%] left-[83%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[89%] left-[88%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[86%] left-[93%] h-0.75 w-0.75 rounded-full bg-primary/20" />

      {/* Starry dot pattern - very very bottom section */}
      <div className="absolute top-[95%] left-[5%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[97%] left-[10%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[94%] left-[15%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[96%] left-[20%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[98%] left-[25%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[95%] left-[30%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[97%] left-[35%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[94%] left-[40%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[96%] left-[45%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[98%] left-[50%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[95%] left-[55%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[97%] left-[60%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[94%] left-[65%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[96%] left-[70%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[98%] left-[75%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div />
      <div className="absolute top-[98%] left-[75%] h-0.75 w-0.75 rounded-full bg-primary/15" />
      <div className="absolute top-[95%] left-[80%] h-0.75 w-0.75 rounded-full bg-primary/20" />
      <div className="absolute top-[97%] left-[85%] h-0.75 w-0.75 rounded-full bg-primary/30" />
      <div className="absolute top-[94%] left-[90%] h-0.75 w-0.75 rounded-full bg-primary/25" />
      <div className="absolute top-[96%] left-[95%] h-0.75 w-0.75 rounded-full bg-primary/15" />
    </div>
  );
}
