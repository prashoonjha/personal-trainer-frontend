import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_BASE_URL =
  "https://customer-rest-service-frontend-personaltrainer.2.rahtiapp.fi/api";

interface TrainingCustomer {
  id: number;
  firstname: string;
  lastname: string;
  streetaddress: string;
  postcode: string;
  city: string;
  email: string;
  phone: string;
}

interface Training {
  id: number;
  date: string;
  duration: number;
  activity: string;
  customer: TrainingCustomer;
}

interface ActivityStat {
  activity: string;
  minutes: number;
}

function StatsPage() {
  const [stats, setStats] = useState<ActivityStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/gettrainings`);
        if (!res.ok) throw new Error("Failed to load trainings");

        const data: Training[] = await res.json();

      
        const map: Record<string, number> = {};

        data.forEach((t) => {
          if (!t.activity) return;
          if (!map[t.activity]) map[t.activity] = 0;
          map[t.activity] += t.duration;
        });

        const result: ActivityStat[] = Object.entries(map).map(
          ([activity, minutes]) => ({ activity, minutes })
        );

      
        result.sort((a, b) => a.activity.localeCompare(b.activity));

        setStats(result);
      } catch (err) {
        console.error(err);
        setError("Unable to load statistics");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <h1>Training Analytics</h1>
      <p>Total duration (minutes) for each activity.</p>

      {loading && <div className="message">Loading statistics...</div>}
      {error && <div className="message error">{error}</div>}

      {!loading && !error && stats.length === 0 && (
        <div className="message">No trainings found for statistics.</div>
      )}

      {!loading && !error && stats.length > 0 && (
        <div
          style={{
            width: "100%",
            overflowX: "auto", 
            background: "white",
            padding: "1rem",
            boxSizing: "border-box",
            borderRadius: 4,
          }}
        >
          
          <BarChart width={800} height={400} data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="activity" />
            <YAxis
              label={{
                value: "Duration (min)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Bar dataKey="minutes" fill="#7b78f0" />
          </BarChart>
        </div>
      )}
    </div>
  );
}

export default StatsPage;
