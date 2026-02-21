import { useState } from "react";
import { Phone, X, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

const EMERGENCY_CONTACTS = [
  { name: "National Emergency", number: "112", description: "All emergencies" },
  { name: "Lagos Emergency", number: "767", description: "Lagos State" },
  { name: "Lagos Emergency", number: "112", description: "Lagos State" },
  { name: "FRSC", number: "122", description: "Road accidents" },
  { name: "Fire Service", number: "01-7944929", description: "Fire emergencies" },
  { name: "Police", number: "199", description: "Crime & security" },
  { name: "Ambulance (LASAMBUS)", number: "767", description: "Lagos ambulance" },
  { name: "NEMA", number: "0800-2255-6362", description: "Disasters" },
  { name: "Poison Center", number: "01-7743929", description: "Poisoning" },
];

const TOP_CONTACTS = EMERGENCY_CONTACTS.slice(0, 4);

export function EmergencyBar() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        aria-label="Show emergency contacts"
        data-testid="emergency-bar-reopen"
      >
        <Phone className="h-5 w-5" />
      </button>
    );
  }

  const contactsToShow = expanded ? EMERGENCY_CONTACTS : TOP_CONTACTS;

  return (
    <div className="bg-red-700 text-white relative z-50" data-testid="emergency-bar">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 py-1.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <AlertTriangle className="h-3.5 w-3.5 text-red-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-100 hidden sm:inline">
              Emergency
            </span>
          </div>

          <div className="h-4 w-px bg-red-500 shrink-0 hidden sm:block" />

          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 md:gap-4">
              {contactsToShow.map((contact) => (
                <a
                  key={contact.name + contact.number}
                  href={`tel:${contact.number.replace(/[^0-9+]/g, "")}`}
                  className="flex items-center gap-1.5 shrink-0 group hover:bg-red-600/50 rounded-md px-2 py-0.5 transition-colors"
                  data-testid={`emergency-contact-${contact.number}`}
                >
                  <Phone className="h-3 w-3 text-red-300 group-hover:text-white" />
                  <span className="text-xs whitespace-nowrap">
                    <span className="font-medium">{contact.name}:</span>{" "}
                    <span className="font-bold">{contact.number}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-red-600/50 rounded transition-colors hidden sm:flex items-center gap-1"
              aria-label={expanded ? "Show fewer contacts" : "Show more contacts"}
              data-testid="emergency-bar-toggle"
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              <span className="text-[10px] uppercase tracking-wider">
                {expanded ? "Less" : "More"}
              </span>
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-red-600/50 rounded transition-colors"
              aria-label="Dismiss emergency bar"
              data-testid="emergency-bar-dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-red-600 pb-2 pt-1 sm:hidden">
            <div className="grid grid-cols-2 gap-1">
              {EMERGENCY_CONTACTS.slice(4).map((contact) => (
                <a
                  key={contact.name + contact.number}
                  href={`tel:${contact.number.replace(/[^0-9+]/g, "")}`}
                  className="flex items-center gap-1.5 hover:bg-red-600/50 rounded-md px-2 py-1 transition-colors"
                  data-testid={`emergency-contact-${contact.number}`}
                >
                  <Phone className="h-3 w-3 text-red-300" />
                  <span className="text-xs whitespace-nowrap">
                    <span className="font-medium">{contact.name}:</span>{" "}
                    <span className="font-bold">{contact.number}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
