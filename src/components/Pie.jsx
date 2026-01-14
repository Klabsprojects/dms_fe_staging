import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#4f46e5",
  "#38bdf8",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
];

const PieComponent = ({ selectedPeriod, selectedBranch }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH BILL SUMMARY ================= */
  useEffect(() => {
    fetchBillSummary();
  }, []);

  const fetchBillSummary = async () => {
    try {
      setLoading(true);

      const token =
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem("authToken")
          : null;

      if (!token) {
        console.warn("⚠️ No authToken found for bill summary.");
        setChartData([]);
        return;
      }

      const response = await fetch(
        "https://rcs-dms.onlinetn.com/api/v1/bill/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!result.error && Array.isArray(result.data)) {
        /**
         * 🔹 Aggregate by PERIOD (future-proof)
         */
        const periodMap = {};

        result.data.forEach(item => {
          if (!periodMap[item.period]) {
            periodMap[item.period] = {
              period: item.period,
              bills: 0,
              amount: 0,
            };
          }

          periodMap[item.period].bills += Number(item.bills || 0);
          periodMap[item.period].amount += Number(item.amount || 0);
        });

        setChartData(Object.values(periodMap));
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error("❌ Bill summary fetch error:", err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

        {/* ================= BAR CHART ================= */}
        <div className="w-full h-[380px]">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name) =>
                  name === "bills"
                    ? [`${value} Bills`, "Bills"]
                    : [`₹${value.toLocaleString()}`, "Amount"]
                }
              />

              {/* 🔹 Bills Count Bar */}
              <Bar dataKey="bills" radius={[8, 8, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>

              {/*
                👉 To show Amount instead, replace above Bar with:
                <Bar dataKey="amount" />
              */}
            </BarChart>
          </ResponsiveContainer>

          {loading && (
            <p className="text-center text-sm text-slate-500 mt-3">
              Loading bill analytics...
            </p>
          )}
        </div>

        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chartData.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
            >
              <p className="text-xs text-slate-500 mb-1">
                {item.period}
              </p>
              <p className="text-lg font-bold text-slate-800">
                {item.bills} Bills
              </p>
              <p className="text-sm text-slate-600">
                ₹ {item.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PieComponent;
