'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { QrCode } from 'lucide-react'

interface Props {
  phone: string
  baseUrl?: string
}

export default function QRCodeDisplay({ phone, baseUrl }: Props) {
  const [show, setShow] = useState(false)
  const url = `${baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')}/check/${encodeURIComponent(phone)}`

  return (
    <div className="card">
      <button
        onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-bold text-gray-900 flex items-center gap-2">
          <QrCode size={18} /> Mã QR check điểm
        </span>
        <span className="text-green-600 text-sm">{show ? 'Ẩn' : 'Hiện'}</span>
      </button>

      {show && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            <QRCodeSVG
              value={url}
              size={180}
              fgColor="#15803d"
              level="M"
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            Khách quét để xem số điểm của mình
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-green-600 underline break-all text-center"
          >
            {url}
          </a>
        </div>
      )}
    </div>
  )
}
