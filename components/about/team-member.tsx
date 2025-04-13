"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Twitter, Linkedin, Github } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
}

interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  socialLinks: SocialLinks;
}

export function TeamMember({
  name,
  role,
  bio,
  imageSrc,
  socialLinks,
}: TeamMemberProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Card className="overflow-hidden h-full">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageSrc || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-sm text-primary mb-2">{role}</p>
          <p className="text-sm text-muted-foreground mb-4">{bio}</p>
          <div className="flex space-x-2">
            {socialLinks.twitter && (
              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <Link
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </Link>
              </Button>
            )}
            {socialLinks.linkedin && (
              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <Link
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </Button>
            )}
            {socialLinks.github && (
              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <Link
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
