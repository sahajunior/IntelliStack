import { SignIn } from "@clerk/nextjs";

import { DemoSignIn } from "@/components/auth/demo-sign-in";

export default function SignInPage() {
  return (
    <div className="w-full">
      <DemoSignIn />
      <div className="flex justify-center">
        <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
