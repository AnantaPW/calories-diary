import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="type-section">Page not found</h1>
        </CardTitle>
        <CardDescription>This page doesn&apos;t exist.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Link href="/" className={buttonVariants()}>
          Back to today
        </Link>
      </CardFooter>
    </Card>
  );
}
