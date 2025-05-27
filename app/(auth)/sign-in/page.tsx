// app/auth/sign-in/page.tsx

'use client';

import SignInForm from "@/components/auth/SignInForm";
import { motion } from "framer-motion";

export default function SignInPage() {
  return (
    <motion.div 
      className="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </motion.div>
  );
}
