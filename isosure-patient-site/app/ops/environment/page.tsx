"use client";

import { useState } from "react";
import { OpsGate } from "@/components/OpsGate";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { EquipmentKind, IsoClass } from "@/lib/lims-types";

const ISO: IsoClass[] = ["unclassified", "ISO 8", "ISO 7", "ISO 5"];
const KINDS: EquipmentKind[] = ["balance", "hood", "fridge", "incubator", "room"];

export default function EnvironmentPage() {
  const { envLogs, equipmentLogs, user, addEnvironmentLog, addEquipmentLog } = useStore();
  const by = user?.role === "pharmacy" ? user.contactName : "Lab";
  const [area, setArea] = useState("Nonsterile suite");
  const [isoClass, setIsoClass] = useState<IsoClass>("unclassified");
  const [temp, setTemp] = useState("21.5");
  const [rh, setRh] = useState("45");
  const [equipName, setEquipName] = useState("Analytical balance");
  const [kind, setKind] = useState<EquipmentKind>("balance");
  const [reading, setReading] = useState("");

  return (
    <OpsGate>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Not owned by QMS</p>
        <h1 className="mt-2 text-3xl font-semibold">Equipment &amp; environment logs</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Temperature, humidity, and ISO classification readings for compounding areas, plus
          balance / hood / fridge checks. Out-of-spec rows stay visible to the lab — they never
          appear in the provider portal.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <form
            className="space-y-3 rounded-xl border border-line bg-paper p-5"
            onSubmit={(e) => {
              e.preventDefault();
              const temperatureC = Number(temp);
              const humidityPct = Number(rh);
              const inSpec =
                temperatureC >= 20 &&
                temperatureC <= 25 &&
                humidityPct >= 30 &&
                humidityPct <= 60;
              addEnvironmentLog({
                area,
                isoClass,
                temperatureC,
                humidityPct,
                recordedAt: new Date().toISOString(),
                recordedBy: by,
                inSpec,
                note: inSpec ? "In range" : "Out of range — investigate before compounding",
              });
            }}
          >
            <h2 className="font-semibold">Record environment</h2>
            <input className="w-full rounded-lg border border-line px-3 py-2" value={area} onChange={(e) => setArea(e.target.value)} />
            <select className="w-full rounded-lg border border-line px-3 py-2" value={isoClass} onChange={(e) => setIsoClass(e.target.value as IsoClass)}>
              {ISO.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-lg border border-line px-3 py-2" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="°C" />
              <input className="rounded-lg border border-line px-3 py-2" value={rh} onChange={(e) => setRh(e.target.value)} placeholder="% RH" />
            </div>
            <p className="text-xs text-ink-soft">In-spec: 20–25 °C and 30–60% RH (nonsterile). ISO class is recorded as-read.</p>
            <button type="submit" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
              Save reading
            </button>
          </form>

          <form
            className="space-y-3 rounded-xl border border-line bg-paper p-5"
            onSubmit={(e) => {
              e.preventDefault();
              addEquipmentLog({
                equipmentId: kind,
                equipmentName: equipName,
                kind,
                reading,
                recordedAt: new Date().toISOString(),
                recordedBy: by,
                inSpec: true,
              });
              setReading("");
            }}
          >
            <h2 className="font-semibold">Record equipment</h2>
            <input className="w-full rounded-lg border border-line px-3 py-2" value={equipName} onChange={(e) => setEquipName(e.target.value)} />
            <select className="w-full rounded-lg border border-line px-3 py-2" value={kind} onChange={(e) => setKind(e.target.value as EquipmentKind)}>
              {KINDS.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <input required className="w-full rounded-lg border border-line px-3 py-2" value={reading} onChange={(e) => setReading(e.target.value)} placeholder="Reading / calibration result" />
            <button type="submit" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
              Save log
            </button>
          </form>
        </div>

        <h2 className="mt-10 text-xl font-semibold">Environment</h2>
        <div className="mt-3 space-y-2">
          {envLogs.map((log) => (
            <article key={log.id} className={`rounded-xl border bg-paper p-4 ${log.inSpec ? "border-line" : "border-danger"}`}>
              <p className="font-semibold">
                {log.area} · {log.isoClass} · {log.temperatureC} °C · {log.humidityPct}% RH
              </p>
              <p className="text-sm text-ink-soft">
                {formatDateTime(log.recordedAt)} · {log.recordedBy} · {log.inSpec ? "In spec" : "OUT OF SPEC"}
              </p>
              {log.note ? <p className="mt-1 text-sm">{log.note}</p> : null}
            </article>
          ))}
        </div>

        <h2 className="mt-10 text-xl font-semibold">Equipment</h2>
        <div className="mt-3 space-y-2">
          {equipmentLogs.map((log) => (
            <article key={log.id} className="rounded-xl border border-line bg-paper p-4">
              <p className="font-semibold">{log.equipmentName}</p>
              <p className="text-sm">{log.reading}</p>
              <p className="text-sm text-ink-soft">
                {formatDateTime(log.recordedAt)} · {log.recordedBy}
              </p>
            </article>
          ))}
        </div>
      </div>
    </OpsGate>
  );
}
