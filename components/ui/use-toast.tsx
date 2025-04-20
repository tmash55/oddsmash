"use client";

// A simple placeholder for toast functionality
// In a real app, you would use a proper toast library like react-hot-toast or react-toastify

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export const toast = (props: ToastProps) => {
  // Just log to console for now
  console.log(`Toast (${props.variant || 'default'}): ${props.title}`, props.description || '');
  
  // In production, use a proper toast library
  // This is just a placeholder to make the app compile
};

// Keep this for compatibility with existing code
export const useToast = () => {
  return { toast };
}; 