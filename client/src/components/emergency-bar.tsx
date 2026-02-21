import { useState } from "react";
import { Phone, X, AlertTriangle } from "lucide-react";

const EMERGENCY_CONTACTS = [
  { name: "National Emergency", number: "112", description: "All emergencies" },
  { name: "Lagos Emergency", number: "767", description: "Lagos State" },
  { name: "FRSC", number: "122", description: "Road accidents" },
  { name: "Fire Service", number: "01-7944929", description: "Fire emergencies" },
  { name: "Police", number: "199", description: "Crime & security" },
  { name: "Ambulance (LASAMBUS)", number: "767", description: "Lagos ambulance" },
  { name: "NEMA", number: "0800-2255-6362", description: "Disasters" },
  { name: "Poison Center", number: "01-7743929", description: "Poisoning" },
];

export function EmergencyBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2" data-testid="emergency-bar">
      {open && (
        <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-72 sm:w-80 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="bg-red-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-bold text-sm">Emergency Contacts</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Close emergency contacts"
              data-testid="emergency-bar-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {EMERGENCY_CONTACTS.map((contact) => (
              <a
                key={contact.name + contact.number}
                href={`tel:${contact.number.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0"
                data-testid={`emergency-contact-${contact.number}`}
              >
                <div className="bg-red-100 p-2 rounded-full shrink-0">
                  <Phone className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{contact.name}</p>
                  <p className="text-xs text-gray-500">{contact.description}</p>
                </div>
                <span className="text-sm font-bold text-red-700 shrink-0">{contact.number}</span>
              </a>
            ))}
          </div>
          <div className="bg-gray-50 px-4 py-2 text-center">
            <p className="text-[11px] text-gray-400">Tap a number to call directly</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={`p-3.5 rounded-full shadow-lg transition-all duration-200 ${
          open
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-red-600 hover:bg-red-700 hover:scale-105"
        }`}
        aria-label={open ? "Close emergency contacts" : "Show emergency contacts"}
        data-testid="emergency-bar-toggle"
      >
        {open ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <div className="relative">
            <Phone className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-white rounded-full animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
