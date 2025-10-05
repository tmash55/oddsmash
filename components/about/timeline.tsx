"use client";

import { motion } from "framer-motion";

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 sm:left-1/2 transform sm:-translate-x-1/2 h-full w-0.5 bg-border"></div>

      {/* Timeline events */}
      <div className="space-y-12">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true, margin: "-100px" }}
            className={`relative flex flex-col sm:flex-row ${
              index % 2 === 0 ? "sm:flex-row-reverse" : ""
            } items-start sm:items-center`}
          >
            {/* Year bubble */}
            <div className="absolute left-4 top-0 sm:left-1/2 sm:top-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs sm:text-sm font-bold z-10">
              {event.year}
            </div>

            {/* Content */}
            <div className="sm:w-1/2 pl-16 sm:pl-0 sm:pr-8 sm:text-right">
              <div className="bg-card p-4 rounded-lg border shadow-sm">
                <h3 className="font-bold text-lg">{event.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Empty space for alignment */}
            <div className="hidden sm:block sm:w-1/2"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
