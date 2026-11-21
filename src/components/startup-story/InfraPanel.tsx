import type { StartupInfraCatalog, StartupInfraItem, StartupRun } from "@/application/services/startupStoryService";
import { baht, ui } from "./startupStoryCatalog";

type Props = {
  run: StartupRun;
  catalog?: StartupInfraCatalog;
  pending: boolean;
  onAction: (action: string, index?: number, id?: string) => void;
};

const fixTags: Record<string, { label: string; tone: string }> = {
  app: { label: "App load", tone: "bg-[#bfe3f7]" },
  db: { label: "DB load", tone: "bg-[#fbd3b0]" },
  bugs: { label: "Bugs", tone: "bg-[#f7c6d9]" },
  spikes: { label: "Spikes", tone: "bg-[#cab2f1]" },
};

const branches = [
  { id: "servers", title: "Servers" },
  { id: "database", title: "Database" },
  { id: "speed", title: "Speed" },
  { id: "reliability", title: "Reliability" },
];

const tierCapacity = [0, 300, 700, 1200];

function Meter({ label, load, cap, visible }: { label: string; load: number; cap: number; visible: boolean }) {
  const pct = Math.min(100, Math.round((load / Math.max(cap, 1)) * 100));
  const tone = pct >= 100 ? "bg-[#e5484d]" : pct >= 80 ? "bg-[#e3683e]" : "bg-[#7bc4a8]";
  return <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 text-sm font-black">
    <span>{label}</span>
    <div className="h-3 rounded-full border-2 border-[#292542] bg-white" role="meter" aria-label={`${label} load`} aria-valuenow={visible ? pct : undefined} aria-valuemin={0} aria-valuemax={100}>
      {visible && <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />}
    </div>
    <span className="tabular-nums">{visible ? `${load.toLocaleString()} / ${cap.toLocaleString()}` : "??"}</span>
  </div>;
}

function Card({ item, owned, children }: { item: StartupInfraItem; owned?: boolean; children?: React.ReactNode }) {
  const tag = fixTags[item.fixes];
  return <div className={`${ui.card} space-y-2 p-3 ${owned ? "!bg-[#d6f0e4]" : ""}`}>
    <div className="flex flex-wrap items-center gap-2">
      <p className="font-black">{item.name}</p>
      {tag && <span className={`rounded-full border-2 border-[#292542] px-2 text-xs font-black ${tag.tone}`}>{tag.label}</span>}
      {owned && <span className="text-xs font-black">Owned</span>}
    </div>
    <dl className="space-y-1 text-xs">
      <div><dt className="inline font-black">What: </dt><dd className="inline">{item.what}</dd></div>
      <div><dt className="inline font-black">You need it when: </dt><dd className="inline">{item.need}</dd></div>
      <div><dt className="inline font-black">In game: </dt><dd className="inline">{item.effect}{item.bill ? ` Bill ${baht(item.bill)}/project.` : ""}</dd></div>
    </dl>
    <p lang="th" className="text-xs opacity-75">{item.thai}</p>
    {children}
  </div>;
}

export function InfraPanel({ run, catalog, pending, onAction }: Props) {
  const infra = run.infra;
  const load = run.load;
  if (!infra || !load || !catalog) {
    return <div className={`${ui.card} space-y-3 p-4 text-sm font-bold`}>
      <p>This run started before servers existed in the game. It keeps playing the old way.</p>
      <button className={`${ui.button} w-full bg-[#7bc4a8]`} disabled={pending} onClick={() => onAction("server")}>Set up servers anyway</button>
    </div>;
  }
  const item = (id: string) => catalog.items.find((it) => it.id === id);
  const owns = (id: string) => (infra.parts ?? []).includes(id);
  const monitored = owns("monitoring");
  const upgradePrice = (tier: number) => catalog.upgrade[tier - 1];
  const nextServer = load.next_server;
  const replicas = infra.replicas ?? 0;
  const buy = (price: number) => pending || run.money < price;

  const partButton = (id: string) => {
    const it = item(id);
    if (!it || owns(id)) return null;
    if (run.act < it.act) return <p className="text-xs font-black opacity-70">Unlocks in Act {it.act}</p>;
    return <button className={`${ui.button} w-full bg-[#fbe39a] py-2`} disabled={buy(it.price)} onClick={() => onAction("part", 0, id)}>Buy {baht(it.price)}</button>;
  };

  const column = (branch: string) => {
    if (branch === "servers") {
      const server = item("server");
      const lb = item("lb");
      return <>
        {infra.servers.map((s, i) => <div key={i} className={`${ui.card} space-y-2 p-3`}>
          <p className="font-black">Server {i + 1} · {tierCapacity[Math.min(s.cpu, s.ram)].toLocaleString()} req/s{i > 0 && !owns("lb") ? " · idle (no load balancer)" : ""}</p>
          <div className="grid grid-cols-2 gap-2">
            {(["cpu", "ram"] as const).map((part) => {
              const tier = s[part];
              const weakest = s.cpu !== s.ram && tier === Math.min(s.cpu, s.ram);
              return <button key={part} className={`${ui.button} px-2 py-2 text-xs ${weakest ? "bg-[#fbd3b0]" : "bg-white"}`} disabled={tier >= 3 || buy(upgradePrice(tier))} onClick={() => onAction(part, i)}>
                {part.toUpperCase()} {tier}{tier < 3 ? ` → ${tier + 1} · ${baht(upgradePrice(tier))}` : " · max"}{weakest ? " · bottleneck" : ""}
              </button>;
            })}
          </div>
        </div>)}
        {server && <Card item={server}>
          <button className={`${ui.button} w-full bg-[#fbe39a] py-2`} disabled={buy(nextServer)} onClick={() => onAction("server")}>Add a server {baht(nextServer)}</button>
        </Card>}
        {lb && <Card item={lb} owned={owns("lb")}>{partButton("lb")}</Card>}
        {catalog.items.filter((it) => it.branch === "servers" && it.id !== "server" && it.id !== "lb").map((it) => <Card key={it.id} item={it} owned={owns(it.id)}>{partButton(it.id)}</Card>)}
      </>;
    }
    if (branch === "database") {
      const dbs = catalog.items.filter((it) => it.id.startsWith("db:"));
      const current = dbs.find((it) => it.id === `db:${infra.db}`);
      const others = dbs.filter((it) => it !== current);
      const index = item("index");
      const replica = item("replica");
      return <>
        {current && <Card item={current} owned />}
        {index && <Card item={index} owned={owns("index")}>{partButton("index")}</Card>}
        {replica && <Card item={replica} owned={replicas > 0}>
          {replicas > 0 && <p className="text-xs font-black">You have {replicas} {replicas === 1 ? "replica" : "replicas"}.</p>}
          {run.act < replica.act
            ? <p className="text-xs font-black opacity-70">Unlocks in Act {replica.act}</p>
            : infra.db === "sqlite"
              ? <p className="text-xs font-black opacity-70">Move to a bigger database first.</p>
              : <button className={`${ui.button} w-full bg-[#fbe39a] py-2`} disabled={buy(load.next_replica)} onClick={() => onAction("replica")}>Add a replica {baht(load.next_replica)}</button>}
        </Card>}
        <details className={`${ui.card} p-3`}>
          <summary className="cursor-pointer font-black">Switch database ({others.length} options)</summary>
          <div className="mt-3 space-y-3">
            {others.map((it) => <Card key={it.id} item={it}>
              <button className={`${ui.button} w-full bg-white py-2`} disabled={buy(it.price)} onClick={() => onAction("db", 0, it.id.slice(3))}>Migrate {baht(it.price)} · +3 bugs next project</button>
            </Card>)}
          </div>
        </details>
      </>;
    }
    return catalog.items.filter((it) => it.branch === branch).map((it) => <Card key={it.id} item={it} owned={owns(it.id)}>{partButton(it.id)}</Card>);
  };

  return <div className="space-y-3">
    <div className={`${ui.card} space-y-2 p-4`}>
      <Meter label="App" load={load.app} cap={load.app_cap} visible={monitored} />
      <Meter label="DB" load={load.db} cap={load.db_cap} visible={monitored} />
      <p className="text-xs font-bold">
        {monitored ? "Load next ship, from your fans. Keep both bars out of the red." : "Buy Monitoring to see these before you ship. Without it you find out from angry users."}
      </p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {branches.map((b) => <section key={b.id} className="space-y-3" aria-label={b.title}>
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{b.title}</h3>
        {column(b.id)}
      </section>)}
    </div>
  </div>;
}
