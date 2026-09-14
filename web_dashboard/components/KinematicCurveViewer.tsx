"use client";

import React from "react";

interface SensorPoint {
  time_ms: number;
  angle_deg: number;
  velocity_deg_s: number;
  vag_energy_rms: number;
}

interface KinematicCurveViewerProps {
  rom: number;
  thetaCrit: number;
  peakVelocity: number;
  jointName: string;
  timeSeries: SensorPoint[];
}

export const KinematicCurveViewer: React.FC<
  KinematicCurveViewerProps
> = ({
  rom,
  thetaCrit,
  peakVelocity,
  jointName,
  timeSeries,
}) => {
  const width = 700;
  const height = 360;

  const padding = {
    top: 45,
    right: 35,
    bottom: 55,
    left: 55,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div className="bg-slate-900 text-white p-6 rounded-2xl">
        No synchronized sensor data available.
      </div>
    );
  }

  const maxTime =
    Math.max(...timeSeries.map((point) => point.time_ms)) || 800;

  const maxAngle = 160;

  const maxVelocity = Math.max(
    peakVelocity,
    ...timeSeries.map((point) => point.velocity_deg_s)
  );

  const maxVag = Math.max(
    100,
    ...timeSeries.map((point) => point.vag_energy_rms)
  );

  const getX = (time: number) =>
    padding.left + (time / maxTime) * plotWidth;

  const getAngleY = (angle: number) =>
    padding.top +
    plotHeight -
    (Math.max(0, Math.min(angle, maxAngle)) / maxAngle) *
      plotHeight;

  const getVelocityY = (velocity: number) =>
    padding.top +
    plotHeight -
    (Math.max(0, velocity) / maxVelocity) *
      plotHeight;

  /* --------------------------------
     ANGLE PATH
  -------------------------------- */

  const anglePath = timeSeries
    .map((point, index) => {
      const x = getX(point.time_ms);
      const y = getAngleY(point.angle_deg);

      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  /* --------------------------------
     VELOCITY PATH
  -------------------------------- */

  const velocityPath = timeSeries
    .map((point, index) => {
      const x = getX(point.time_ms);
      const y = getVelocityY(point.velocity_deg_s);

      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  /* --------------------------------
     FIND θcrit SENSOR POINT
  -------------------------------- */

  const critPoint = timeSeries.reduce((closest, point) => {
    const currentDifference = Math.abs(
      point.angle_deg - thetaCrit
    );

    const closestDifference = Math.abs(
      closest.angle_deg - thetaCrit
    );

    return currentDifference < closestDifference
      ? point
      : closest;
  }, timeSeries[0]);

  const critX = getX(critPoint.time_ms);
  const critY = getAngleY(critPoint.angle_deg);

  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-inner">

      {/* --------------------------------
          HEADER
      -------------------------------- */}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

        <div>
          <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />

            Dynamic Excursion Arc: {jointName} Flexion-Extension
          </h4>

          <p className="text-xs text-slate-400 mt-1">
            Synchronized Dual-IMU sensor time-series
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">

          <span className="text-blue-400">
            ● Angle
          </span>

          <span className="text-emerald-400">
            ┄ Velocity
          </span>

          <span className="text-amber-400">
            ▮ VAG Energy
          </span>

          {thetaCrit > 0 && (
            <span className="text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded-md">
              ⚠ θ_crit: {thetaCrit.toFixed(1)}°
            </span>
          )}

        </div>
      </div>

      {/* --------------------------------
          GRAPH
      -------------------------------- */}

      <div className="relative overflow-x-auto">

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px]"
        >

          {/* ANGLE GRID */}

          {[0, 40, 80, 120, 160].map((value) => {
            const y = getAngleY(value);

            return (
              <g key={value}>

                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />

                <text
                  x={padding.left - 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                >
                  {value}°
                </text>

              </g>
            );
          })}

          {/* TIME AXIS */}

          {timeSeries.map((point) => {
            const x = getX(point.time_ms);

            return (
              <g key={point.time_ms}>

                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="middle"
                >
                  {(point.time_ms / 1000).toFixed(1)}s
                </text>

              </g>
            );
          })}

          {/* VAG ENERGY BARS */}

          {timeSeries.map((point) => {

            const x = getX(point.time_ms);

            const barHeight =
              (point.vag_energy_rms / maxVag) *
              plotHeight *
              0.35;

            const y =
              padding.top +
              plotHeight -
              barHeight;

            return (
              <rect
                key={`vag-${point.time_ms}`}
                x={x - 8}
                y={y}
                width="16"
                height={barHeight}
                fill="#f59e0b"
                opacity="0.35"
                rx="2"
              />
            );
          })}

          {/* ANGLE CURVE */}

          <path
            d={anglePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* VELOCITY CURVE */}

          <path
            d={velocityPath}
            fill="none"
            stroke="#34d399"
            strokeWidth="1.8"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />

          {/* ACTUAL SENSOR POINTS */}

          {timeSeries.map((point) => {

            const x = getX(point.time_ms);
            const y = getAngleY(point.angle_deg);

            return (
              <circle
                key={`angle-${point.time_ms}`}
                cx={x}
                cy={y}
                r="3.5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1"
              />
            );
          })}

          {/* θcrit MARKER */}

          {thetaCrit > 0 && (
            <g>

              <line
                x1={critX}
                y1={padding.top}
                x2={critX}
                y2={height - padding.bottom}
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="5 4"
              />

              <circle
                cx={critX}
                cy={critY}
                r="7"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="2"
              />

              <rect
                x={Math.max(
                  padding.left,
                  critX - 55
                )}
                y={Math.max(
                  padding.top,
                  critY - 42
                )}
                width="110"
                height="24"
                rx="5"
                fill="#881337"
                stroke="#f43f5e"
              />

              <text
                x={critX}
                y={Math.max(
                  padding.top + 16,
                  critY - 25
                )}
                fill="#fecdd3"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                θ_crit = {thetaCrit.toFixed(1)}°
              </text>

            </g>
          )}

          {/* AXIS LABELS */}

          <text
            x={padding.left}
            y={height - 8}
            fill="#64748b"
            fontSize="10"
          >
            Time (seconds)
          </text>

          <text
            x="15"
            y={padding.top}
            fill="#64748b"
            fontSize="10"
            transform={`rotate(-90 15 ${padding.top})`}
          >
            Angle / Velocity
          </text>

        </svg>
      </div>

      {/* --------------------------------
          SENSOR SUMMARY
      -------------------------------- */}

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">

        <div className="bg-slate-800 rounded-lg p-2">
          <p className="text-slate-400">
            Measured ROM
          </p>

          <p className="text-blue-400 font-bold">
            {rom.toFixed(1)}°
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-2">
          <p className="text-slate-400">
            Peak Velocity
          </p>

          <p className="text-emerald-400 font-bold">
            {peakVelocity.toFixed(1)} °/s
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-2">
          <p className="text-slate-400">
            θ_crit
          </p>

          <p className="text-rose-400 font-bold">
            {thetaCrit.toFixed(1)}°
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-2">
          <p className="text-slate-400">
            Sensor Samples
          </p>

          <p className="text-amber-400 font-bold">
            {timeSeries.length}
          </p>
        </div>

      </div>

      {/* --------------------------------
          FOOTER
      -------------------------------- */}

      <div className="mt-3 text-[11px] text-slate-400 flex flex-col gap-1">

        <span>
          Acquisition pipeline:{" "}
          <strong className="text-slate-300">
            100 Hz
          </strong>{" "}
          • synchronized Dual-IMU measurements
        </span>

        <span className="text-rose-300 font-medium">
          ⚠ Hesitation detected around θ_crit ={" "}
          {thetaCrit.toFixed(1)}°.
        </span>

      </div>

    </div>
  );
};