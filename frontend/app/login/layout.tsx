import type { Metadata } from "next";
import "./login.css";

export const metadata: Metadata = {
  title: "Sign in",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
