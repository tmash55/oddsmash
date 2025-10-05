"use client";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

type DateOption = "today" | "tomorrow" | "week" | "all";

interface DateSelectorProps {
  dateFilter: DateOption;
  setDateFilter: (value: DateOption) => void;
  className?: string;
}

export function DateSelector({
  dateFilter,
  setDateFilter,
  className,
}: DateSelectorProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Date options
  const dateOptions: { value: DateOption; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "week", label: "This Week" },
    { value: "all", label: "All Games" },
  ];

  // Get the current date display text
  const getDateDisplayText = () => {
    const option = dateOptions.find((opt) => opt.value === dateFilter);
    return option?.label || "Select Date";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className={cn(
              "flex items-center gap-2 border-border/60 bg-background/80 hover:bg-background/90 hover:border-primary/30 transition-all duration-200",
              isMobile ? "h-10 px-3 w-full justify-between" : "h-9 px-3",
              className
            )}
          >
            <Calendar className="h-4 w-4 text-primary/70" />
            <span
              className={cn(
                "font-medium truncate",
                isMobile ? "text-sm flex-1 text-left" : "text-sm max-w-[100px]"
              )}
            >
              {getDateDisplayText()}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMobile ? "center" : "start"}
        className={cn("p-1", isMobile ? "w-[90vw] max-w-[350px]" : "w-[180px]")}
      >
        <div className="py-1.5 px-2 text-xs font-medium text-muted-foreground border-b mb-1">
          Select Date Range
        </div>
        <div className={cn(isMobile ? "max-h-[40vh] overflow-y-auto" : "")}>
          {dateOptions.map((option) => {
            const isActive = dateFilter === option.value;

            return (
              <motion.div
                key={option.value}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <DropdownMenuItem
                  className={cn(
                    "flex items-center gap-2 cursor-pointer rounded-md transition-colors duration-150",
                    isMobile ? "py-3 px-3 my-1" : "py-2 px-2 my-0.5",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                  onClick={() => setDateFilter(option.value)}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 15,
                      }}
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </DropdownMenuItem>
              </motion.div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
