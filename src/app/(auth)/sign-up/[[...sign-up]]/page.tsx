import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      fallbackRedirectUrl="/create-organization"
      signInUrl="/sign-in"
    />
  );
}
