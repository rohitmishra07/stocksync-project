import { useEffect } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Link, useSearchParams } from "react-router-dom";

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // We could optionally verify the session explicitly via an API call here.
  }, [sessionId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Subscription Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Thank you for upgrading your StockSync account. All your premium features have been instantly unlocked and are ready to use.
          </p>
          {sessionId && (
            <p className="mt-1 text-xs text-gray-500">
              Reference ID: {sessionId.slice(0, 15)}...
            </p>
          )}
        </div>
        <div>
          <Link
            to="/"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
