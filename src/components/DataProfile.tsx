import React, { useState } from "react";

/* =========================
 * 基础 UI 原子组件
 * ========================= */

function Section({
  title,
  color = "blue",
  children,
}: {
  title: string;
  color?: "blue" | "green" | "orange";
  children: React.ReactNode;
}) {
  const colorMap = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    orange: "bg-orange-500",
  };

  return (
    <section className="relative pl-4 space-y-3">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${colorMap[color]}`}
      />
      <h4 className="text-[16px] font-bold tracking-wide text-gray-800 flex items-center gap-2">
        {title}
        <span className="h-px flex-1 bg-gradient-to-r from-gray-300 to-transparent" />
      </h4>
      {children}
    </section>
  );
}

function InfoCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      {title && (
        <div className="px-4 py-2 border-b border-slate-100 text-[14px] font-bold text-gray-800">
          {title}
        </div>
      )}
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
      <span className="text-[14px] font-medium text-gray-700">
        {label}
      </span>
      <span className="text-[14px] text-gray-600 break-all">
        {value}
      </span>
    </div>
  );
}

function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "gray";
}) {
  const map = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[12px] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

/* =========================
 * JSON 查看器
 * ========================= */

function JsonViewer({ data }: { data: any }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-[13px] font-mono">
      <button
        onClick={() => setOpen(!open)}
        className="text-blue-600 hover:underline mb-2"
      >
        {open ? "Hide details" : "Show details"}
      </button>

      {open && (
        <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* =========================
 * Attributes 表格
 * ========================= */

function AttributeTable({ attributes }: { attributes: any[] }) {
  return (
    <table className="w-full text-[13px] border-collapse">
      <thead>
        <tr className="text-left text-gray-600 border-b">
          <th className="py-1">Name</th>
          <th>Type</th>
          <th>Unique</th>
          <th>Null</th>
        </tr>
      </thead>
      <tbody>
        {attributes.map((a, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="py-1 text-gray-800">{a.name}</td>
            <td className="text-gray-500">{a.type}</td>
            <td>{a.unique_count}</td>
            <td className={a.null_count > 0 ? "text-red-500" : ""}>
              {a.null_count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* =========================
 * 动态字段渲染
 * ========================= */

function renderDynamicFields(profile: any) {
  const commonKeys = ["Form", "Spatial", "Temporal", "Semantic", "Confidence"];

  return Object.entries(profile)
    .filter(([k, v]) => !commonKeys.includes(k) && v !== null)
    .map(([key, value]) => {
      if (key === "Attributes" && Array.isArray(value)) {
        return (
          <InfoCard key={key} title={`Attributes (${value.length})`}>
            <AttributeTable attributes={value} />
          </InfoCard>
        );
      }

      if (key === "Geometry_type" && typeof value === "object") {
        return (
          <InfoCard key={key} title="Geometry">
            <InfoRow label="Type" value={value.Type} />
            <InfoRow label="Features" value={value.Feature_count} />
            <Badge tone={value.Is_all_valid ? "green" : "red"}>
              {value.Is_all_valid ? "Topology Valid" : "Invalid Geometry"}
            </Badge>
          </InfoCard>
        );
      }

      if (typeof value === "object") {
        return (
          <InfoCard key={key} title={key}>
            <JsonViewer data={value} />
          </InfoCard>
        );
      }

      return (
        <InfoCard key={key}>
          <InfoRow label={key} value={String(value)} />
        </InfoCard>
      );
    });
}

/* =========================
 * 主渲染函数
 * ========================= */

export default function DataAnalysisProfile({ profile }: { profile: any }) {
  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <InfoCard title="Summary">
        <InfoRow label="Abstract" value={profile.Semantic?.Abstract} />
        <InfoRow
          label="Applications"
          value={profile.Semantic?.Applications?.join(", ")}
        />
      </InfoCard>

      {/* Spatial */}
      {profile.Spatial && (
        <Section title="Spatial Domain" color="blue">
          <InfoCard title="CRS">
            <InfoRow label="Name" value={profile.Spatial.Crs?.Name} />
            <InfoRow label="Datum" value={profile.Spatial.Crs?.Datum} />
            <InfoRow label="Projection" value={profile.Spatial.Crs?.Projection} />
            <InfoRow label="Unit" value={profile.Spatial.Crs?.Unit} />
          </InfoCard>

          <InfoCard title="Extent">
            <InfoRow
              label="X Range"
              value={`${profile.Spatial.Extent.min_x} ~ ${profile.Spatial.Extent.max_x} ${profile.Spatial.Extent.unit}`}
            />
            <InfoRow
              label="Y Range"
              value={`${profile.Spatial.Extent.min_y} ~ ${profile.Spatial.Extent.max_y} ${profile.Spatial.Extent.unit}`}
            />
          </InfoCard>
        </Section>
      )}

      {/* Temporal */}
      {profile.Temporal && (
        <Section title="Temporal Domain" color="orange">
          <InfoCard>
            <InfoRow
              label="Has Time"
              value={String(profile.Temporal.Has_time)}
            />
            <InfoRow
              label="Start"
              value={profile.Temporal.start_time || "N/A"}
            />
            <InfoRow
              label="End"
              value={profile.Temporal.end_time || "N/A"}
            />
          </InfoCard>
        </Section>
      )}

      {/* Special */}
      <Section title="Special Attributes" color="green">
        <div className="grid grid-cols-1 gap-4">
          {renderDynamicFields(profile)}
        </div>
      </Section>
    </div>
  );
}
