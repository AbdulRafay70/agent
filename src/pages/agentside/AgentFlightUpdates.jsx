import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert, Accordion, Table, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import {
  Plane, MapPin, Calendar, Users, Search, ArrowRight, Clock, CheckCircle,
  Briefcase, Coffee, CreditCard, XCircle, Info, ArrowLeft, AlertCircle
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import "./AgentFlightUpdates.css";
import BookingModal from "../../components/BookingModal";
import BrandedFareSelector from "../../components/BrandedFareSelector";
import FareRulesModal from "../../components/FareRulesModal";

// axios timeout for long-running flight/branding requests (120 seconds)
const AXIOS_LONG_TIMEOUT = 120000;

// Airport list with IATA codes
const AIRPORTS = [
  // Pakistan
  "Karachi - KHI", "Lahore - LHE", "Islamabad - ISB", "Peshawar - PEW", "Quetta - UET",
  "Multan - MUX", "Faisalabad - LYP", "Sialkot - SKT", "Rahim Yar Khan - RYK", "Bahawalpur - BHV",
  // Saudi Arabia
  "Jeddah - JED", "Riyadh - RUH", "Madinah - MED", "Dammam - DMM",
  // UAE
  "Dubai - DXB", "Abu Dhabi - AUH", "Sharjah - SHJ",
  // Middle East
  "Kuwait - KWI", "Doha - DOH", "Muscat - MCT", "Bahrain - BAH",
  // Europe
  "London - LHR", "Manchester - MAN", "Birmingham - BHX", "Paris - CDG", "Frankfurt - FRA",
  "Amsterdam - AMS", "Istanbul - IST", "Rome - FCO", "Madrid - MAD", "Barcelona - BCN", "Milan - MXP",
  // Asia
  "Bangkok - BKK", "Singapore - SIN", "Kuala Lumpur - KUL", "Hong Kong - HKG", "Tokyo - NRT",
  "Seoul - ICN", "Beijing - PEK", "Shanghai - PVG", "Delhi - DEL", "Mumbai - BOM",
  // Americas
  "New York - JFK", "Los Angeles - LAX", "Toronto - YYZ", "Chicago - ORD", "Miami - MIA",
  // Australia
  "Sydney - SYD", "Melbourne - MEL"
];

// Airport/City names mapping
const AIRPORT_CITIES = {
  'KHI': 'Karachi, Pakistan', 'LHE': 'Lahore, Pakistan', 'ISB': 'Islamabad, Pakistan',
  'PEW': 'Peshawar, Pakistan', 'UET': 'Quetta, Pakistan', 'MUX': 'Multan, Pakistan',
  'LYP': 'Faisalabad, Pakistan', 'SKT': 'Sialkot, Pakistan', 'RYK': 'Rahim Yar Khan, Pakistan',
  'BHV': 'Bahawalpur, Pakistan', 'JED': 'Jeddah, Saudi Arabia', 'RUH': 'Riyadh, Saudi Arabia',
  'MED': 'Madinah, Saudi Arabia', 'DMM': 'Dammam, Saudi Arabia', 'DXB': 'Dubai, UAE',
  'AUH': 'Abu Dhabi, UAE', 'SHJ': 'Sharjah, UAE', 'KWI': 'Kuwait City, Kuwait',
  'DOH': 'Doha, Qatar', 'MCT': 'Muscat, Oman', 'BAH': 'Manama, Bahrain',
  'LHR': 'London, UK', 'MAN': 'Manchester, UK', 'BHX': 'Birmingham, UK',
  'CDG': 'Paris, France', 'FRA': 'Frankfurt, Germany', 'AMS': 'Amsterdam, Netherlands',
  'IST': 'Istanbul, Turkey', 'FCO': 'Rome, Italy', 'MAD': 'Madrid, Spain',
  'BCN': 'Barcelona, Spain', 'MXP': 'Milan, Italy', 'BKK': 'Bangkok, Thailand',
  'SIN': 'Singapore', 'KUL': 'Kuala Lumpur, Malaysia', 'HKG': 'Hong Kong',
  'NRT': 'Tokyo, Japan', 'ICN': 'Seoul, South Korea', 'PEK': 'Beijing, China',
  'PVG': 'Shanghai, China', 'DEL': 'Delhi, India', 'BOM': 'Mumbai, India',
  'JFK': 'New York, USA', 'LAX': 'Los Angeles, USA', 'YYZ': 'Toronto, Canada',
  'ORD': 'Chicago, USA', 'MIA': 'Miami, USA', 'SYD': 'Sydney, Australia',
  'MEL': 'Melbourne, Australia'
};

// Airline names mapping
const AIRLINE_NAMES = {
  '9P': 'Air Arabia Pakistan', 'PK': 'Pakistan International Airlines', 'PA': 'Airblue',
  'ER': 'Serene Air', 'G9': 'Air Arabia', 'FZ': 'flydubai', 'EK': 'Emirates',
  'QR': 'Qatar Airways', 'TK': 'Turkish Airlines', 'EY': 'Etihad Airways',
  'GF': 'Gulf Air', 'KU': 'Kuwait Airways', 'WY': 'Oman Air', 'SV': 'Saudia',
  'J9': 'Jazeera Airways', 'AI': 'Air India', '6E': 'IndiGo', 'UK': 'Vistara',
  'SG': 'SpiceJet', 'BA': 'British Airways', 'LH': 'Lufthansa', 'AF': 'Air France',
  'KL': 'KLM', 'AZ': 'ITA Airways', 'OS': 'Austrian Airlines', 'LX': 'Swiss International',
  'TG': 'Thai Airways', 'SQ': 'Singapore Airlines', 'MH': 'Malaysia Airlines',
  'CX': 'Cathay Pacific', 'NH': 'All Nippon Airways', 'JL': 'Japan Airlines',
  'KE': 'Korean Air', 'OZ': 'Asiana Airlines', 'CA': 'Air China'
};

const AgentFlightUpdates = () => {
  // Search form state
  const [formData, setFormData] = useState({
    tripType: "oneway", // oneway, return, multicity
    from: "",
    to: "",
    departureDate: null,
    returnDate: null,
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: "Economy",
    multiCitySegments: [
      { from: "", to: "", departureDate: null }
    ]
  });

  // Flight results state
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  // Per-leg options when multicity combined search fails
  const [perLegOptions, setPerLegOptions] = useState(null); // array of arrays
  const [perLegSelected, setPerLegSelected] = useState([]);
  // Booking UI state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [passenger, setPassenger] = useState({
    name: '',
    phone: '',
    email: '',
    salutation: 'Mr',
    gender: 'Male',
    birthDate: null,
    documentNumber: '',
    docIssueCountry: 'PK',
    expiryDate: null,
    nationality: 'PK'
  });
  // Token modal state
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState(localStorage.getItem('idToken') || '');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Branded fares and fare rules modals
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showFareRulesModal, setShowFareRulesModal] = useState(false);
  const [selectedFlightForRules, setSelectedFlightForRules] = useState(null);
  const [validatedSealed, setValidatedSealed] = useState(null);
  // Raw response modal for debugging when no flights are returned
  const [showRawModal, setShowRawModal] = useState(false);
  const [lastRawResponse, setLastRawResponse] = useState(null);

  const handleSaveToken = () => {
    if (tokenInput && tokenInput.trim()) {
      localStorage.setItem('idToken', tokenInput.trim());
      setShowTokenModal(false);
      alert('idToken saved to localStorage');
    } else {
      alert('Please paste a valid token');
    }
  };

  const handleRemoveToken = () => {
    localStorage.removeItem('idToken');
    setTokenInput('');
    setShowTokenModal(false);
    alert('idToken removed from localStorage');
  };

  const authenticateAndSaveToken = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // Call backend proxy to get AIQS token (avoids CORS)
      const res = await axios.get('http://127.0.0.1:8000/api/flights/aiqs-token/', { timeout: 10000 });
      const data = res.data || {};
      const idToken = data?.id_token || data?.access_token || null;
      if (!idToken) {
        throw new Error('No token returned from server');
      }
      localStorage.setItem('idToken', idToken);
      setTokenInput(idToken);
      return idToken;
    } catch (err) {
      console.error('Auth error', err);
      setAuthError(err.response?.data || err.message || 'Auth failed');
      alert('Authentication failed: ' + (err.response?.data?.message || err.message || 'unknown'));
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  // Filter states
  const [filters, setFilters] = useState({
    priceRange: [0, 500000],
    stops: 'all',
    airlines: [],
    departureTime: 'all',
    sortBy: 'price'
  });

  useEffect(() => {
    if (flights.length > 0) {
      applyFilters();
    }
  }, [filters, flights]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date, field) => {
    setFormData({ ...formData, [field]: date });
  };

  const handleMultiCityChange = (index, field, value) => {
    const updatedSegments = [...formData.multiCitySegments];
    updatedSegments[index] = { ...updatedSegments[index], [field]: value };
    setFormData({ ...formData, multiCitySegments: updatedSegments });
  };

  const addMultiCitySegment = () => {
    if (formData.multiCitySegments.length < 6) {
      setFormData({
        ...formData,
        multiCitySegments: [...formData.multiCitySegments, { from: "", to: "", departureDate: null }]
      });
    } else {
      alert("Maximum 6 flight segments allowed for multi-city booking.");
    }
  };

  const loadExampleMultiCity = () => {
    // Example: Karachi -> Dubai (06-02-2026), Doha -> Kuwait (16-02-2026)
    const example = [
      { from: "Karachi - KHI", to: "Dubai - DXB", departureDate: new Date('2026-02-06') },
      { from: "Doha - DOH", to: "Kuwait - KWI", departureDate: new Date('2026-02-16') }
    ];
    setFormData({ ...formData, tripType: 'multicity', multiCitySegments: example });
  };

  const removeMultiCitySegment = (index) => {
    if (formData.multiCitySegments.length > 1) {
      const updatedSegments = formData.multiCitySegments.filter((_, i) => i !== index);
      setFormData({ ...formData, multiCitySegments: updatedSegments });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Validation based on trip type
    if (formData.tripType === "multicity") {
      // Validate multi-city segments
      for (let i = 0; i < formData.multiCitySegments.length; i++) {
        const segment = formData.multiCitySegments[i];
        if (!segment.from || !segment.to) {
          setError(`Please select departure and arrival cities for segment ${i + 1}`);
          return;
        }
        if (!segment.departureDate) {
          setError(`Please select departure date for segment ${i + 1}`);
          return;
        }
      }
    } else {
      // Validate one-way and return
      if (!formData.from || !formData.to) {
        setError("Please select departure and arrival cities");
        return;
      }
      if (!formData.departureDate) {
        setError("Please select departure date");
        return;
      }
      if (formData.tripType === "return" && !formData.returnDate) {
        setError("Please select return date");
        return;
      }
    }

    // Check if multi-city is selected (not yet supported)
    // Removed: Multi-city is now supported

    // Extract airport codes and dates based on trip type
    let searchParams = {
      adults: parseInt(formData.adults) || 1,
      children: parseInt(formData.children) || 0,
      infants: parseInt(formData.infants) || 0,
      cabinClass: getCabinCode(formData.cabinClass),
      tripType: formData.tripType
    };

    if (formData.tripType === "multicity") {
      // For multi-city, send all segments to backend
      const multiCitySegments = formData.multiCitySegments.map(segment => ({
        origin: segment.from.match(/- ([A-Z]{3})$/)?.[1],
        destination: segment.to.match(/- ([A-Z]{3})$/)?.[1],
        departureDate: (() => {
          const day = String(segment.departureDate.getDate()).padStart(2, '0');
          const month = String(segment.departureDate.getMonth() + 1).padStart(2, '0');
          const year = segment.departureDate.getFullYear();
          return `${day}-${month}-${year}`;
        })()
      }));

      if (multiCitySegments.some(seg => !seg.origin || !seg.destination)) {
        setError("Invalid airport selection in multi-city segments");
        return;
      }

      searchParams.multiCitySegments = multiCitySegments;
      searchParams.tripType = "multicity";
    } else {
      // For one-way and return
      const fromCode = formData.from.match(/- ([A-Z]{3})$/)?.[1];
      const toCode = formData.to.match(/- ([A-Z]{3})$/)?.[1];

      if (!fromCode || !toCode) {
        setError("Invalid airport selection");
        return;
      }

      // Format date to DD-MM-YYYY
      const day = String(formData.departureDate.getDate()).padStart(2, '0');
      const month = String(formData.departureDate.getMonth() + 1).padStart(2, '0');
      const year = formData.departureDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      searchParams.origin = fromCode;
      searchParams.destination = toCode;
      searchParams.departureDate = formattedDate;

      // Add return date for round trip
      if (formData.tripType === "return" && formData.returnDate) {
        const returnDay = String(formData.returnDate.getDate()).padStart(2, '0');
        const returnMonth = String(formData.returnDate.getMonth() + 1).padStart(2, '0');
        const returnYear = formData.returnDate.getFullYear();
        const formattedReturnDate = `${returnDay}-${returnMonth}-${returnYear}`;
        searchParams.returnDate = formattedReturnDate;
      }
    }

    // Common API call for all trip types
    setLoading(true);
    setError(null);
    setShowResults(true);

    try {
      // Ensure idToken exists in localStorage. If not, generate and save it.
      let existingToken = localStorage.getItem('idToken');
      if (!existingToken) {
        existingToken = await authenticateAndSaveToken();
      }

      // Send documented AIQS wrapper to backend; backend will normalize it.
      const wrappedPayload = buildAiqsSearchWrapper(searchParams, existingToken);
      const response = await axios.post(
        'http://127.0.0.1:8000/api/flights/search/',
        wrappedPayload,
        {
          timeout: AXIOS_LONG_TIMEOUT,
          headers: { 'Content-Type': 'application/json', 'Authorization': existingToken ? `Bearer ${existingToken}` : undefined }
        }
      );

      console.debug('Search raw response:', response.data);
      setLastRawResponse(response.data || null);
      if (response.data && response.data.parsed_results && typeof response.data.parsed_results === 'object') {
        console.debug('parsed_results keys:', Object.keys(response.data.parsed_results));
      }
      const flightsData = extractFlights(response.data);
      console.debug('extractFlights -> found', Array.isArray(flightsData) ? flightsData.length : 0, 'flights');
      if (flightsData && flightsData.length > 0) {

        // Fetch branded fares for flights that require separate requests
        const flightsWithBrands = await Promise.all(
          flightsData.map(async (flight) => {
            if (flight.brandedFareSupported && flight.brandedFareSeparate) {
              try {
                console.log(`🎨 Fetching branded fares separately for flight`);
                const brandResponse = await axios.post(
                  'http://127.0.0.1:8000/api/flights/branded-fares/',
                  {
                    flightData: flight,
                    origin: searchParams.origin,
                    destination: searchParams.destination
                  },
                  {
                    timeout: AXIOS_LONG_TIMEOUT,
                    headers: { 'Content-Type': 'application/json', 'Authorization': existingToken ? `Bearer ${existingToken}` : undefined }
                  }
                );

                if (brandResponse.data && brandResponse.data.brands) {
                  console.log(`✅ Found ${brandResponse.data.brands.length} branded fares`);
                  return {
                    ...flight,
                    brands: brandResponse.data.brands,
                    fareInfo: brandResponse.data.fareInfo
                  };
                }
              } catch (brandErr) {
                const details = brandErr.response?.data || brandErr.message || 'Unknown branded fares error';
                console.warn(`❌ Failed to fetch branded fares:`, details);
                // attach error info so UI can avoid re-requesting and can display details
                return { ...flight, brandedFetchError: details };
              }
            }
            return flight;
          })
        );

        // Filter flights based on trip type
        let filteredByTripType = flightsWithBrands;
        if (formData.tripType === "oneway") {
          filteredByTripType = flightsWithBrands.filter(flight => {
            return flight.rawData?.ondPairs && flight.rawData.ondPairs.length === 1;
          });
        } else if (formData.tripType === "return") {
          filteredByTripType = flightsWithBrands.filter(flight => {
            return flight.rawData?.ondPairs && flight.rawData.ondPairs.length === 2;
          });
        }

        setFlights(filteredByTripType);
        setFilteredFlights(filteredByTripType);

        // If multicity and no combined flights returned, fallback to per-leg searches
        if (formData.tripType === 'multicity' && (!filteredByTripType || filteredByTripType.length === 0)) {
          console.log('No combined multicity itineraries returned — fetching per-leg options');
          const perLeg = await fetchPerLegOptions(searchParams.multiCitySegments, existingToken);
          setPerLegOptions(perLeg);
          setPerLegSelected(new Array(perLeg.length).fill(null));
        } else {
          setPerLegOptions(null);
          setPerLegSelected([]);
        }
      } else {
        setPerLegOptions(null);
        setPerLegSelected([]);
        setFlights([]);
        setFilteredFlights([]);
      }
    } catch (err) {
      console.error('Flight search error:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to search flights. Please try again.'
      );
      setFlights([]);
      setFilteredFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerLegOptions = async (segments, existingToken) => {
    if (!segments || segments.length === 0) return [];
    const headers = { 'Content-Type': 'application/json' };
    if (existingToken) headers.Authorization = `Bearer ${existingToken}`;

    const results = await Promise.all(segments.map(async (seg) => {
      try {
        const payload = {
          adults: parseInt(formData.adults) || 1,
          children: parseInt(formData.children) || 0,
          infants: parseInt(formData.infants) || 0,
          cabinClass: getCabinCode(formData.cabinClass),
          tripType: 'oneway',
          origin: seg.origin || seg.from?.match(/- ([A-Z]{3})$/)?.[1],
          destination: seg.destination || seg.to?.match(/- ([A-Z]{3})$/)?.[1],
          departureDate: seg.departureDate
        };

        const wrapped = buildAiqsSearchWrapper(payload, existingToken);
        const res = await axios.post('http://127.0.0.1:8000/api/flights/search/', wrapped, { headers, timeout: AXIOS_LONG_TIMEOUT });
        console.debug('Per-leg raw response (leg):', res.data);
        const extracted = extractFlights(res.data);
        console.debug('Per-leg extractFlights ->', Array.isArray(extracted) ? extracted.length : 0, 'items');
        return extracted;
      } catch (err) {
        console.error('Per-leg search failed for', seg, err.message || err);
        return [];
      }
    }));
    return results;
  };

  const selectPerLegOption = (legIndex, flight) => {
    const selected = [...perLegSelected];
    selected[legIndex] = flight;
    setPerLegSelected(selected);
  };

  const validateCombinedItinerary = async () => {
    // Ensure all legs selected
    if (!perLegSelected || perLegSelected.some(s => !s)) {
      alert('Please select one flight option for each leg before validating');
      return;
    }

    // Build combined flightData
    const combined = { segments: [], fare: { baseFare: 0, tax: 0, total: 0, currency: '' }, supplierSpecific: [] };
    perLegSelected.forEach(f => {
      if (f.segments) {
        f.segments.forEach(s => combined.segments.push(s));
      }
      if (f.fare) {
        combined.fare.baseFare += Number(f.fare.baseFare || 0);
        combined.fare.tax += Number(f.fare.tax || 0);
        combined.fare.total += Number(f.fare.total || 0);
        combined.fare.currency = combined.fare.currency || f.fare.currency;
      }
      if (f.supplierSpecific) {
        if (Array.isArray(f.supplierSpecific)) combined.supplierSpecific.push(...f.supplierSpecific);
        else combined.supplierSpecific.push(f.supplierSpecific);
      }
    });
    combined.tripType = 'multicity';

    try {
      const authToken = localStorage.getItem('idToken');
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const resp = await axios.post('http://127.0.0.1:8000/api/flights/validate/', { flightData: combined }, { headers, timeout: AXIOS_LONG_TIMEOUT });
      if (resp.data) {
        setValidatedSealed(resp.data.sealed || resp.data?.response?.content?.sealed || resp.data?.response?.content?.validateFareResponse?.sealed || null);
        alert('Validation successful — sealed token received');
        // Store combined as selectedFlight for booking flow
        setSelectedFlight({ ...combined, fare: combined.fare, supplierSpecific: combined.supplierSpecific });
        setShowBookingModal(true);
      }
    } catch (err) {
      console.error('Combined validate failed', err);
      alert('Validation failed: ' + (err.response?.data?.error || err.message || 'Unknown'));
    }
  };

  const getCabinCode = (className) => {
    const cabinMap = {
      'Economy': 'Y',
      'Premium Economy': 'W',
      'Business': 'C',
      'First Class': 'F'
    };
    return cabinMap[className] || 'Y';
  };

  const applyFilters = () => {
    let filtered = [...flights];

    // Price filter
    filtered = filtered.filter(f =>
      f.fare.total >= filters.priceRange[0] && f.fare.total <= filters.priceRange[1]
    );

    // Stops filter
    if (filters.stops !== 'all') {
      filtered = filtered.filter(f => {
        const totalFlights = f.segments?.reduce((sum, seg) => sum + (seg.flights?.length || 0), 0) || 0;
        const stops = totalFlights - 1;
        if (filters.stops === 'nonstop') return stops === 0;
        if (filters.stops === 'onestop') return stops === 1;
        return true;
      });
    }

    // Airline filter
    if (filters.airlines.length > 0) {
      filtered = filtered.filter(f => {
        const flightAirlines = f.segments?.flatMap(seg =>
          seg.flights?.map(fl => fl.airlineCode) || []
        ) || [];
        return filters.airlines.some(airline => flightAirlines.includes(airline));
      });
    }

    // Departure time filter
    if (filters.departureTime !== 'all') {
      filtered = filtered.filter(f => {
        const firstFlight = f.segments?.[0]?.flights?.[0];
        if (!firstFlight) return false;
        const hour = parseInt(firstFlight.departureTime?.slice(0, 2) || '0');
        if (filters.departureTime === 'morning') return hour >= 6 && hour < 12;
        if (filters.departureTime === 'afternoon') return hour >= 12 && hour < 18;
        if (filters.departureTime === 'evening') return hour >= 18 && hour < 24;
        if (filters.departureTime === 'night') return hour >= 0 && hour < 6;
        return true;
      });
    }

    // Sort
    if (filters.sortBy === 'price') {
      filtered.sort((a, b) => a.fare.total - b.fare.total);
    } else if (filters.sortBy === 'duration') {
      filtered.sort((a, b) => {
        const durationA = a.segments?.[0]?.ond?.duration || 999999;
        const durationB = b.segments?.[0]?.ond?.duration || 999999;
        return durationA - durationB;
      });
    }

    setFilteredFlights(filtered);
  };

  const getUniqueAirlines = () => {
    const airlines = new Set();
    flights.forEach(flight => {
      flight.segments?.forEach(segment => {
        segment.flights?.forEach(f => {
          if (f.airlineCode) airlines.add(f.airlineCode);
        });
      });
    });
    return Array.from(airlines);
  };

  const toggleAirlineFilter = (airline) => {
    setFilters(prev => ({
      ...prev,
      airlines: prev.airlines.includes(airline)
        ? prev.airlines.filter(a => a !== airline)
        : [...prev.airlines, airline]
    }));
  };

  const getAirlineLogo = (code) => {
    return `https://images.kiwi.com/airlines/64x64/${code}.png`;
  };

  const getAirlineName = (code) => {
    return AIRLINE_NAMES[code] || code;
  };

  const getCityName = (code) => {
    return AIRPORT_CITIES[code] || code;
  };

  const formatTime = (time) => {
    if (!time) return '';
    if (time.includes(':')) return time;
    return `${time.slice(0, 2)}:${time.slice(2)}`;
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (price, currency) => {
    const p = parseFloat(price || 0) || 0;
    return `${currency || 'PKR'} ${p.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatDateDDMMYYYY = (d) => {
    if (!d) return '';
    // If already in DD-MM-YYYY format, return as-is
    if (typeof d === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(d)) return d;
    // If it's a Date object
    if (d instanceof Date && !isNaN(d)) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    // If it's an ISO string (YYYY-MM-DD or full ISO), try parsing
    if (typeof d === 'string') {
      // Try YYYY-MM-DD
      const isoMatch = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const [, yy, mm, dd] = isoMatch;
        return `${dd}-${mm}-${yy}`;
      }
      // Fallback to Date constructor
      const dt = new Date(d);
      if (!isNaN(dt)) {
        const day = String(dt.getDate()).padStart(2, '0');
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const year = dt.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
    // If number (timestamp)
    if (typeof d === 'number') {
      const dt = new Date(d);
      if (!isNaN(dt)) {
        const day = String(dt.getDate()).padStart(2, '0');
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const year = dt.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
    return '';
  };

  // Compute a reliable fare total for display (fallback to baseFare + tax)
  const getFareAmount = (flight) => {
    if (!flight) return 0;
    const fare = flight.fare || {};
    const total = parseFloat(fare.total || fare.totalAmount || 0);
    if (!isNaN(total) && total > 0) return total;
    const base = parseFloat(fare.baseFare || fare.base || 0) || 0;
    const tax = parseFloat(fare.tax || fare.taxes || 0) || 0;
    return base + tax;
  };

  // Build AIQS documented wrapper for search requests
  const buildAiqsSearchWrapper = (params, token) => {
    // params: simplified searchParams used in frontend
    const tripTypeMap = { 'oneway': 'O', 'return': 'R', 'multicity': 'M' };

    const criteria = {
      criteriaType: 'Air',
      commonRequestSearch: {
        numberOfUnits: (params.adults || 1) + (params.children || 0) + (params.infants || 0),
        typeOfUnit: 'PX',
        resultsCount: String(params.maxResults || 50)
      },
      ondPairs: [],
      preferredAirline: params.preferredAirlines || [],
      nonStop: params.nonStop || false,
      cabin: params.cabinClass || params.cabin || 'Y',
      maxStopQuantity: params.nonStop ? 'Direct' : 'All',
      tripType: tripTypeMap[params.tripType] || 'O',
      target: 'Test',
      paxQuantity: {
        adt: params.adults || 1,
        chd: params.children || 0,
        inf: params.infants || 0
      }
    };

    if (params.tripType === 'multicity' && Array.isArray(params.multiCitySegments)) {
      criteria.ondPairs = params.multiCitySegments.map(s => ({
        departureDate: s.departureDate,
        originLocation: s.origin || s.from,
        destinationLocation: s.destination || s.to
      }));
    } else if (params.tripType === 'return') {
      criteria.ondPairs = [
        { departureDate: params.departureDate, originLocation: params.origin || params.from, destinationLocation: params.destination || params.to },
        { departureDate: params.returnDate, originLocation: params.destination || params.to, destinationLocation: params.origin || params.from }
      ];
    } else {
      criteria.ondPairs = [
        { departureDate: params.departureDate, originLocation: params.origin || params.from, destinationLocation: params.destination || params.to }
      ];
    }

    const wrapper = {
      request: {
        service: 'FlightRQ',
        token: token || undefined,
        content: {
          command: 'FlightSearchRQ',
          criteria
        }
      }
    };

    return wrapper;
  };

  // Normalize various API response shapes into an array of flights
  const extractFlights = (data) => {
    if (!data) return [];
    // direct arrays
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.flights)) return data.flights;
    if (Array.isArray(data.itineraries)) return data.itineraries;
    if (Array.isArray(data.results)) return data.results;

    if (data.response?.content?.flights && Array.isArray(data.response.content.flights)) return data.response.content.flights;

    // parsed_results may be object or array
    const parsed = data.parsed_results || data.response?.content?.parsed_results || null;
    if (parsed) {
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.flights)) return parsed.flights;
      if (Array.isArray(parsed.results)) return parsed.results;
    }

    // Generic recursive search: find first array that looks like flights
    const isFlightLike = (item) => {
      if (!item || typeof item !== 'object') return false;
      const keys = Object.keys(item);
      return keys.includes('fare') || keys.includes('segments') || keys.includes('flights') || keys.includes('ondPairs') || keys.includes('fareDetails') || keys.includes('total');
    };

    const findArrayWithFlightLikeObjects = (obj, depth = 0) => {
      if (!obj || typeof obj !== 'object' || depth > 4) return null;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (Array.isArray(v) && v.length > 0 && isFlightLike(v[0])) return v;
        if (typeof v === 'object') {
          const res = findArrayWithFlightLikeObjects(v, depth + 1);
          if (res) return res;
        }
      }
      return null;
    };

    const found = findArrayWithFlightLikeObjects(data);
    if (found) return found;

    // last-resort: empty
    return [];
  };

  const handleBookFlight = (flight) => {
    // Check if flight has multiple branded fares
    if (flight.brands && flight.brands.length > 1) {
      // Show branded fare selector
      setSelectedFlight(flight);
      setShowBrandModal(true);
    } else {
      // Single brand or no brands - proceed directly to booking
      let flightToBook = { ...flight };

      if (flight.brands && flight.brands.length > 0) {
        const firstBrand = flight.brands[0];
        console.log('🎫 Using branded fare:', firstBrand.brandName, 'brandId:', firstBrand.brandId);

        // Use brand's fare and supplierSpecific
        flightToBook = {
          ...flight,
          brandId: firstBrand.brandId,
          fare: {
            baseFare: firstBrand.baseFare,
            tax: firstBrand.tax,
            total: firstBrand.total,
            currency: firstBrand.currency
          },
          supplierSpecific: firstBrand.supplierSpecific,
          selectedBrandName: firstBrand.brandName
        };
      } else {
        // For non-branded flights, ensure brandId defaults to 1
        flightToBook.brandId = 1;
      }

      console.log('📋 Flight data for booking:', {
        hasSupplierSpecific: !!flightToBook.supplierSpecific,
        supplierCode: flightToBook.supplierCode,
        brandId: flightToBook.brandId,
        fare: flightToBook.fare
      });

      setSelectedFlight(flightToBook);
      setShowBookingModal(true);
    }
  };

  // Helper to update a flight entry in `flights` and `filteredFlights` by id
  const updateFlightInState = (flightId, patch) => {
    setFlights(prev => prev.map(f => f.id === flightId ? { ...f, ...patch } : f));
    setFilteredFlights(prev => prev.map(f => f.id === flightId ? { ...f, ...patch } : f));
  };

  const handleSelectBrand = (selectedBrand) => {
    // User selected a brand from BrandedFareSelector
    const flightToBook = {
      ...selectedFlight,
      brandId: selectedBrand.brandId,
      fare: {
        baseFare: selectedBrand.baseFare,
        tax: selectedBrand.tax,
        total: selectedBrand.total,
        currency: selectedBrand.currency
      },
      supplierSpecific: selectedBrand.supplierSpecific,
      selectedBrandName: selectedBrand.brandName
    };

    console.log('✅ Brand selected:', selectedBrand.brandName);
    setShowBrandModal(false);
    setSelectedFlight(flightToBook);
    setShowBookingModal(true);
  };

  const handleShowFareRules = (flight) => {
    setSelectedFlightForRules(flight);
    setValidatedSealed(null); // Reset sealed token
    setShowFareRulesModal(true);
  };

  const [bookingSuccess, setBookingSuccess] = useState(null);
  const navigate = useNavigate();

  const handleBookingSuccess = (bookingData) => {
    setShowBookingModal(false);
    setBookingSuccess(bookingData);

    // Show success alert for 3 seconds then navigate to tickets page
    setTimeout(() => {
      setBookingSuccess(null);
      navigate('/tickets');
    }, 3000);
  };

  const handlePassengerChange = (e) => {
    const { name, value } = e.target;
    setPassenger(prev => ({ ...prev, [name]: value }));
  };

  const handlePassengerDateChange = (name, date) => {
    setPassenger(prev => ({ ...prev, [name]: date }));
  };

  const handleConfirmBooking = async () => {
    if (!selectedFlight) return;
    if (!passenger.name || !passenger.phone || !passenger.email) {
      setBookingError('Please fill passenger name, phone and email');
      return;
    }
    if (!passenger.birthDate || !passenger.documentNumber || !passenger.expiryDate || !passenger.nationality) {
      setBookingError('Please fill DOB, passport number, expiry and nationality');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    try {
      // 1) Build validate payload from selectedFlight
      const from = selectedFlight.ondPairs?.[0]?.originLocation || selectedFlight.ondPairs?.[0]?.originCity || selectedFlight.segments?.[0]?.flights?.[0]?.departureLocation;
      const to = selectedFlight.ondPairs?.[0]?.destinationLocation || selectedFlight.ondPairs?.[0]?.destinationCity || selectedFlight.segments?.[0]?.flights?.[0]?.arrivalLocation;

      const segmentGroup = (selectedFlight.ondPairs || selectedFlight.segments || []).map((ond, ondIdx) => {
        const segs = (ond.segments || ond.flights || []).map(f => ({
          dateTime: {
            depDate: f.depDate || f.departureDate || f.departureDate,
            depTime: (f.depTime || f.departureTime || '').replace(':', ''),
            arrDate: f.arrDate || f.arrivalDate || f.arrivalDate,
            arrTime: (f.arrTime || f.arrivalTime || '').replace(':', '')
          },
          location: {
            depAirport: f.depAirport || f.depAirport || f.departureLocation,
            arrAirport: f.arrAirport || f.arrivalLocation
          },
          mktgAirline: f.mktgAirline || f.airlineCode,
          operAirline: f.operatingAirline || f.operatingAirline || f.airlineCode,
          issuingAirline: f.issuingAirline || f.airlineCode,
          flightNo: f.flightNo || f.flightNo || f.flightNo,
          rbd: f.rbd || f.cabin || f.rbd,
          flightTypeDetails: {
            ondID: ondIdx,
            segID: 0
          }
        }));

        return { flifo: segs };
      });

      const validatePayload = {
        request: {
          service: 'FlightRQ',
          supplierCodes: [selectedFlight.supplierCode || selectedFlight.supplierCode || 2],
          node: {},
          content: {
            command: 'FlightValidateRQ',
            validateFareRequest: {
              target: 'Test',
              adt: parseInt(formData.adults) || 1,
              chd: parseInt(formData.children) || 0,
              inf: parseInt(formData.infants) || 0,
              segmentGroup: segmentGroup,
              tripType: selectedFlight.tripType || 'O',
              from: from || (formData.from?.match(/- ([A-Z]{3})$/)?.[1]),
              to: to || (formData.to?.match(/- ([A-Z]{3})$/)?.[1]),
              totalAmount: selectedFlight.fare?.total || selectedFlight.fare?.total || 0
            }
          },
          supplierSpecific: selectedFlight.supplierSpecific || []
        }
      };

      const authToken = localStorage.getItem('idToken');
      const validateRes = await axios.post('/api/air/validate/', validatePayload, {
        timeout: AXIOS_LONG_TIMEOUT,
        headers: Object.assign({ 'Content-Type': 'application/json' }, authToken ? { Authorization: `Bearer ${authToken}` } : {})
      });
      const sealed = validateRes?.data?.response?.content?.validateFareResponse?.sealed || validateRes?.data?.response?.content?.sealed || validateRes?.data?.sealed;

      if (!sealed) {
        throw new Error('Failed to obtain sealed token from validate response');
      }

      // 2) Build travelerInfo from passenger modal (minimal required fields)
      const [given, ...rest] = passenger.name.trim().split(' ');
      const sur = rest.join(' ') || 'Passenger';

      const travelerInfo = [
        {
          paxType: 'ADT',
          gender: passenger.gender || 'Male',
          salutation: passenger.salutation || 'Mr',
          givenName: given,
          surName: sur,
          birthDate: formatDateDDMMYYYY(passenger.birthDate),
          docType: '1',
          documentNumber: passenger.documentNumber,
          docIssueCountry: passenger.docIssueCountry || 'PK',
          expiryDate: formatDateDDMMYYYY(passenger.expiryDate),
          nationality: passenger.nationality || 'PK',
          leadPax: true,
          contact: {
            emailList: [{ emailId: passenger.email, emailType: { id: 1, name: 'Personal' } }],
            phoneList: [{ number: passenger.phone, phoneType: { id: 1, name: 'Mobile' } }]
          }
        }
      ];

      // 3) Build ondPairs structure from selectedFlight
      const ondPairs = (selectedFlight.ondPairs || selectedFlight.segments || []).map((ond) => {
        const segments = (ond.segments || ond.flights || []).map(s => ({
          fareBasis: s.fareBasis || s.fareBasis || s.rbd || '',
          depDate: s.depDate || s.departureDate || '',
          depTime: (s.depTime || s.departureTime || '').replace(':', ''),
          arrDate: s.arrDate || s.arrivalDate || '',
          arrTime: (s.arrTime || s.arrivalTime || '').replace(':', ''),
          depAirport: s.depAirport || s.departureLocation || '',
          arrAirport: s.arrAirport || s.arrivalLocation || '',
          mktgAirline: s.mktgAirline || s.airlineCode || '',
          operAirline: s.operatingAirline || s.operatingAirline || s.airlineCode || '',
          issuingAirline: s.issuingAirline || s.airlineCode || '',
          flightNo: s.flightNo || s.flightNo || s.flightNo || '',
          cabin: s.cabin || s.cabin || '',
          duration: s.duration || s.duration || '',
          rbd: s.rbd || '',
          eqpType: s.eqpType || s.equipmentType || '',
          stopQuantity: s.stopQuantity || s.stops || 0
        }));

        return {
          originCity: ond.originCity || ond.ond?.originLocation || ond.originLocation || '',
          destinationCity: ond.destinationCity || ond.ond?.destinationLocation || ond.destinationLocation || '',
          duration: ond.duration || '',
          segments
        };
      });

      const bookPayload = {
        request: {
          service: 'FlightRQ',
          supplierCodes: [selectedFlight.supplierCode || 2],
          node: {},
          content: {
            command: 'FlightBookRQ',
            bookFlightRQ: {
              bookingRefId: '',
              sealed: sealed,
              adt: parseInt(formData.adults) || 1,
              chd: parseInt(formData.children) || 0,
              inf: parseInt(formData.infants) || 0,
              tripType: selectedFlight.tripType || 'O',
              fare: selectedFlight.fare || { paxCount: String(formData.adults), baseFare: String(selectedFlight.fare?.baseFare || ''), tax: String(selectedFlight.fare?.tax || ''), total: selectedFlight.fare?.total || 0, currency: selectedFlight.fare?.currency || 'PKR' },
              airFareRule: selectedFlight.airFareRule || [],
              ondPairs: ondPairs,
              travelerInfo: travelerInfo,
              paymentMode: 7,
              issue: false
            }
          },
          supplierSpecific: selectedFlight.supplierSpecific || []
        },
        selectCredential: {
          id: selectedFlight.selectCredential?.id || undefined
        }
      };

      const bookRes = await axios.post('/api/air/book/', bookPayload, {
        timeout: AXIOS_LONG_TIMEOUT,
        headers: Object.assign({ 'Content-Type': 'application/json' }, authToken ? { Authorization: `Bearer ${authToken}` } : {})
      });
      const bookResp = bookRes?.data?.response?.content?.bookFlightRS || bookRes?.data?.response?.content?.bookFlightRS || bookRes?.data?.response?.content?.bookFlightRS;
      const bookingRef = bookResp?.bookingRefId || bookRes?.data?.response?.content?.bookFlightRS?.bookingRefId || bookRes?.data?.response?.content?.bookingRefId;
      const pnr = bookResp?.pnr || bookRes?.data?.response?.content?.pnr;

      setShowBookingModal(false);
      setSelectedFlight(null);
      setPassenger({ name: '', phone: '', email: '' });
      alert('Booking created successfully: ' + (bookingRef || pnr || 'OK'));
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err.response?.data?.error || err.response?.data?.message || err.response?.data || err.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setShowResults(false);
    setFlights([]);
    setFilteredFlights([]);
    setError(null);
  };

  return (
    <div className="d-flex">
      <AgentSidebar />
      <div className="flex-fill">
        <AgentHeader />
        <div className="agent-flight-updates-wrapper">
          <Container fluid className="py-4">
            <div className="d-flex justify-content-end mb-3">
              <Button variant="outline-secondary" size="sm" onClick={() => setShowTokenModal(true)}>
                Set idToken
              </Button>
            </div>
            {!showResults ? (
              // Search Form
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h4 className="mb-0">
                    <Plane size={24} className="me-2" />
                    Flight Search
                  </h4>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleSearch}>
                    {/* Trip Type Selection */}
                    <Row className="mb-4">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Trip Type</Form.Label>
                          <div className="d-flex gap-3">
                            <Form.Check
                              type="radio"
                              label="One Way"
                              name="tripType"
                              value="oneway"
                              checked={formData.tripType === "oneway"}
                              onChange={handleInputChange}
                              inline
                            />
                            <Form.Check
                              type="radio"
                              label="Return"
                              name="tripType"
                              value="return"
                              checked={formData.tripType === "return"}
                              onChange={handleInputChange}
                              inline
                            />
                            <Form.Check
                              type="radio"
                              label="Multi-City"
                              name="tripType"
                              value="multicity"
                              checked={formData.tripType === "multicity"}
                              onChange={handleInputChange}
                              inline
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* One Way and Return Form */}
                    {formData.tripType !== "multicity" && (
                      <>
                        <Row>
                          <Col md={6} className="mb-3">
                            <Form.Group>
                              <Form.Label>
                                <MapPin size={16} className="me-1" />
                                From (Departure City)
                              </Form.Label>
                              <Form.Select
                                name="from"
                                value={formData.from}
                                onChange={handleInputChange}
                                required
                              >
                                <option value="">Select departure city</option>
                                {AIRPORTS.map(airport => (
                                  <option key={airport} value={airport}>{airport}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>

                          <Col md={6} className="mb-3">
                            <Form.Group>
                              <Form.Label>
                                <MapPin size={16} className="me-1" />
                                To (Arrival City)
                              </Form.Label>
                              <Form.Select
                                name="to"
                                value={formData.to}
                                onChange={handleInputChange}
                                required
                              >
                                <option value="">Select arrival city</option>
                                {AIRPORTS.map(airport => (
                                  <option key={airport} value={airport}>{airport}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={formData.tripType === "return" ? 6 : 12} className="mb-3">
                            <Form.Group>
                              <Form.Label>
                                <Calendar size={16} className="me-1" />
                                Departure Date
                              </Form.Label>
                              <DatePicker
                                selected={formData.departureDate}
                                onChange={(date) => handleDateChange(date, 'departureDate')}
                                minDate={new Date()}
                                dateFormat="dd-MM-yyyy"
                                className="form-control"
                                placeholderText="Select date"
                                required
                              />
                            </Form.Group>
                          </Col>

                          {formData.tripType === "return" && (
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>
                                  <Calendar size={16} className="me-1" />
                                  Return Date
                                </Form.Label>
                                <DatePicker
                                  selected={formData.returnDate}
                                  onChange={(date) => handleDateChange(date, 'returnDate')}
                                  minDate={formData.departureDate || new Date()}
                                  dateFormat="dd-MM-yyyy"
                                  className="form-control"
                                  placeholderText="Select return date"
                                  required
                                />
                              </Form.Group>
                            </Col>
                          )}
                        </Row>
                      </>
                    )}

                    {/* Multi-City Form */}
                    {formData.tripType === "multicity" && (
                      <div className="mb-4">
                        <h6 className="mb-3">
                          Flight Segments (Max 6) - <small className="text-muted">Currently {formData.multiCitySegments.length} segment{formData.multiCitySegments.length > 1 ? 's' : ''}</small>
                          <Button variant="outline-secondary" size="sm" className="ms-3" onClick={loadExampleMultiCity}>Load Example Itinerary</Button>
                        </h6>
                        {formData.multiCitySegments.map((segment, index) => (
                          <Card key={index} className="mb-3 border">
                            <Card.Body className="p-3">
                              <Row className="align-items-end">
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label>From</Form.Label>
                                    <Form.Select
                                      value={segment.from}
                                      onChange={(e) => handleMultiCityChange(index, 'from', e.target.value)}
                                      required
                                    >
                                      <option value="">Select city</option>
                                      {AIRPORTS.map(airport => (
                                        <option key={airport} value={airport}>{airport}</option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label>To</Form.Label>
                                    <Form.Select
                                      value={segment.to}
                                      onChange={(e) => handleMultiCityChange(index, 'to', e.target.value)}
                                      required
                                    >
                                      <option value="">Select city</option>
                                      {AIRPORTS.map(airport => (
                                        <option key={airport} value={airport}>{airport}</option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label>Departure Date</Form.Label>
                                    <DatePicker
                                      selected={segment.departureDate}
                                      onChange={(date) => handleMultiCityChange(index, 'departureDate', date)}
                                      minDate={new Date()}
                                      dateFormat="dd-MM-yyyy"
                                      className="form-control"
                                      placeholderText="Select date"
                                      required
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={3}>
                                  <div className="d-flex gap-2">
                                    {formData.multiCitySegments.length > 1 && (
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => removeMultiCitySegment(index)}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                    {index === formData.multiCitySegments.length - 1 && formData.multiCitySegments.length < 6 && (
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={addMultiCitySegment}
                                      >
                                        Add Segment
                                      </Button>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Common Fields */}
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <Briefcase size={16} className="me-1" />
                            Cabin Class
                          </Form.Label>
                          <Form.Select
                            name="cabinClass"
                            value={formData.cabinClass}
                            onChange={handleInputChange}
                          >
                            <option value="Economy">Economy</option>
                            <option value="Premium Economy">Premium Economy</option>
                            <option value="Business">Business</option>
                            <option value="First Class">First Class</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <Users size={16} className="me-1" />
                            Passengers
                          </Form.Label>
                          <Row>
                            <Col md={4}>
                              <Form.Control
                                type="number"
                                placeholder="Adults"
                                name="adults"
                                min="1"
                                max="9"
                                value={formData.adults}
                                onChange={handleInputChange}
                              />
                              <small className="text-muted">Adults</small>
                            </Col>
                            <Col md={4}>
                              <Form.Control
                                type="number"
                                placeholder="Children"
                                name="children"
                                min="0"
                                max="9"
                                value={formData.children}
                                onChange={handleInputChange}
                              />
                              <small className="text-muted">Children</small>
                            </Col>
                            <Col md={4}>
                              <Form.Control
                                type="number"
                                placeholder="Infants"
                                name="infants"
                                min="0"
                                max="9"
                                value={formData.infants}
                                onChange={handleInputChange}
                              />
                              <small className="text-muted">Infants</small>
                            </Col>
                          </Row>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-center mt-4">
                      <Button type="submit" variant="primary" size="lg" className="px-5">
                        <Search size={20} className="me-2" />
                        Search Flights
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            ) : (
              // Flight Results
              <div className="flight-results">
                {/* Header */}
                <div className="results-header mb-4 p-3 bg-white shadow-sm rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <Button variant="outline-primary" onClick={handleBackToSearch}>
                      <ArrowLeft size={18} className="me-2" />
                      Back to Search
                    </Button>
                    <div className="text-center">
                      <h5 className="mb-0">
                        {formData.tripType === "multicity" ? (
                          formData.multiCitySegments.map((segment, index) => (
                            <span key={index}>
                              {segment.from?.split(' - ')[0]} → {segment.to?.split(' - ')[0]}
                              {index < formData.multiCitySegments.length - 1 && " | "}
                            </span>
                          ))
                        ) : (
                          <>
                            {formData.from?.split(' - ')[0]} → {formData.to?.split(' - ')[0]}
                            {formData.tripType === "return" && (
                              <span className="ms-2 text-muted">
                                (Return: {formData.returnDate?.toLocaleDateString('en-GB')})
                              </span>
                            )}
                          </>
                        )}
                      </h5>
                      <small className="text-muted">
                        {formData.tripType === "multicity" ? (
                          formData.multiCitySegments.map((segment, index) => (
                            <span key={index}>
                              {segment.departureDate?.toLocaleDateString('en-GB')}
                              {index < formData.multiCitySegments.length - 1 && " | "}
                            </span>
                          ))
                        ) : (
                          formData.departureDate?.toLocaleDateString('en-GB')
                        )} •
                        {formData.adults} Adult{formData.adults > 1 ? 's' : ''}
                        {formData.children > 0 && `, ${formData.children} Child${formData.children > 1 ? 'ren' : ''}`}
                        {formData.infants > 0 && `, ${formData.infants} Infant${formData.infants > 1 ? 's' : ''}`}
                      </small>
                    </div>
                    <div className="text-end">
                      <Badge bg="info">{filteredFlights.length} flights found</Badge>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Searching for flights...</p>
                  </div>
                ) : (
                  <Row>
                    {/* Filters Sidebar */}
                    <Col lg={3} className="mb-4">
                      <Card className="shadow-sm sticky-top" style={{ top: '20px' }}>
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">Filters</h6>
                        </Card.Header>
                        <Card.Body>
                          {/* Sort By */}
                          <div className="mb-4">
                            <label className="form-label fw-bold small">Sort By</label>
                            <Form.Select
                              size="sm"
                              value={filters.sortBy}
                              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            >
                              <option value="price">Price (Low to High)</option>
                              <option value="duration">Duration (Short to Long)</option>
                              <option value="departure">Departure Time</option>
                            </Form.Select>
                          </div>

                          {/* Price Range */}
                          <div className="mb-4">
                            <label className="form-label fw-bold small">Price Range</label>
                            <div className="small text-muted">
                              PKR {filters.priceRange[0].toLocaleString()} - PKR {filters.priceRange[1].toLocaleString()}
                            </div>
                            <input
                              type="range"
                              className="form-range"
                              min="0"
                              max="500000"
                              step="10000"
                              value={filters.priceRange[1]}
                              onChange={(e) => setFilters({ ...filters, priceRange: [0, parseInt(e.target.value)] })}
                            />
                          </div>

                          {/* Stops */}
                          <div className="mb-4">
                            <label className="form-label fw-bold small">Stops</label>
                            {['all', 'nonstop', 'onestop'].map(stop => (
                              <Form.Check
                                key={stop}
                                type="radio"
                                id={`stop-${stop}`}
                                name="stops"
                                label={stop === 'all' ? 'Any' : stop === 'nonstop' ? 'Non-stop' : '1 Stop'}
                                checked={filters.stops === stop}
                                onChange={() => setFilters({ ...filters, stops: stop })}
                              />
                            ))}
                          </div>

                          {/* Departure Time */}
                          <div className="mb-4">
                            <label className="form-label fw-bold small">Departure Time</label>
                            {['all', 'morning', 'afternoon', 'evening', 'night'].map(time => (
                              <Form.Check
                                key={time}
                                type="radio"
                                id={`time-${time}`}
                                name="departureTime"
                                label={time === 'all' ? 'Any Time' :
                                  time === 'morning' ? 'Morning (6AM-12PM)' :
                                    time === 'afternoon' ? 'Afternoon (12PM-6PM)' :
                                      time === 'evening' ? 'Evening (6PM-12AM)' : 'Night (12AM-6AM)'}
                                checked={filters.departureTime === time}
                                onChange={() => setFilters({ ...filters, departureTime: time })}
                              />
                            ))}
                          </div>

                          {/* Airlines */}
                          {getUniqueAirlines().length > 0 && (
                            <div className="mb-4">
                              <label className="form-label fw-bold small">Airlines</label>
                              {getUniqueAirlines().map(airline => (
                                <Form.Check
                                  key={airline}
                                  type="checkbox"
                                  id={`airline-${airline}`}
                                  label={getAirlineName(airline)}
                                  checked={filters.airlines.includes(airline)}
                                  onChange={() => toggleAirlineFilter(airline)}
                                />
                              ))}
                            </div>
                          )}

                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="w-100"
                            onClick={() => setFilters({
                              priceRange: [0, 500000],
                              stops: 'all',
                              airlines: [],
                              departureTime: 'all',
                              sortBy: 'price'
                            })}
                          >
                            Reset Filters
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Flight Cards */}
                    <Col lg={9}>
                      {filteredFlights.length === 0 ? (
                        <div>
                          <Alert variant="info">
                            <Info size={20} className="me-2" />
                            No flights found for the selected filters. Try adjusting your search criteria.
                          </Alert>
                          {/* Helpful fallback actions when no flights are present */}
                          <div className="d-flex gap-2 mb-3">
                            {formData.tripType === 'multicity' && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const existingToken = localStorage.getItem('idToken') || await authenticateAndSaveToken();
                                    const perLeg = await fetchPerLegOptions(formData.multiCitySegments.map(s => ({
                                      origin: s.from?.match(/- ([A-Z]{3})$/)?.[1],
                                      destination: s.to?.match(/- ([A-Z]{3})$/)?.[1],
                                      departureDate: formatDateDDMMYYYY(s.departureDate)
                                    })), existingToken);
                                    setPerLegOptions(perLeg);
                                    setPerLegSelected(new Array(perLeg.length).fill(null));
                                  } catch (e) {
                                    console.error('Fallback per-leg fetch failed', e);
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                              >
                                Fetch Per-Leg Options
                              </Button>
                            )}
                            {lastRawResponse && (
                              <Button variant="outline-secondary" size="sm" onClick={() => setShowRawModal(true)}>
                                View Raw Response
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : formData.tripType === "multicity" ? (
                        // Multi-city: render a single combined card that includes combined itineraries (if any)
                        <Card className="mb-4 shadow-sm flight-card">
                          <Card.Body>
                            <Row>
                              <Col md={9}>
                                <h5 className="mb-3 text-primary">Multi-City Search Results</h5>

                                {/* Combined itineraries (show top 3 if available) */}
                                {filteredFlights && filteredFlights.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="mb-3 text-dark">Combined Itineraries</h6>
                                    {filteredFlights.slice(0, 3).map((flight, fi) => (
                                      <div key={fi} className="mb-4 p-3 border rounded bg-white shadow-sm">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                          <div className="fw-bold fs-5">Itinerary {fi + 1}</div>
                                          <div className="text-end">
                                            <div className="fw-bold text-primary fs-4">{formatPrice(getFareAmount(flight), (flight.fare && flight.fare.currency) || 'PKR')}</div>
                                            <div className="small text-muted">Base: {formatPrice(Number(flight.fare?.baseFare || 0), (flight.fare && flight.fare.currency) || 'PKR')}</div>
                                          </div>
                                        </div>

                                        {/* Display each segment's flight details */}
                                        {flight.segments?.map((segment, segIdx) => (
                                          <div key={segIdx} className="mb-3 border-bottom pb-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                              <h6 className="text-muted mb-0">Leg {segIdx + 1}: {segment.ond?.origin} → {segment.ond?.destination}</h6>
                                              <div className="text-muted small">{formatDuration(segment.ond?.duration)}</div>
                                            </div>

                                            {/* show only direct / non-stop flights similar to screenshot */}
                                            {(segment.flights || []).filter(f => (f.stops === 0 || f.stopQuantity === 0 || f.stops === '0')).map((fl, flIdx) => (
                                              <div key={flIdx} className="py-3">
                                                <Row className="align-items-center">
                                                  {/* Airline logo and name */}
                                                  <Col md={2} className="text-center">
                                                    <img src={getAirlineLogo(fl.airlineCode)} alt={fl.airlineCode} style={{ width: 48, height: 48 }} onError={(e) => e.target.style.display = 'none'} />
                                                    <div className="fw-bold mt-2 small">{getAirlineName(fl.airlineCode)}</div>
                                                    <div className="small text-muted">{fl.airlineCode} {fl.flightNo}</div>
                                                  </Col>

                                                  {/* Departure time & origin */}
                                                  <Col md={4}>
                                                    <div className="fw-bold fs-5">{formatTime(fl.departureTime || fl.depTime || fl.departureDate)}</div>
                                                    <div className="fw-bold">{fl.departureLocation || fl.depAirport || fl.depCode}</div>
                                                    <div className="small text-muted">{getCityName(fl.departureLocation || fl.depAirport || fl.depCode)}</div>
                                                  </Col>

                                                  {/* center: duration + non-stop badge */}
                                                  <Col md={3} className="text-center">
                                                    <div className="small text-muted mb-2">{formatDuration(fl.duration || segment.ond?.duration)}</div>
                                                    <div className="my-2">
                                                      <Badge bg="primary" className="px-3 py-2">Non-Stop</Badge>
                                                    </div>
                                                  </Col>

                                                  {/* Arrival time & destination */}
                                                  <Col md={3} className="text-end">
                                                    <div className="fw-bold fs-5">{formatTime(fl.arrivalTime || fl.arrTime || fl.arrivalDate)}</div>
                                                    <div className="fw-bold">{fl.arrivalLocation || fl.arrAirport || fl.arrCode}</div>
                                                    <div className="small text-muted">{getCityName(fl.arrivalLocation || fl.arrAirport || fl.arrCode)}</div>
                                                  </Col>
                                                </Row>

                                                {/* small date label on right similar to screenshot */}
                                                <div className="text-end small text-muted mt-2">Flight {flIdx + 1} - {formatDateDDMMYYYY(fl.departureDate || fl.depDate || segment.ond?.depDate)}</div>
                                              </div>
                                            ))}
                                          </div>
                                        ))}

                                        {/* Select and Fare Rules buttons */}
                                        <div className="d-flex justify-content-end gap-2 mt-3">
                                          <Button variant="primary" onClick={() => handleBookFlight(flight)}>
                                            <CheckCircle size={16} className="me-1" />
                                            Select
                                          </Button>
                                          {flight.fareRuleOffered && (
                                            <Button variant="outline-info" size="sm" onClick={() => handleShowFareRules(flight)}>
                                              Fare Rules
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Per-Leg one-way options grouped together */}
                                {perLegOptions && perLegOptions.length > 0 && (
                                  <div className="mt-2 p-3 bg-light rounded">
                                    <h6>Per-Leg One-Way Options</h6>
                                    <small className="text-muted">Only one-way options are shown. Select one option per leg to assemble the combined itinerary.</small>
                                    {perLegOptions.map((options, legIdx) => (
                                      <div key={legIdx} className="mt-3">
                                        <div className="fw-bold">Leg {legIdx + 1}: {formData.multiCitySegments[legIdx]?.from?.split(' - ')[0]} → {formData.multiCitySegments[legIdx]?.to?.split(' - ')[0]}</div>
                                        {options.length === 0 && (
                                          <div className="text-muted">No one-way options found for this leg</div>
                                        )}
                                        {options.map((opt, optIdx) => (
                                          <div key={optIdx} className={`d-flex align-items-center justify-content-between p-2 mt-2 ${perLegSelected[legIdx] && perLegSelected[legIdx].id === opt.id ? 'border border-primary rounded' : 'border rounded'}`}>
                                            <div>
                                              <div className="fw-bold">{getAirlineName(opt.segments?.[0]?.flights?.[0]?.airlineCode || opt.segments?.[0]?.flights?.[0]?.airline)}</div>
                                              <div className="small text-muted">{opt.segments?.[0]?.flights?.[0]?.departureLocation} → {opt.segments?.[0]?.flights?.slice(-1)[0]?.arrivalLocation}</div>
                                              <div className="small text-muted">Price: {formatPrice(getFareAmount(opt), (opt.fare && opt.fare.currency) || 'PKR')}</div>
                                            </div>
                                            <div>
                                              <Button size="sm" variant={perLegSelected[legIdx] && perLegSelected[legIdx].id === opt.id ? 'success' : 'outline-primary'} onClick={() => selectPerLegOption(legIdx, opt)}>
                                                {perLegSelected[legIdx] && perLegSelected[legIdx].id === opt.id ? 'Selected' : 'Select'}
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ))}

                                    <div className="mt-4 d-flex gap-2">
                                      <Button variant="primary" onClick={validateCombinedItinerary} disabled={!perLegSelected || perLegSelected.some(s => !s)}>Validate & Book Combined Itinerary</Button>
                                      <Button variant="outline-secondary" onClick={() => { setPerLegOptions(null); setPerLegSelected([]); }}>Cancel</Button>
                                    </div>
                                  </div>
                                )}
                              </Col>

                              {/* Price and Book for combined card (if top itinerary exists) */}
                              <Col md={3} className="text-center border-start">
                                <div className="price-section">
                                  {filteredFlights && filteredFlights.length > 0 ? (
                                    <>
                                      <small className="text-muted d-block">Best Combined Price</small>
                                      <h3 className="price-amount mb-1 text-primary">{formatPrice(getFareAmount(filteredFlights[0]), (filteredFlights[0].fare && filteredFlights[0].fare.currency) || 'PKR')}</h3>
                                      <small className="text-muted d-block mb-3">Base: {formatPrice(Number(filteredFlights[0].fare?.baseFare || 0), (filteredFlights[0].fare && filteredFlights[0].fare.currency) || 'PKR')}</small>
                                      <Button variant="primary" size="lg" className="w-100" onClick={() => handleBookFlight(filteredFlights[0])}>
                                        <CheckCircle size={18} className="me-2" />
                                        Select Best
                                      </Button>
                                    </>
                                  ) : (
                                    <Alert variant="info">No combined itineraries available</Alert>
                                  )}
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ) : (
                        // Regular one-way/return display
                        filteredFlights.map((flight, index) => (
                          <Card key={index} className="mb-4 shadow-sm flight-card">
                            <Card.Body>
                              <Row>
                                {/* Flight Details */}
                                <Col md={9}>
                                  {flight.segments?.map((segment, segIdx) => (
                                    <div key={segIdx} className="mb-4">
                                      <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="text-muted mb-0">
                                          Segment {segIdx + 1}
                                          {segment.ond?.issuingAirline && (
                                            <Badge bg="secondary" className="ms-2">
                                              Operated by {getAirlineName(segment.ond.issuingAirline)}
                                            </Badge>
                                          )}
                                        </h6>
                                        <span className="text-muted small">
                                          <Clock size={14} className="me-1" />
                                          Total Duration: {formatDuration(segment.ond?.duration)}
                                        </span>
                                      </div>

                                      {segment.flights?.map((fl, flIdx) => (
                                        <div key={flIdx} className="mb-3 p-3 bg-light rounded">
                                          <Row className="align-items-center">
                                            {/* Airline Logo and Info */}
                                            <Col md={2} className="text-center">
                                              <img
                                                src={getAirlineLogo(fl.airlineCode)}
                                                alt={fl.airlineCode}
                                                style={{ width: '50px', height: '50px' }}
                                                onError={(e) => e.target.style.display = 'none'}
                                              />
                                              <div className="fw-bold mt-2">{getAirlineName(fl.airlineCode)}</div>
                                              <div className="small text-muted">
                                                {fl.airlineCode} {fl.flightNo}
                                              </div>
                                              {fl.operatingAirline && fl.operatingAirline !== fl.airlineCode && (
                                                <div className="small text-warning">
                                                  Operated by {fl.operatingAirline}
                                                </div>
                                              )}
                                            </Col>

                                            {/* Departure */}
                                            <Col md={3}>
                                              <div className="fw-bold fs-4">{formatTime(fl.departureTime)}</div>
                                              <div className="fw-bold">{fl.departureLocation}</div>
                                              <div className="small text-muted">{getCityName(fl.departureLocation)}</div>
                                              {fl.departureTerminal && (
                                                <Badge bg="info" className="mt-1">Terminal {fl.departureTerminal}</Badge>
                                              )}
                                              <div className="small text-muted mt-1">
                                                {fl.departureDate}
                                              </div>
                                            </Col>

                                            {/* Duration and Stops */}
                                            <Col md={2} className="text-center">
                                              <div className="small text-muted mb-1">
                                                <Clock size={14} className="me-1" />
                                                {formatDuration(fl.duration)}
                                              </div>
                                              <div className="position-relative my-2">
                                                <div className="border-bottom border-2 border-primary"></div>
                                                <Plane size={16} className="position-absolute top-50 start-50 translate-middle bg-white text-primary" />
                                              </div>
                                              <div className="small text-muted">
                                                {fl.stops === 0 ? 'Non-stop' : `${fl.stops} Stop(s)`}
                                              </div>
                                              {fl.equipmentType && (
                                                <div className="small text-muted mt-1">
                                                  Aircraft: {fl.equipmentType}
                                                </div>
                                              )}
                                            </Col>

                                            {/* Arrival */}
                                            <Col md={3}>
                                              <div className="fw-bold fs-4">{formatTime(fl.arrivalTime)}</div>
                                              <div className="fw-bold">{fl.arrivalLocation}</div>
                                              <div className="small text-muted">{getCityName(fl.arrivalLocation)}</div>
                                              {fl.arrivalTerminal && (
                                                <Badge bg="info" className="mt-1">Terminal {fl.arrivalTerminal}</Badge>
                                              )}
                                              <div className="small text-muted mt-1">
                                                {fl.arrivalDate}
                                              </div>
                                            </Col>

                                            {/* Baggage and Cabin */}
                                            <Col md={2}>
                                              <div className="small">
                                                {fl.baggage && fl.baggage.length > 0 && (
                                                  <>
                                                    <div className="d-flex align-items-center mb-1">
                                                      <Briefcase size={14} className="me-1 text-primary" />
                                                      <strong>Baggage:</strong>
                                                    </div>
                                                    {fl.baggage.map((bag, bagIdx) => (
                                                      <div key={bagIdx} className="text-muted ms-3">
                                                        {bag.type === 'checkIn' ? '✓' : '✈'} {bag.value} {bag.unit}
                                                        {bag.type === 'checkIn' ? ' Check-in' : ' Cabin'}
                                                      </div>
                                                    ))}
                                                  </>
                                                )}
                                                {fl.cabin && (
                                                  <div className="mt-2">
                                                    <Badge bg="secondary">
                                                      {fl.cabin === 'Y' ? 'Economy' :
                                                        fl.cabin === 'C' ? 'Business' :
                                                          fl.cabin === 'F' ? 'First Class' : fl.cabin}
                                                    </Badge>
                                                  </div>
                                                )}
                                                {fl.seatsAvailable && (
                                                  <div className="mt-2 small">
                                                    <Users size={14} className="me-1 text-success" />
                                                    {fl.seatsAvailable} seats left
                                                  </div>
                                                )}
                                              </div>
                                            </Col>
                                          </Row>

                                          {/* Connection Time */}
                                          {flIdx < segment.flights.length - 1 && (
                                            <div className="text-center mt-3 pt-2 border-top">
                                              <small className="text-warning">
                                                <AlertCircle size={14} className="me-1" />
                                                Layover at {fl.arrivalLocation} - Connection time will be displayed
                                              </small>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ))}

                                  {/* Flight Info Badges */}
                                  <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
                                    {flight.refundable && (
                                      <Badge bg="success" className="d-flex align-items-center gap-1">
                                        <CheckCircle size={14} /> Refundable
                                      </Badge>
                                    )}
                                    {!flight.refundable && (
                                      <Badge bg="danger" className="d-flex align-items-center gap-1">
                                        <XCircle size={14} /> Non-Refundable
                                      </Badge>
                                    )}
                                    {flight.instantTicketing && (
                                      <Badge bg="info" className="d-flex align-items-center gap-1">
                                        <CheckCircle size={14} /> Instant Ticketing
                                      </Badge>
                                    )}
                                    {flight.bookOnHold && (
                                      <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1">
                                        <Clock size={14} /> Book on Hold Available
                                      </Badge>
                                    )}
                                    {flight.brandedFareSupported && (
                                      <Badge bg="primary" className="d-flex align-items-center gap-1">
                                        <Info size={14} /> Multiple Fare Options
                                      </Badge>
                                    )}
                                    {flight.fareRuleOffered && (
                                      <Badge bg="secondary" className="d-flex align-items-center gap-1">
                                        <Info size={14} /> Fare Rules Available
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Fare Basis */}
                                  {flight.fareDetails?.fareBreakup && (
                                    <div className="mt-3 pt-3 border-top">
                                      <small className="text-muted">
                                        <strong>Fare Basis:</strong> {flight.fareDetails.fareBreakup.map(fb => fb.fareBasis).join(', ')}
                                      </small>
                                    </div>
                                  )}
                                </Col>

                                {/* Price and Book */}
                                <Col md={3} className="text-center border-start">
                                  <div className="price-section">
                                    <small className="text-muted d-block">Total Price</small>
                                    <h3 className="price-amount mb-1 text-primary">
                                      {formatPrice(getFareAmount(flight), (flight.fare && flight.fare.currency) || 'PKR')}
                                    </h3>
                                    <small className="text-muted d-block mb-3">
                                      Base: {formatPrice(Number(flight.fare?.baseFare || 0), (flight.fare && flight.fare.currency) || 'PKR')}<br />
                                      Tax: {formatPrice(Number(flight.fare?.tax || 0), (flight.fare && flight.fare.currency) || 'PKR')}
                                    </small>

                                    {/* Per Passenger Breakdown */}
                                    {flight.fareDetails?.fareBreakup && (
                                      <div className="mb-3 p-2 bg-light rounded">
                                        <small className="fw-bold d-block mb-2">Per Passenger:</small>
                                        {flight.fareDetails.fareBreakup.map((fb, fbIdx) => (
                                          <div key={fbIdx} className="small text-start">
                                            <strong>
                                              {fb.paxType === 'ADT' ? 'Adult' :
                                                fb.paxType === 'CHD' ? 'Child' :
                                                  fb.paxType === 'INF' ? 'Infant' : fb.paxType}:
                                            </strong>
                                            <div className="ms-2">
                                              Base: {flight.fare.currency} {parseFloat(fb.baseFare).toLocaleString()}<br />
                                              Tax: {flight.fare.currency} {parseFloat(fb.tax).toLocaleString()}<br />
                                              <strong>Total: {flight.fare.currency} {parseFloat(fb.total).toLocaleString()}</strong>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <Button
                                      variant="primary"
                                      size="lg"
                                      className="w-100"
                                      onClick={() => handleBookFlight(flight)}
                                    >
                                      <CheckCircle size={18} className="me-2" />
                                      Select Flight
                                    </Button>

                                    {flight.fareRuleOffered && (
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="w-100 mt-2"
                                        onClick={() => handleShowFareRules(flight)}
                                      >
                                        <Info size={14} className="me-1" />
                                        View Fare Rules
                                      </Button>
                                    )}

                                    {((flight.brandedFareSupported && !flight.brandedFareSeparate && flight.brands && flight.brands.length > 1) ||
                                      (flight.brandedFareSupported && flight.brandedFareSeparate)) && (
                                        <>
                                          <Button
                                            variant="outline-info"
                                            size="sm"
                                            className="w-100 mt-2"
                                            disabled={flight.loadingBrands}
                                            onClick={async () => {
                                              try {

                                                // Define headers for the request
                                                const existingToken = localStorage.getItem('idToken');
                                                const searchHeaders = { 'Content-Type': 'application/json' };
                                                if (existingToken) searchHeaders.Authorization = `Bearer ${existingToken}`;

                                                // If branded fares need separate fetching and aren't loaded yet
                                                if (flight.brandedFareSeparate && (!flight.brands || flight.brands.length === 0) && !flight.brandedFetchError) {
                                                  try {
                                                    console.log(`🎨 Fetching branded fares on click for flight with supplier ${flight.supplierCode}`);
                                                    // Mark loading on this flight to disable duplicate clicks
                                                    updateFlightInState(flight.id, { loadingBrands: true, brandedFetchError: null });
                                                    const brandResponse = await axios.post(
                                                      'http://127.0.0.1:8000/api/flights/branded-fares/',
                                                      {
                                                        flightData: flight,
                                                        origin: flight.origin,
                                                        destination: flight.destination
                                                      },
                                                      {
                                                        timeout: 30000,
                                                        headers: searchHeaders
                                                      }
                                                    );

                                                    if (brandResponse.data && brandResponse.data.brands) {
                                                      console.log(`✅ Found ${brandResponse.data.brands.length} branded fares on click`);
                                                      // Update the flight with brands
                                                      updateFlightInState(flight.id, { brands: brandResponse.data.brands, fareInfo: brandResponse.data.fareInfo, loadingBrands: false });
                                                      setSelectedFlight(prev => prev && prev.id === flight.id ? { ...prev, brands: brandResponse.data.brands, fareInfo: brandResponse.data.fareInfo } : prev);
                                                    } else {
                                                      updateFlightInState(flight.id, { brands: [], loadingBrands: false });
                                                    }
                                                  } catch (brandErr) {
                                                    console.error('❌ Failed to fetch branded fares on click:', brandErr);
                                                    const details = brandErr.response?.data || brandErr.message || 'Unknown error';
                                                    // Store the error on flight to avoid repeated requests
                                                    updateFlightInState(flight.id, { brandedFetchError: details, loadingBrands: false });
                                                    // Save last raw response for modal inspection
                                                    try { setLastRawResponse(typeof details === 'string' ? details : details); } catch (e) { }
                                                    // Show user-friendly message with an option to view raw server details
                                                    alert('Unable to load branded fare options. See console or use "View Raw Response" for details.');
                                                  }
                                                }

                                                setShowBrandModal(true);
                                              } catch (error) {
                                                console.error('❌ Error in branded fares onClick handler:', error);
                                                alert('An error occurred while loading branded fares.');
                                              }
                                            }}
                                          >
                                            {flight.loadingBrands ? (
                                              <><Spinner animation="border" size="sm" className="me-2" /> Loading...</>
                                            ) : (
                                              <><Info size={14} className="me-1" /> {flight.brandedFareSeparate && (!flight.brands || flight.brands.length === 0) ? 'View Fare Options' : `Compare ${flight.brands?.length || 0} Fare Options`}</>
                                            )}
                                          </Button>
                                          {flight.brandedFetchError && (
                                            <div className="mt-1">
                                              <div className="small text-danger">Branded fares unavailable: {typeof flight.brandedFetchError === 'string' ? flight.brandedFetchError : (flight.brandedFetchError?.error || flight.brandedFetchError?.message || 'Server error')}</div>
                                              <Button size="sm" variant="link" onClick={() => { setLastRawResponse(flight.brandedFetchError); setShowRawModal(true); }}>View Server Details</Button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))
                      )}
                    </Col>
                  </Row>
                )}
              </div>
            )}
          </Container>

          {/* Success Alert */}
          {bookingSuccess && (
            <Container className="mt-3">
              <Alert variant="success" onClose={() => setBookingSuccess(null)} dismissible>
                <Alert.Heading>
                  <CheckCircle size={24} className="me-2" />
                  Booking Confirmed!
                </Alert.Heading>
                <p className="mb-2">
                  Your flight has been successfully booked.
                </p>
                <hr />
                <div className="mb-0">
                  <strong>PNR:</strong> {bookingSuccess.pnr}<br />
                  <strong>Booking Reference:</strong> {bookingSuccess.bookingRefId}
                </div>
              </Alert>
            </Container>
          )}

          {/* Booking Modal */}
          <BookingModal
            show={showBookingModal}
            onHide={() => setShowBookingModal(false)}
            flight={selectedFlight}
            onBookingSuccess={handleBookingSuccess}
          />

          {/* Branded Fare Selector Modal */}
          <BrandedFareSelector
            show={showBrandModal}
            onHide={() => setShowBrandModal(false)}
            flight={selectedFlight}
            onSelectBrand={handleSelectBrand}
          />

          {/* Fare Rules Modal */}
          <FareRulesModal
            show={showFareRulesModal}
            onHide={() => setShowFareRulesModal(false)}
            flight={selectedFlightForRules}
            sealed={validatedSealed}
          />

          {/* Raw response modal for debugging search results */}
          <Modal show={showRawModal} onHide={() => setShowRawModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Last Search Raw Response</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {lastRawResponse ? JSON.stringify(lastRawResponse, null, 2) : 'No response captured.'}
                </pre>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowRawModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>

          {/* idToken Modal */}
          <Modal show={showTokenModal} onHide={() => setShowTokenModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Set idToken</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group>
                  <Form.Label>Paste idToken (JWT)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="eyJ..."
                  />
                </Form.Group>
                <div className="small text-muted mt-2">Current token will be overwritten.</div>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="danger" onClick={handleRemoveToken}>Remove</Button>
              <Button variant="secondary" onClick={() => setShowTokenModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveToken}>Save Token</Button>
            </Modal.Footer>
          </Modal>

        </div>
      </div>
    </div>
  );
};

export default AgentFlightUpdates;
