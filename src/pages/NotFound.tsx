import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground">
          <PawPrint className="h-10 w-10" />
        </div>
        <h1 className="mt-8 font-display text-8xl font-bold text-primary">404</h1>
        <h2 className="mt-3 font-display text-2xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-accent mt-7 inline-flex">
          Go home
        </Link>
      </div>
    </div>
  );
}
