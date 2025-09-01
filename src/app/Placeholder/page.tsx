
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PlaceholderProps {
  title: string;
  description: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <>
      <div className="min-h-screen bg-gray-50">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {description}
            </p>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <div className="text-gray-500">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Coming Soon
                </h3>
                <p className="text-gray-600">
                  This page is currently under development. Check back soon!
                </p>
              </div>
            </div>

            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

      </div>

      <div className="flex flex-col relative mt-5">
        <div className="gap-5 flex max-md:flex-col max-md:gap-0">
          <div className="flex flex-col line-height-normal w-[50%] ml-0 max-md:w-full max-md:ml-0" />
          <div className="flex flex-col line-height-normal w-[50%] ml-5 max-md:w-full max-md:ml-0" />
        </div>
      </div>
    </>
  );
}
