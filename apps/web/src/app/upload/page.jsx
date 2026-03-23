import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Download,
} from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dataType, setDataType] = useState("sales");
  const [parsing, setParsing] = useState(false);
  const queryClient = useQueryClient();

  const ownerId = "default_owner";
  const { data: business } = useQuery({
    queryKey: ["business", ownerId],
    queryFn: async () => {
      const res = await fetch(`/api/business?ownerId=${ownerId}`);
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/data-ingestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, type: dataType, data }),
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Data synced successfully");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setFile(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDownloadTemplate = (type) => {
    window.location.href = `/api/csv-template?type=${type}`;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "text/csv") {
      setFile(selected);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const handleProcess = () => {
    if (!file || !business) return;
    setParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsing(false);
        if (results.data && results.data.length > 0) {
          // Basic cleaning: convert strings to numbers
          const cleaned = results.data.map((row) => {
            const newRow = { ...row };
            if (row.quantity) newRow.quantity = Number(row.quantity);
            if (row.price) newRow.price = Number(row.price);
            if (row.cost) newRow.cost = Number(row.cost);
            if (row.unit_cost) newRow.unit_cost = Number(row.unit_cost);
            return newRow;
          });
          uploadMutation.mutate(cleaned);
        }
      },
      error: (err) => {
        setParsing(false);
        toast.error("Error parsing CSV file");
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Data Sync</h2>
        <p className="text-slate-500 mt-1">
          Upload your CSV records to update LifeOS.
        </p>
      </div>

      {/* CSV Templates Section */}
      <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-indigo-100 p-3 shrink-0">
            <FileText className="text-indigo-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-indigo-900 mb-2">
              First time uploading?
            </h3>
            <p className="text-sm text-indigo-700 mb-4">
              Download our CSV templates to see the exact format LifeOS expects.
              Fill them with your business data and upload below.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDownloadTemplate("sales")}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors"
              >
                <Download size={16} />
                Sales Template
              </button>
              <button
                onClick={() => handleDownloadTemplate("inventory")}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors"
              >
                <Download size={16} />
                Inventory Template
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-8">
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setDataType("sales")}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${dataType === "sales" ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"}`}
          >
            <FileText size={32} />
            <span className="font-semibold">Sales Records</span>
          </button>
          <button
            onClick={() => setDataType("inventory")}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${dataType === "inventory" ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"}`}
          >
            <CheckCircle2 size={32} />
            <span className="font-semibold">Inventory List</span>
          </button>
        </div>

        {/* Upload Area */}
        <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center transition-colors hover:bg-slate-100">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
          />
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <Upload size={24} />
            </div>
            <p className="text-sm font-medium text-slate-900">
              {file ? file.name : "Drop your CSV here or click to browse"}
            </p>
            <p className="text-xs text-slate-500">
              Max size 4.5MB. Supported format: .csv
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-xl bg-amber-50 p-4 flex gap-3">
          <Info className="text-amber-600 shrink-0" size={20} />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-bold">Required Columns for {dataType}:</p>
            {dataType === "sales" ? (
              <p>
                item_name, price, cost, quantity, category (optional), sale_date
                (optional)
              </p>
            ) : (
              <p>
                item_name, quantity, unit_cost, category (optional),
                reorder_level (optional)
              </p>
            )}
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleProcess}
          disabled={!file || parsing || uploadMutation.isPending}
          className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {parsing || uploadMutation.isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Processing data...
            </>
          ) : (
            "Sync to LifeOS"
          )}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-slate-900 font-semibold mb-4">
          <AlertCircle size={20} className="text-slate-400" />
          <h3>Data Security</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your business data is encrypted and used only for your private
          analysis. LifeOS does not share your raw data with third parties. AI
          processing is anonymized to ensure your competitive edge remains
          yours.
        </p>
      </div>
    </div>
  );
}
