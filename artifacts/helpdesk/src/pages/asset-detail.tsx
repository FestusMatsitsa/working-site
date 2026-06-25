import { useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetAsset, getGetAssetQueryKey,
  useUpdateAsset,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Printer, QrCode, Monitor, Calendar, MapPin, User, Hash, Package } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  under_repair: "bg-orange-100 text-orange-700",
  disposed: "bg-red-100 text-red-700",
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const assetId = Number(id);

  const { data: asset, isLoading } = useGetAsset(assetId, { query: { queryKey: getGetAssetQueryKey(assetId) } });
  const { mutate: updateAsset } = useUpdateAsset();

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-muted rounded" /><div className="h-64 bg-muted rounded" /></div>;
  if (!asset) return <div className="text-muted-foreground text-center py-20">Asset not found.</div>;

  const qrValue = `${window.location.origin}/assets/${asset.id}`;

  function handlePrint() {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;
    const win = window.open("", "_blank", "width=400,height=500");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>Asset Label — ${asset.assetTag}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; }
        .label { border: 2px solid #1a3c2a; border-radius: 12px; padding: 20px 24px; width: 320px; text-align: center; }
        .org { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .tag { font-size: 24px; font-weight: 800; color: #1a3c2a; font-family: monospace; margin: 4px 0 12px; }
        .name { font-size: 13px; font-weight: 600; color: #222; margin-bottom: 2px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 12px; }
        .qr { display: flex; justify-content: center; margin: 8px 0; }
        .footer { font-size: 9px; color: #999; margin-top: 8px; }
      </style>
      </head><body>
      <div class="label">
        <div class="org">Kilifi County Government — ICT</div>
        <div class="tag">${asset.assetTag}</div>
        <div class="name">${asset.name}</div>
        <div class="meta">${asset.make ?? ""} ${asset.model ?? ""} ${asset.make || asset.model ? "·" : ""} ${asset.type?.toUpperCase()}</div>
        <div class="qr">${printRef.current?.querySelector("svg")?.outerHTML ?? ""}</div>
        <div class="footer">Scan to view full asset record</div>
      </div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  }

  function updateStatus(status: string) {
    updateAsset({ id: assetId, data: { status: status as any } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetAssetQueryKey(assetId) }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/assets")} className="p-2 rounded-md hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">{asset.assetTag}</h1>
            <p className="text-muted-foreground text-sm">{asset.name}</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          <Printer className="w-4 h-4" /> Print Label
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg bg-card shadow-sm p-6 grid grid-cols-2 gap-6">
            <DetailItem icon={<Monitor />} label="Asset Name" value={asset.name} />
            <DetailItem icon={<Package />} label="Type" value={asset.type?.toUpperCase()} />
            <DetailItem icon={<Hash />} label="Make / Model" value={[asset.make, asset.model].filter(Boolean).join(" ") || "—"} />
            <DetailItem icon={<Hash />} label="Serial Number" value={asset.serialNumber ?? "—"} />
            <DetailItem icon={<MapPin />} label="Location" value={asset.location ?? "—"} />
            <DetailItem icon={<User />} label="Assigned To" value={asset.assignedToName ?? "Unassigned"} />
            <DetailItem icon={<Calendar />} label="Purchase Date" value={asset.purchaseDate ? format(new Date(asset.purchaseDate), "MMM d, yyyy") : "—"} />
            <DetailItem icon={<Calendar />} label="Warranty Until" value={asset.warrantyUntil ? format(new Date(asset.warrantyUntil), "MMM d, yyyy") : "—"} />
            {asset.ipAddress && <DetailItem icon={<Hash />} label="IP Address" value={asset.ipAddress} />}
            {asset.macAddress && <DetailItem icon={<Hash />} label="MAC Address" value={asset.macAddress} />}
            <DetailItem icon={<Calendar />} label="Last Updated" value={asset.updatedAt ? format(new Date(asset.updatedAt), "MMM d, yyyy") : "—"} />
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[asset.status ?? ""] ?? ""}`}>
                  {asset.status?.replace("_", " ")}
                </span>
                <select
                  className="border rounded-md px-2 py-1 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  defaultValue=""
                  onChange={e => { if (e.target.value) updateStatus(e.target.value); e.target.value = ""; }}
                >
                  <option value="" disabled>Change status…</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under_repair">Under Repair</option>
                  <option value="disposed">Disposed</option>
                </select>
              </div>
            </div>
            {asset.notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{asset.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg bg-card shadow-sm p-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 self-start">
              <QrCode className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Asset QR Code</h3>
            </div>

            <div ref={printRef} className="p-4 bg-white border-2 border-primary/20 rounded-xl flex flex-col items-center gap-3 w-full">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Kilifi County — ICT</p>
              <p className="text-2xl font-black font-mono text-primary">{asset.assetTag}</p>
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="M"
                includeMargin
                imageSettings={{
                  src: "",
                  x: undefined,
                  y: undefined,
                  height: 0,
                  width: 0,
                  excavate: false,
                }}
              />
              <p className="text-xs text-muted-foreground text-center leading-tight">{asset.name}</p>
              <p className="text-[10px] text-muted-foreground/60 text-center">Scan to view asset record</p>
            </div>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Label
            </button>
            <p className="text-xs text-muted-foreground text-center">Prints a label-sized card with QR code suitable for sticking on the asset</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground w-4 h-4 mt-0.5 flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
