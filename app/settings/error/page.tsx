import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function OAuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        We couldn't connect to your Google account. This usually happens if the session expired or the security check failed.
      </p>
      <Link href="/settings">
        <Button>Back to Settings</Button>
      </Link>
    </div>
  );
}