import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "../env-var-warning";
import { AuthButton } from "../auth-button";
import { ThemeSwitcher } from "./theme-switcher";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>🤖 Agentic Powered Recruitment Platform</Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
          </div>
        </nav>
    );
}