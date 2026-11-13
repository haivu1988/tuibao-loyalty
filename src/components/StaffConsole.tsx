"use client";

import { useState } from "react";
import CustomerSearch from "./CustomerSearch";
import AddTickForm from "./AddTickForm";
import RedeemGift from "./RedeemGift";
import CustomerQR from "./CustomerQR";
import type { Customer, Gift } from "@/types";

export default function StaffConsole({ gifts }: { gifts: Gift[] }) {
  const [customer, setCustomer] = useState<Customer | null>(null);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <CustomerSearch onFound={setCustomer} />
      </div>

      <div>
        {!customer ? (
          <div className="card flex h-full min-h-[200px] items-center justify-center text-center text-sm text-slate-400">
            Chưa chọn khách. Nhập số điện thoại để bắt đầu.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Thẻ khách */}
            <div className="card bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-80">
                    {customer.full_name || "Khách chưa đặt tên"}
                  </p>
                  <p className="text-lg font-semibold">{customer.phone}</p>
                </div>
                <button
                  onClick={() => setCustomer(null)}
                  className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-medium hover:bg-white/30"
                >
                  Đổi khách
                </button>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-black leading-none">
                  {customer.ticks}
                </span>
                <span className="mb-1 text-sm opacity-80">tick hiện có</span>
              </div>
            </div>

            {/* QR cho khách tự xem */}
            <div className="card flex justify-center">
              <CustomerQR phone={customer.phone} />
            </div>

            {/* Tích tick */}
            <div className="card">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Tích tick</h3>
              <AddTickForm customer={customer} onUpdated={setCustomer} />
            </div>

            {/* Đổi quà */}
            <div className="card">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Đổi quà</h3>
              <RedeemGift
                customer={customer}
                gifts={gifts}
                onUpdated={setCustomer}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
