"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface PartnerLogoProps {
  name: string;
  imageSrc: string;
}

export function PartnerLogo({ name, imageSrc }: PartnerLogoProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      className="flex items-center justify-center p-4"
    >
      <div className="relative h-12 w-full opacity-70 hover:opacity-100 transition-opacity">
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={name}
          fill
          className="object-contain"
        />
      </div>
    </motion.div>
  );
}
