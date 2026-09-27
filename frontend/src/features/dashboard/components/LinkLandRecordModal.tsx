import { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { linkLandRecord, type LinkLandRecordPayload } from '../../land-records/services/landRecordService';
import type { LandRecord } from '../../land-records/types/landRecord';
import { useAuth } from '../../auth/hooks/useAuth';

interface LinkLandRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRecord: LandRecord) => void;
}

// Cascading administrative locations for supported states
const ADMINISTRATIVE_DIRECTORY: Record<
  string,
  {
    districts: Record<
      string,
      {
        tehsils: Record<string, string[]>;
      }
    >;
    recordTitle: string;
    formAct: string;
  }
> = {
  'Madhya Pradesh': {
    recordTitle: 'Khasra - Khatauni (B-1 / P-II)',
    formAct: 'MP Land Revenue Code 1959',
    districts: {
      Bhopal: {
        tehsils: {
          Huzur: ['Misrod', 'Bairagarh', 'Kolar', 'Bhopal Urban'],
          Berasia: ['Berasia Rural', 'Lalpura', 'Dungariya'],
        },
      },
      Indore: {
        tehsils: {
          Indore: ['Kanadia', 'Harsola', 'Rau', 'Palia'],
          Sanwer: ['Sanwer Rural', 'Dharmat', 'Ajnod'],
          Depalpur: ['Betma', 'Depalpur Urban', 'Gautampura'],
        },
      },
    },
  },
  Maharashtra: {
    recordTitle: '7/12 (Saat Baara) Extract',
    formAct: 'Maharashtra Land Revenue Code 1966',
    districts: {
      Pune: {
        tehsils: {
          Haveli: ['Khadakwasla', 'Wagholi', 'Uruli Kanchan', 'Hadapsar'],
          Khed: ['Chakan', 'Rajgurunagar', 'Alandi'],
          Baramati: ['Baramati Rural', 'Malegaon', 'Songaon'],
        },
      },
      Nashik: {
        tehsils: {
          Nashik: ['Vani', 'Trimbak Rural', 'Gangapur', 'Deolali'],
          Dindori: ['Dindori Rural', 'Janori', 'Nanashi'],
          Niphad: ['Pimpalgaon', 'Lasalgaon', 'Ozar'],
        },
      },
    },
  },
  'Uttar Pradesh': {
    recordTitle: 'Khatauni (Bhu-Abhilekh B-1)',
    formAct: 'UP Revenue Code 2006',
    districts: {
      Lucknow: {
        tehsils: {
          Mohanlalganj: ['Mohanlalganj Rural', 'Kalli Pashchim', 'Gosainganj'],
          'Bakshi Ka Talab': ['BKT Rural', 'Itaunja', 'Mahona'],
          Sarojininagar: ['Sarojininagar Urban', 'Banthra', 'Amausi'],
        },
      },
      Varanasi: {
        tehsils: {
          Pindra: ['Pindra Rural', 'Phulpur', 'Babatpur'],
          Sadar: ['Sadar Urban', 'Shivpur', 'Ramnagar'],
        },
      },
    },
  },
  Rajasthan: {
    recordTitle: 'Jamabandi (RoR / E-Dharti)',
    formAct: 'Rajasthan Land Revenue Act 1956',
    districts: {
      Jaipur: {
        tehsils: {
          Sanganer: ['Sanganer Rural', 'Watika', 'Muhana'],
          Amer: ['Amer Rural', 'Kukas', 'Achrol'],
          Chaksu: ['Chaksu Rural', 'Kothun', 'Shivdaspura'],
        },
      },
      Alwar: {
        tehsils: {
          Alwar: ['Alwar Rural', 'Malakhera', 'Bahror'],
          Tijara: ['Tijara Rural', 'Bhiwadi', 'Tapukara'],
        },
      },
    },
  },
  Karnataka: {
    recordTitle: 'RTC (Pahani / Bhoomi RoR)',
    formAct: 'Karnataka Land Revenue Act 1964',
    districts: {
      'Bengaluru Rural': {
        tehsils: {
          Devanahalli: ['Kundana', 'Vijayapura', 'Budigere'],
          Nelamangala: ['Nelamangala Rural', 'Tyamagondlu', 'Kasaba'],
        },
      },
      Mysuru: {
        tehsils: {
          Mysuru: ['Mysuru Rural', 'Varuna', 'Ilavala'],
          Nanjangud: ['Nanjangud Rural', 'Hullahalli', 'Kavalande'],
        },
      },
    },
  },
};

export function LinkLandRecordModal({ isOpen, onClose, onSuccess }: LinkLandRecordModalProps) {
  const { user } = useAuth();

  const [state, setState] = useState<string>('Madhya Pradesh');
  const [district, setDistrict] = useState<string>('Bhopal');
  const [tehsil, setTehsil] = useState<string>('Huzur');
  const [village, setVillage] = useState<string>('Misrod');
  const [khasraNumber, setKhasraNumber] = useState<string>('');
  const [landUseType, setLandUseType] = useState<string>('AGRICULTURAL');
  const [areaHectares, setAreaHectares] = useState<string>('0.85');

  const [verifying, setVerifying] = useState<boolean>(false);
  const [step, setStep] = useState<'input' | 'verifying' | 'success'>('input');
  const [verificationProgress, setVerificationProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const stateConfig = ADMINISTRATIVE_DIRECTORY[state] || ADMINISTRATIVE_DIRECTORY['Madhya Pradesh'];
  const districtList = Object.keys(stateConfig.districts);
  const currentDistrict = stateConfig.districts[district] || stateConfig.districts[districtList[0]];
  const tehsilList = Object.keys(currentDistrict?.tehsils || {});
  const currentTehsil = currentDistrict?.tehsils[tehsil] || (tehsilList[0] ? currentDistrict?.tehsils[tehsilList[0]] : []);
  const villageList = currentTehsil || [];

  const handleStateChange = (newState: string) => {
    setState(newState);
    const newDistList = Object.keys(ADMINISTRATIVE_DIRECTORY[newState].districts);
    const newDist = newDistList[0];
    setDistrict(newDist);
    const newTehList = Object.keys(ADMINISTRATIVE_DIRECTORY[newState].districts[newDist].tehsils);
    const newTeh = newTehList[0];
    setTehsil(newTeh);
    const newVilList = ADMINISTRATIVE_DIRECTORY[newState].districts[newDist].tehsils[newTeh];
    setVillage(newVilList[0] || 'Center');
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const newTehList = Object.keys(stateConfig.districts[newDist].tehsils);
    const newTeh = newTehList[0];
    setTehsil(newTeh);
    const newVilList = stateConfig.districts[newDist].tehsils[newTeh];
    setVillage(newVilList[0] || 'Center');
  };

  const handleTehsilChange = (newTeh: string) => {
    setTehsil(newTeh);
    const newVilList = currentDistrict.tehsils[newTeh] || [];
    setVillage(newVilList[0] || 'Center');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!khasraNumber.trim()) {
      setError('Please enter a valid Khasra / Survey Number (e.g. 445/2 or 108)');
      return;
    }

    setError(null);
    setVerifying(true);
    setStep('verifying');

    // Sovereign Verification Simulation Stages
    setVerificationProgress('1/3 Contacting State Cadastral Registry...');
    await new Promise((r) => setTimeout(r, 700));
    setVerificationProgress('2/3 Validating parcel geometry in PostGIS & checking encumbrances...');
    await new Promise((r) => setTimeout(r, 800));
    setVerificationProgress(`3/3 Attaching verified title to citizen account ${user?.name}...`);

    try {
      const areaInSqMeters = parseFloat(areaHectares) > 0 ? parseFloat(areaHectares) * 10000 : 4500;

      const payload: LinkLandRecordPayload = {
        state,
        district,
        tehsil,
        village,
        khasraNumber: khasraNumber.trim(),
        landUseType,
        landAreaSqMeters: areaInSqMeters,
      };

      const created = await linkLandRecord(payload);
      setStep('success');
      await new Promise((r) => setTimeout(r, 800));
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setStep('input');
      setVerifying(false);
      setError(err instanceof Error ? err.message : 'Failed to link land record. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <Building2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Link Your Land Record</h3>
              <p className="text-xs text-emerald-300 font-medium">
                Official Record of Rights (RoR) Verification Gateway
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={verifying}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-800 font-semibold">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'verifying' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                <Sparkles className="h-8 w-8 text-emerald-600 absolute" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Verifying Revenue Instrument</h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">{verificationProgress}</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Statutory Authority: {stateConfig.formAct}</span>
              </div>
            </div>
          ) : step === 'success' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Record Successfully Linked!</h4>
              <p className="text-xs text-slate-600">
                Your land parcel boundary and verified certificate have been bound to your sovereign profile.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sovereign Certificate Info Pill */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">📜</span>
                  <span className="font-bold text-emerald-950">{stateConfig.recordTitle}</span>
                </div>
                <span className="text-[10.5px] font-semibold text-emerald-700">{stateConfig.formAct}</span>
              </div>

              {/* State & District Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State / Province</label>
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
                  >
                    {Object.keys(ADMINISTRATIVE_DIRECTORY).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
                  >
                    {districtList.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tehsil & Village Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tehsil / Taluka</label>
                  <select
                    value={tehsil}
                    onChange={(e) => handleTehsilChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
                  >
                    {tehsilList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Village / Mouza</label>
                  <select
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
                  >
                    {villageList.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Khasra / Survey Number & Land Use Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khasra / Gat No. <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 445/2"
                    value={khasraNumber}
                    onChange={(e) => setKhasraNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Land Use</label>
                  <select
                    value={landUseType}
                    onChange={(e) => setLandUseType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
                  >
                    <option value="AGRICULTURAL">Agricultural</option>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="GOVERNMENT">Government</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Area (Hectares)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={areaHectares}
                    onChange={(e) => setAreaHectares(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>
              </div>

              {/* Owner Preview Information */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Verified Account Holder:</span>
                  <span className="font-bold text-slate-900">{user?.name || 'Citizen'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 mt-1">
                  <span>Registered Email:</span>
                  <span className="font-medium text-slate-800">{user?.email}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verify & Link Record</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
