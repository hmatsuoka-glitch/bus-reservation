"use client";

interface MapViewProps {
  lat?: number | null;
  lng?: number | null;
  stopName: string;
}

export function MapView({ lat, lng, stopName }: MapViewProps) {
  const query = encodeURIComponent(stopName);
  const hasCoords = lat && lng;

  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${query}&z=15&output=embed`;

  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className="space-y-3">
      {/* Stop name */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <div>
          <div className="text-xs text-gray-500">乗車バス停</div>
          <div className="font-semibold text-gray-800">{stopName}</div>
        </div>
      </div>

      {/* Map embed */}
      <div className="rounded-xl overflow-hidden border border-gray-200 h-56">
        <iframe
          src={embedSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${stopName}の地図`}
        />
      </div>

      {/* Open in Google Maps */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        Google マップで開く
      </a>

      {/* Navigation tip */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-500 text-center">
          「Google マップで開く」からナビゲーションを開始できます
        </p>
      </div>
    </div>
  );
}
