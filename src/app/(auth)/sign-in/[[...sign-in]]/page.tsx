import { SignIn } from "@clerk/nextjs";

import { DemoSignIn } from "@/components/auth/demo-sign-in";
import { getDemoEmail } from "@/server/demo";

export default function SignInPage() {
  const demoEnabled = Boolean(getDemoEmail());

  return (
    <div className="w-full">
      {demoEnabled ? <DemoSignIn /> : null}
      <div className="flex justify-center">
        <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
