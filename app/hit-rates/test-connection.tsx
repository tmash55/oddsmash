"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";

export default function TestSupabaseConnection() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHitRates() {
      try {
        // Check if Supabase client can be created
        let supabase;
        try {
          supabase = createClient();
          if (!supabase) throw new Error("Failed to create Supabase client");
        } catch (clientErr: any) {
          console.error("Error creating Supabase client:", clientErr);
          setError("Failed to initialize Supabase client");
          setErrorDetails(clientErr.message || JSON.stringify(clientErr));
          setStatus("error");
          return;
        }
        
        // Attempt to fetch a small sample of hit rate data
        try {
          const { data, error } = await supabase
            .from("player_hit_rate_profiles")
            .select("*")
            .limit(5);
            
          if (error) throw error;
          
          setData(data);
          setStatus("success");
        } catch (queryErr: any) {
          console.error("Error querying hit rates:", queryErr);
          setError("Failed to query hit rate data");
          setErrorDetails(queryErr.message || JSON.stringify(queryErr));
          setStatus("error");
        }
      } catch (err: any) {
        console.error("Unexpected error:", err);
        setError("Unexpected error occurred");
        setErrorDetails(err.message || JSON.stringify(err));
        setStatus("error");
      }
    }

    fetchHitRates();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      {status === "loading" && (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <p>Testing connection...</p>
        </div>
      )}
      
      {status === "error" && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <h3 className="font-bold">Connection Error</h3>
          <p>{error}</p>
          {errorDetails && (
            <div className="mt-2">
              <p className="font-semibold text-sm">Error Details:</p>
              <pre className="bg-red-50 p-2 rounded text-xs overflow-auto mt-1">
                {errorDetails}
              </pre>
            </div>
          )}
          <p className="mt-2 text-sm">
            Please check your Supabase credentials in .env.local and ensure the table exists.
          </p>
          <div className="mt-4">
            <p className="font-semibold text-sm">Environment Check:</p>
            <ul className="list-disc pl-5 text-xs mt-1">
              <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Not set"}</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Not set"}</li>
            </ul>
          </div>
        </div>
      )}
      
      {status === "success" && (
        <div className="p-4 bg-green-100 text-green-700 rounded-md">
          <h3 className="font-bold">Connection Successful!</h3>
          <p className="mb-2">Successfully retrieved {data?.length || 0} records from player_hit_rate_profiles table.</p>
          
          {data && data.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Sample Data:</h4>
              <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(data[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 