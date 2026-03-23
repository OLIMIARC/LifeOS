import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Building2, Store, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const ownerId = "default_owner";

  const { data: business, isLoading } = useQuery({
    queryKey: ["business", ownerId],
    queryFn: async () => {
      const res = await fetch(`/api/business?ownerId=${ownerId}`);
      return res.json();
    },
  });

  const [form, setForm] = useState({
    name: business?.name || "",
    category: business?.category || "",
  });

  // Sync form with data when loaded
  React.useEffect(() => {
    if (business) {
      setForm({
        name: business.name || "",
        category: business.category || "",
      });
    }
  }, [business]);

  const mutation = useMutation({
    mutationFn: async (newData) => {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newData, ownerId }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Business settings updated");
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading)
    return (
      <div className="flex h-96 items-center justify-center">Loading...</div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Business Profile</h2>
        <p className="text-slate-500 mt-1">
          Manage how LifeOS identifies your business.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Business Name
              </label>
              <div className="relative">
                <Store
                  className="absolute left-3 top-3 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sunny Mini Market"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Business Category
              </label>
              <div className="relative">
                <Tag
                  className="absolute left-3 top-3 text-slate-400"
                  size={20}
                />
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a category</option>
                  <option value="Retail">Retail</option>
                  <option value="Supermarket">Supermarket</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Salon">Salon</option>
                  <option value="Hardware">Hardware Store</option>
                  <option value="Services">Services</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:bg-slate-300 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {business ? "Update Business" : "Register Business"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <Building2 size={20} />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Scale with AI
          </h4>
          <p className="text-xs text-slate-500">
            LifeOS adapts its logic to your specific industry category.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <Store size={20} />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Local Context
          </h4>
          <p className="text-xs text-slate-500">
            Your recommendations are tuned to small business realities.
          </p>
        </div>
      </div>
    </div>
  );
}
