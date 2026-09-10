import { useState } from 'react';
import { submitComplaint, getComplaintCategories } from '../../services/complaintService';
import { reverseGeocode, searchAddress } from '../../services/geocodeService';
import LocationPickerMap from './LocationPickerMap';
import { useCity } from '../../hooks/useCity';
import { 
  AlertTriangle, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Navigation, 
  Sparkles,
  Upload,
  X,
  Eye,
  Loader2,
  Search
} from 'lucide-react';

/**
 * Modern Multi-Step Report Creation Wizard - EcoSathi Redesign
 */
const CITY_COORDINATES = {
  Pune: { lat: 18.5204, lng: 73.8567 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
};

export default function ComplaintForm({ onSubmitSuccess, onCancel, onViewReport }) {
  const { selectedCity } = useCity();

  // Multi-step progress (1: Details, 2: Location, 3: Evidence, 4: Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  const [category, setCategory] = useState('illegal-dumping');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(selectedCity || 'Pune');
  const [location, setLocation] = useState('');

  const defaultCoords = CITY_COORDINATES[selectedCity || 'Pune'] || CITY_COORDINATES.Pune;
  const [lat, setLat] = useState(defaultCoords.lat);
  const [lng, setLng] = useState(defaultCoords.lng);
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // States
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [hasGpsVerified, setHasGpsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);

  const categories = getComplaintCategories().filter((c) => c.value !== 'all');

  // Handle Photo Selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      setPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  // City Selector Change
  const handleCityChange = (newCity) => {
    setCity(newCity);
    if (!hasGpsVerified && CITY_COORDINATES[newCity]) {
      setLat(CITY_COORDINATES[newCity].lat);
      setLng(CITY_COORDINATES[newCity].lng);
    }
  };

  // GPS Location Handler - retrieves coordinates and performs reverse geocoding to address
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        setHasGpsVerified(true);
        setIsGettingLocation(false);

        // Reverse Geocode coordinates to actual readable street address
        setIsGeocoding(true);
        try {
          const geoRes = await reverseGeocode(userLat, userLng);
          if (geoRes?.address) {
            setLocation(geoRes.address);
            if (geoRes.city && CITY_COORDINATES[geoRes.city]) {
              setCity(geoRes.city);
            }
          } else {
            setLocation(`Lat: ${userLat.toFixed(4)}, Lng: ${userLng.toFixed(4)}`);
          }
        } catch (err) {
          console.warn('Geocoding error:', err);
          setLocation(`Lat: ${userLat.toFixed(4)}, Lng: ${userLng.toFixed(4)}`);
        } finally {
          setIsGeocoding(false);
        }
      },
      (err) => {
        setIsGettingLocation(false);
        setError('Could not retrieve GPS location. Please allow browser location access or tap on the map.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Map Tap / Pin Drag Handler - updates coordinates and reverse geocodes the new spot
  const handleMapLocationSelect = async (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
    setHasGpsVerified(true);
    setIsGeocoding(true);
    setError(null);

    try {
      const geoRes = await reverseGeocode(newLat, newLng);
      if (geoRes?.address) {
        setLocation(geoRes.address);
        if (geoRes.city && CITY_COORDINATES[geoRes.city]) {
          setCity(geoRes.city);
        }
      } else {
        setLocation(`Selected spot: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
      }
    } catch (err) {
      console.warn('Map geocoding error:', err);
      setLocation(`Selected spot: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Address Search Handler
  const handleSearchAddress = async (e) => {
    if (e) e.preventDefault();
    if (!location || location.trim().length < 3) return;
    setIsSearchingLocation(true);
    setError(null);

    try {
      const searchTarget = location.includes(city) ? location : `${location}, ${city}`;
      const results = await searchAddress(searchTarget);
      if (results && results.length > 0) {
        const top = results[0];
        setLat(top.lat);
        setLng(top.lng);
        setHasGpsVerified(true);
        if (top.city && CITY_COORDINATES[top.city]) {
          setCity(top.city);
        }
      } else {
        setError(`Could not find coordinates for "${location}". You can tap anywhere on the map to set the pin.`);
      }
    } catch (err) {
      console.warn('Search address error:', err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Step Validation
  const canProceed = () => {
    if (currentStep === 1) {
      return category && description.trim().length >= 15;
    }
    if (currentStep === 2) {
      return location.trim().length >= 5;
    }
    if (currentStep === 3) {
      return !!photo;
    }
    return true;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const complaintData = {
        category,
        description,
        cityName: city,
        city,
        location,
        lat: lat || (city === 'Delhi' ? 28.6139 : city === 'Mumbai' ? 19.076 : city === 'Bangalore' ? 12.9716 : 18.5204),
        lng: lng || (city === 'Delhi' ? 77.209 : city === 'Mumbai' ? 72.8777 : city === 'Bangalore' ? 77.5946 : 73.8567),
        photo,
      };

      const result = await submitComplaint(complaintData);
      setSubmittedReport(result);

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
      // If photo was rejected by AI, automatically route user back to Step 3 (Evidence)
      if (err.code === 'AI_IMAGE_REJECTED' || err.message?.toLowerCase().includes('reject')) {
        setCurrentStep(3);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success State
  if (submittedReport) {
    return (
      <div className="glass-card p-8 sm:p-10 rounded-3xl border border-emerald-200 text-center space-y-6 max-w-xl mx-auto animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-2xl">🌱</span>
          <h3 className="text-2xl font-black text-slate-900">
            Environmental Report Submitted!
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your report is recorded in the live EcoSathi database. AI automated verification has initiated and your local community can now back and help solve it.
          </p>
        </div>

        {submittedReport.aiAnalysis?.severity && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>AI Automated Assessment:</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {submittedReport.aiAnalysis?.summary || 'Issue categorized. Priority severity assigned.'}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              if (onViewReport) onViewReport(submittedReport);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-700/20 transition-colors"
          >
            View My Report Details
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmittedReport(null);
              setCurrentStep(1);
              setDescription('');
              setPhoto(null);
              setPreviewUrl(null);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden max-w-2xl mx-auto">
      
      {/* Wizard Step Progress Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 sm:px-8 py-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black tracking-tight">Report an Environmental Issue</h3>
            <p className="text-xs text-emerald-100 font-medium">Step {currentStep} of 4</p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-4 gap-2">
          {['Details', 'Location', 'Evidence', 'Review'].map((stepName, i) => (
            <div key={i} className="space-y-1 text-center">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep > i + 1
                    ? 'bg-emerald-300'
                    : currentStep === i + 1
                    ? 'bg-white shadow-xs'
                    : 'bg-white/20'
                }`}
              />
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                currentStep === i + 1 ? 'text-white' : 'text-emerald-200/60'
              }`}>
                {stepName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Body Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900">AI Verification Notice</p>
              <p className="leading-relaxed">{error}</p>
              <p className="text-[11px] text-rose-600 font-medium">
                Please attach a genuine, relevant photo of the reported environmental hazard.
              </p>
            </div>
          </div>
        )}

        {/* STEP 1: What Happened? */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                1. Select Issue Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded-2xl text-left text-xs font-bold border transition-all ${
                      category === cat.value
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                2. Describe the Environmental Hazard
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you observe? Mention smell, smoke, volume of waste, or risk to public health..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <p className="text-[11px] text-slate-400 font-medium">
                {description.length} characters (minimum 15 required)
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Where? */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                City / Municipality
              </label>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Pune">Pune, MH</option>
                <option value="Delhi">Delhi, NCR</option>
                <option value="Mumbai">Mumbai, MH</option>
                <option value="Bangalore">Bangalore, KA</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Street Address or Landmark
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation || isGeocoding}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 border border-emerald-200 transition-colors disabled:opacity-50"
                  title="Detect GPS location and convert to street address"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                  <span>
                    {isGettingLocation
                      ? 'Detecting GPS...'
                      : isGeocoding
                      ? 'Resolving Address...'
                      : 'Use GPS Location'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchAddress();
                      }
                    }}
                    placeholder="Type address or click 'Use GPS' / map to auto-fill"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                {location.trim().length >= 3 && (
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={isSearchingLocation}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1 shrink-0 border border-slate-200 transition-colors disabled:opacity-50"
                    title="Find address coordinates on map"
                  >
                    {isSearchingLocation ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Find on Map</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Location Picker Map on Screen */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Interactive Location Map</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Tap anywhere on map or drag pin to adjust
                </span>
              </div>

              <LocationPickerMap
                lat={lat}
                lng={lng}
                onLocationSelect={handleMapLocationSelect}
                isGeocoding={isGeocoding}
                address={location}
                className="h-56 sm:h-64"
              />
            </div>

            {/* Coordinates & Location Feedback Banner */}
            {lat && lng && (
              <div className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-emerald-900">
                      {hasGpsVerified ? 'GPS Location Locked & Verified' : 'Location Selected'}
                    </p>
                    <p className="text-[11px] text-emerald-700/90 font-medium truncate max-w-sm">
                      {location || 'Coordinates plotted on map'}
                    </p>
                  </div>
                </div>
                <div className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-xl shrink-0 self-start sm:self-auto">
                  {lat.toFixed(4)}°, {lng.toFixed(4)}°
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Evidence (Photo Upload) */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">
              Upload Photographic Proof
            </label>

            {!previewUrl ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Click or drag photo here
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  PNG, JPG up to 5MB. AI scans image for environmental severity.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 max-h-72 bg-slate-100">
                <img
                  src={previewUrl}
                  alt="Evidence preview"
                  className="w-full h-full object-cover max-h-72"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Review Report Summary
              </span>

              <div>
                <p className="text-xs font-bold text-slate-500">Category & City</p>
                <p className="text-sm font-black text-slate-900 capitalize">
                  {category.replace('-', ' ')} in {city}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500">Location & Coordinates</p>
                <p className="text-xs font-bold text-slate-800 flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{location}</span>
                </p>
                {lat && lng && (
                  <p className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg inline-block mt-1">
                    GPS: {lat.toFixed(5)}°, {lng.toFixed(5)}° ({city})
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500">Observation</p>
                <p className="text-xs text-slate-700 leading-relaxed">{description}</p>
              </div>

              {previewUrl && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Attached Photo Evidence</p>
                  <img
                    src={previewUrl}
                    alt="Review proof"
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>EcoSathi AI will automatically prioritize severity upon submission.</span>
            </div>
          </div>
        )}

        {/* Footer Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              disabled={!canProceed()}
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-700/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>AI Analyzing Photo & Verifying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Environmental Report</span>
                </>
              )}
            </button>
          )}
        </div>

      </form>

    </div>
  );
}