import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { statcodeToShiptypeMap } from "../constants/codes";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to map stat codes to vessel types
export function mapStatCode(code: string | null | undefined) {
  if (!code) return "N/A";
  for (const [key, value] of statcodeToShiptypeMap) {
    if (code.startsWith(key)) return value;
  }
  return "N/A";
}
