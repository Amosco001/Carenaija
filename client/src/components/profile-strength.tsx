import { useMemo } from "react";
import { Check, X, Phone, Globe, Clock, Stethoscope, Building2, Briefcase, MapPin, Camera, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Hospital {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  operatingHours?: string | null;
  services?: string[] | null;
  facilities?: string[] | null;
  acceptedHmos?: string[] | null;
  bedCapacity?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  verified?: boolean;
}

interface ProfileField {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  filled: boolean;
  weight: number;
}

function getProfileFields(hospital: Hospital): ProfileField[] {
  return [
    {
      label: "Phone number",
      icon: Phone,
      filled: !!hospital.phone,
      weight: 15,
    },
    {
      label: "Email address",
      icon: Globe,
      filled: !!hospital.email,
      weight: 10,
    },
    {
      label: "Website",
      icon: Globe,
      filled: !!hospital.website,
      weight: 10,
    },
    {
      label: "Operating hours",
      icon: Clock,
      filled: !!hospital.operatingHours,
      weight: 15,
    },
    {
      label: "Services listed (3+)",
      icon: Stethoscope,
      filled: (hospital.services?.length || 0) >= 3,
      weight: 15,
    },
    {
      label: "Facilities listed",
      icon: Building2,
      filled: (hospital.facilities?.length || 0) > 0,
      weight: 10,
    },
    {
      label: "HMO / Insurance",
      icon: Briefcase,
      filled: (hospital.acceptedHmos?.length || 0) > 0,
      weight: 10,
    },
    {
      label: "Bed capacity",
      icon: MapPin,
      filled: !!hospital.bedCapacity,
      weight: 5,
    },
    {
      label: "Map location",
      icon: MapPin,
      filled: !!hospital.latitude && !!hospital.longitude,
      weight: 10,
    },
  ];
}

function getStrengthLabel(score: number): { text: string; color: string; bg: string } {
  if (score >= 90) return { text: "Excellent", color: "text-emerald-700", bg: "bg-emerald-500" };
  if (score >= 70) return { text: "Strong", color: "text-emerald-600", bg: "bg-emerald-500" };
  if (score >= 50) return { text: "Good", color: "text-amber-600", bg: "bg-amber-500" };
  if (score >= 30) return { text: "Fair", color: "text-orange-600", bg: "bg-orange-500" };
  return { text: "Needs Work", color: "text-red-600", bg: "bg-red-500" };
}

export function ProfileStrength({ hospital }: { hospital: Hospital }) {
  const fields = useMemo(() => getProfileFields(hospital), [hospital]);

  const score = useMemo(() => {
    const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
    const filledWeight = fields.reduce((sum, f) => sum + (f.filled ? f.weight : 0), 0);
    return Math.round((filledWeight / totalWeight) * 100);
  }, [fields]);

  const strength = getStrengthLabel(score);
  const filledCount = fields.filter(f => f.filled).length;
  const missingFields = fields.filter(f => !f.filled);

  return (
    <div className="bg-white rounded-xl border p-5" data-testid="profile-strength-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 text-sm">Profile Strength</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${strength.color} bg-opacity-10`} style={{ backgroundColor: `color-mix(in srgb, currentColor 12%, transparent)` }} data-testid="profile-strength-label">
          {strength.text}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Progress value={score} className="h-3 rounded-full" />
        </div>
        <span className="text-lg font-bold text-slate-900" data-testid="profile-strength-score">{score}%</span>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        {filledCount} of {fields.length} profile fields completed
      </p>

      <div className="space-y-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className={`flex items-center gap-2.5 text-sm py-1.5 px-2 rounded-lg transition-colors ${
              field.filled ? "text-slate-500" : "text-slate-700 bg-slate-50"
            }`}
            data-testid={`profile-field-${field.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
          >
            {field.filled ? (
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <X className="w-3 h-3 text-slate-400" />
              </div>
            )}
            <field.icon className={`w-4 h-4 shrink-0 ${field.filled ? "text-slate-400" : "text-slate-500"}`} />
            <span className={field.filled ? "line-through decoration-slate-300" : "font-medium"}>
              {field.label}
            </span>
          </div>
        ))}
      </div>

      {missingFields.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-slate-500">
            Complete missing fields to improve visibility and help patients find this hospital.
          </p>
        </div>
      )}

      {score === 100 && (
        <div className="mt-4 pt-3 border-t flex items-center gap-2 text-emerald-600">
          <Shield className="w-4 h-4" />
          <p className="text-xs font-medium">
            This hospital has a complete profile!
          </p>
        </div>
      )}
    </div>
  );
}
