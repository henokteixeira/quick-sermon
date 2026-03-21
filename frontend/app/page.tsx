"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface HealthStatus {
  status: string;
  database: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/health`
      );
      const data = await res.json();
      setHealth(data);
    } catch {
      setError("Could not connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Quick Sermon</h1>
        <p className="text-muted-foreground">
          Sistema de Clips de Pregacoes
        </p>

        <div className="border rounded-lg p-6 bg-white shadow-sm space-y-3">
          <h2 className="font-semibold text-lg">System Status</h2>

          {loading && <p className="text-muted-foreground">Checking...</p>}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          {health && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>API</span>
                <span
                  className={
                    health.status === "ok"
                      ? "text-green-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {health.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Database</span>
                <span
                  className={
                    health.database === "healthy"
                      ? "text-green-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {health.database}
                </span>
              </div>
            </div>
          )}

          <Button onClick={checkHealth} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
