import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { CloudUpload } from "lucide-react";
import { PersonDash } from "react-bootstrap-icons";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import RawSelect from 'react-select';
import * as jwtDecode from "jwt-decode";
import { toast } from "react-toastify";

const CustomUmrahPackagesDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();

  // State declarations
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [packageData, setPackageData] = useState(state?.packageData || null);
  const [totalPrice, setTotalPrice] = useState(state?.totalPrice || 0);
  const [passengers, setPassengers] = useState(state?.passengers || []);
  const [manualFamilies, setManualFamilies] = useState([]);

  const countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar (Burma)",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe"
  ]

  const token = localStorage.getItem("agentAccessToken");
  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0];
  };
  const orgId = getOrgId();

  // Create passenger function
  const createPassenger = (type, familyIndex = null, isHead = false) => ({
    id: Date.now() + Math.random(),
    type,
    title: "",
    name: "",
    lName: "",
    DOD: "",
    passportNumber: "",
    passportExpiry: "",
    country: "",
    passportFile: null,
    includeBed: false,
    visa: false,
    familyIndex: familyIndex,
    isHead: isHead
  });

  // Initialize passengers based on package data and manualFamilies
  const initializePassengers = (packageData, families = []) => {
    const initialPassengers = [];

    if (families && families.length > 0) {
      // Create passengers grouped by family
      families.forEach((family, familyIndex) => {
        const adults = parseInt(family.adults || 0);
        const children = parseInt(family.children || 0);
        const infants = parseInt(family.infants || 0);

        // Add adults (first adult is head of family)
        for (let i = 0; i < adults; i++) {
          initialPassengers.push(createPassenger("Adult", familyIndex, i === 0));
        }

        // Add children
        for (let i = 0; i < children; i++) {
          initialPassengers.push(createPassenger("Child", familyIndex, false));
        }

        // Add infants
        for (let i = 0; i < infants; i++) {
          initialPassengers.push(createPassenger("Infant", familyIndex, false));
        }
      });
    } else {
      // Fallback to ungrouped passengers
      const { total_adaults, total_children, total_infants } = packageData;

      for (let i = 0; i < total_adaults; i++) {
        initialPassengers.push(createPassenger("Adult", 0, i === 0));
      }
      for (let i = 0; i < total_children; i++) {
        initialPassengers.push(createPassenger("Child", 0, false));
      }
      for (let i = 0; i < total_infants; i++) {
        initialPassengers.push(createPassenger("Infant", 0, false));
      }
    }

    return initialPassengers;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Check for saved draft from Book Now
        const savedDraft = sessionStorage.getItem('umrah_booknow_v1');
        let draftData = null;
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (parsed.__expiresAt && Date.now() < parsed.__expiresAt) {
              draftData = parsed.value;
            } else {
              sessionStorage.removeItem('umrah_booknow_v1');
            }
          } catch (e) {
            // ignore parse error
          }
        }

        // Always fetch cities data
        const citiesResponse = await axios.get(
          `http://127.0.0.1:8000/api/cities/?organization=${orgId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCities(citiesResponse.data);

        if (state?.packageData) {
          // If coming back from review, use existing state
          setPackageData(state.packageData);
          setPassengers(state.passengers);
          setTotalPrice(state.totalPrice);
          if (state.manualFamilies) {
            setManualFamilies(state.manualFamilies);
          }
        } else if (draftData) {
          // Use draft data from Book Now

          // Extract manualFamilies if available
          const families = draftData.manualFamilies && Array.isArray(draftData.manualFamilies) ? draftData.manualFamilies : [];
          if (families.length > 0) {
            setManualFamilies(families);
          }

          // Check if it's already in API format (from table Book Now) or needs transformation (from invoice Book Now)
          let transformedData;

          if (draftData.total_adaults !== undefined) {
            // Already in API format (from table Book Now)
            transformedData = {
              ...draftData,
              id: id,
              // Map fields to ensure compatibility with Detail/Review render
              visa_total_cost: draftData.visa_total_cost || draftData.visas_cost || 0,
              total_cost: draftData.total_cost || 0,
              // Ensure we don't lose the calculated costs if they exist under different names
              hotels_cost: draftData.hotels_cost || 0,
              transports_cost: draftData.transports_cost || 0,
              foods_cost: draftData.foods_cost || 0,
              ziarats_cost: draftData.ziarats_cost || 0
            };
          } else {
            // Transform from calculator format (from invoice Book Now)
            transformedData = {
              id: id,
              total_adaults: parseInt(draftData.formData?.totalAdults) || 0,
              total_children: parseInt(draftData.formData?.totalChilds) || 0,
              total_infants: parseInt(draftData.formData?.totalInfants) || 0,
              hotel_details: (draftData.hotelForms || []).map(form => ({
                hotel: form.hotelId ? parseInt(form.hotelId) : form.hotel,
                room_type: form.roomType || form.room_type || "",
                sharing_type: form.sharingType || form.sharing_type || "Gender or Family",
                check_in_time: form.checkIn || form.check_in_time || "",
                check_out_time: form.checkOut || form.check_out_time || "",
                number_of_nights: parseInt(form.noOfNights || form.number_of_nights || 0),
                special_request: form.specialRequest || form.special_request || "",
                price: form.price || 0,
                quantity: form.quantity || 2,
                quinty: form.quinty || null,
                is_self_hotel: form.isSelfHotel || form.is_self_hotel || false,
                self_hotel_name: form.selfHotelName || form.self_hotel_name || null,
                assigned_families: form.assignedFamilies || form.assigned_families || [],
                hotel_info: form.hotel_info || (form.hotelId ? { id: parseInt(form.hotelId), name: form.hotelName || "" } : null)
              })),
              transport_details: draftData.transportForms || [],
              ticket_details: draftData.ticket_details || (draftData.selectedFlight ? [{ ticket_info: draftData.selectedFlight }] : []),
              food_details: draftData.food_details || draftData.foodForms || [],
              ziarat_details: draftData.ziarat_details || draftData.ziaratForms || [],
              adault_visa_price: draftData.adault_visa_price || parseFloat(draftData.costs?.adultVisaCost) || 0,
              child_visa_price: draftData.child_visa_price || parseFloat(draftData.costs?.childVisaCost) || 0,
              infant_visa_price: draftData.infant_visa_price || parseFloat(draftData.costs?.infantVisaCost) || 0,
              visa_total_cost: draftData.costs?.visaCost ? parseFloat(draftData.costs.visaCost.toString().replace(/,/g, '')) : 0, // Fallback Source
              margin: draftData.margin || parseFloat(draftData.formData?.margin) || 0,
              total_cost: draftData.total_cost || parseFloat(draftData.costs?.grandTotal) || 0,
              status: "Custom Umrah Package"
            };
          }

          setPackageData(transformedData);
          setTotalPrice(transformedData.total_cost);
          setPassengers(initializePassengers(transformedData, families));
        } else if (id && !id.startsWith('draft-')) {
          // Only fetch from API if ID is not a draft ID
          const packageResponse = await axios.get(
            `http://127.0.0.1:8000/api/custom-umrah-packages/${id}/?organization=${orgId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          setPackageData(packageResponse.data);
          calculateTotalPrice(packageResponse.data);
          setPassengers(initializePassengers(packageResponse.data, []));
        } else {
          // Draft ID without saved data - redirect back
          console.warn('Draft ID provided but no saved data found');
          navigate('/packages/umrah-calculater');
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, state, orgId, token]);

  // Debug packageData to see what we have
  useEffect(() => {
    if (packageData) {
      console.log('📦 Hotel Details:', packageData.hotel_details);
    }
  }, [packageData]);

  // Enrich package data with missing info (hotel names, etc) - runs once after packageData is set
  useEffect(() => {
    let isMounted = true;

    const enrichPackageData = async () => {
      if (!packageData || !packageData.hotel_details || packageData.hotel_details.length === 0) return;

      try {
        // Check if any hotel needs enrichment
        const needsEnrichment = packageData.hotel_details.some(hotel =>
          hotel.hotel && !hotel.hotel_info?.name
        );

        if (!needsEnrichment) {
          return;
        }

        // Fetch all hotels to get names
        const hotelsResponse = await axios.get(
          `http://127.0.0.1:8000/api/hotels/?organization=${orgId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const hotels = hotelsResponse.data;

        if (!isMounted) return;

        // Enrich hotel details with hotel info
        const enrichedHotels = packageData.hotel_details.map(hotel => {
          if (hotel.hotel && !hotel.hotel_info?.name) {
            const hotelInfo = hotels.find(h => h.id === hotel.hotel);
            if (hotelInfo) {
              return { ...hotel, hotel_info: { id: hotelInfo.id, name: hotelInfo.name } };
            }
          }
          return hotel;
        });

        if (isMounted) {
          setPackageData(prev => ({
            ...prev,
            hotel_details: enrichedHotels
          }));
        }
      } catch (error) {
        console.error('Error enriching package data:', error);
      }
    };

    const timer = setTimeout(() => {
      enrichPackageData();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageData?.id]);

  const handleContinue = (e) => {
    e.preventDefault();
    if (validateForm()) {
      navigate("/packages/custom-umrah/review", {
        state: {
          packageData,
          passengers,
          totalPrice,
          cities,
          id,
          manualFamilies
        }
      });
    }
  };


  const getCityCode = (cityData) => {
    // Handle if cityData is an object with id and name
    if (typeof cityData === 'object' && cityData !== null) {
      // First try to find the city in cities array to get proper code
      if (cityData.id) {
        const city = cities.find(c => c.id === cityData.id);
        if (city && city.code) return city.code.toUpperCase();
      }
      // If has code field, use it
      if (cityData.code) return cityData.code.toUpperCase();
      // Fallback: use first 3 letters of name in uppercase
      if (cityData.name) return cityData.name.substring(0, 3).toUpperCase();
      return 'UNK';
    }
    // Handle if cityData is just an ID
    const city = cities.find(c => c.id === cityData);
    return city ? city.code.toUpperCase() : 'UNK';
  };

  // Format flight display: "SV.234-LHE-JED 19-DEC-2024-23:20-01:20"
  const formatFlightDisplay = (trip) => {
    // Get airline name abbreviation (first letters or extract code)
    const airlineName = trip.airline?.name || '';
    const airlineCode = airlineName.split(' ').map(word => word[0]).join('').toUpperCase() || 'FL';
    const flightNum = trip.flight_number || 'N/A';
    const flightCode = `${airlineCode}.${flightNum}`;

    const depCity = getCityCode(trip.departure_city);
    const arrCity = getCityCode(trip.arrival_city);

    // Format date as "19-DEC-2024"
    const depDate = new Date(trip.departure_date_time);
    const dateStr = depDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-').toUpperCase();

    // Format times as "23:20"
    const depTime = depDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // If we have arrival time, format it too
    let arrTime = '';
    if (trip.arrival_date_time) {
      const arrDate = new Date(trip.arrival_date_time);
      arrTime = arrDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    return arrTime
      ? `${flightCode}-${depCity}-${arrCity} ${dateStr}-${depTime}-${arrTime}`
      : `${flightCode}-${depCity}-${arrCity} ${dateStr}-${depTime}`;
  };

  const [riyalRate, setRiyalRate] = useState(null);

  // Add this useEffect to fetch the riyal rates
  useEffect(() => {
    const fetchRiyalRates = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/riyal-rates/?organization=${orgId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.length > 0) {
          setRiyalRate(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching riyal rates:", error);
      }
    };

    fetchRiyalRates();
  }, [token]);

  // Updated conversion function
  const convertPrice = (price, isInPKR) => {
    if (!riyalRate) return price; // Return original if rates not loaded yet

    // If price is already in PKR or rate is 0, return as-is
    if (isInPKR || riyalRate.rate === 0) {
      return price;
    }
    // Otherwise convert from SAR to PKR
    return price * riyalRate.rate;
  };

  // Updated calculateTotalPrice function
  const calculateTotalPrice = (data) => {
    if (!data) return 0;

    // Fallback if riyalRate is missing
    const rate = riyalRate?.rate || 1;
    const isHotelPkr = riyalRate?.is_hotel_pkr ?? false;
    const isVisaPkr = riyalRate?.is_visa_pkr ?? false;
    const isTransportPkr = riyalRate?.is_transport_pkr ?? false;
    const isFoodPkr = riyalRate?.is_food_pkr ?? false;
    const isZiaratPkr = riyalRate?.is_ziarat_pkr ?? false;

    // FIX: If this is a Custom Umrah Package (from Calculator), TRUST the total_cost!
    // Do not attempt to re-calculate from line items.
    if (data.total_cost !== undefined) {
      const trustedTotal = typeof data.total_cost === 'string'
        ? parseFloat(data.total_cost.replace(/,/g, ''))
        : data.total_cost;

      console.log('💰 Using Trusted Total for Cost:', trustedTotal);
      setTotalPrice(trustedTotal);
      return;
    }

    let total = 0;

    // Calculate hotel costs (price is already Total for the line)
    data.hotel_details.forEach(hotel => {
      const price = isHotelPkr ? (hotel.price || 0) : (hotel.price || 0) * rate;
      total += price;
    });

    // Calculate visa costs (prices are Per Person)
    const adultVisaPrice = isVisaPkr ? (data.adault_visa_price || 0) : (data.adault_visa_price || 0) * rate;
    const childVisaPrice = isVisaPkr ? (data.child_visa_price || 0) : (data.child_visa_price || 0) * rate;
    const infantVisaPrice = isVisaPkr ? (data.infant_visa_price || 0) : (data.infant_visa_price || 0) * rate;

    let totalVisa = (adultVisaPrice * data.total_adaults) +
      (childVisaPrice * data.total_children) +
      (infantVisaPrice * data.total_infants);

    // Fallback: If calculated total is 0 but we have a stored total from the draft, use it
    // The stored total from draft (costs.visaCost) is typically already converted/final logic
    // We assume it is in PKR if it was displayed to the user, or valid base currency.
    // Given the context, we treat it as valid final price to add.
    if (totalVisa === 0 && data.visa_total_cost) {
      totalVisa = data.visa_total_cost;
    }

    total += totalVisa;

    // Calculate transport costs
    // Calculate transport costs
    data.transport_details.forEach(transport => {
      const adultTransportPrice = isTransportPkr
        ? transport.transport_sector_info?.adault_price || 0
        : (transport.transport_sector_info?.adault_price || 0) * rate;

      const childTransportPrice = isTransportPkr
        ? transport.transport_sector_info?.child_price || 0
        : (transport.transport_sector_info?.child_price || 0) * rate;

      const infantTransportPrice = isTransportPkr
        ? transport.transport_sector_info?.infant_price || 0
        : (transport.transport_sector_info?.infant_price || 0) * rate;

      total += adultTransportPrice * data.total_adaults;
      total += childTransportPrice * data.total_children;
      total += infantTransportPrice * data.total_infants;
    });

    // Calculate flight costs (always in PKR)
    data.ticket_details.forEach(ticket => {
      // Use child_price/infant_price if available, otherwise fall back to child_fare/infant_fare
      const tInfo = ticket.ticket_info;
      const adultPrice = tInfo?.adult_selling_price || tInfo?.adult_price || tInfo?.adult_fare || 0;
      const childPrice = tInfo?.child_selling_price || tInfo?.child_price || tInfo?.child_fare || 0;
      const infantPrice = tInfo?.infant_selling_price || tInfo?.infant_price || tInfo?.infant_fare || 0;

      const adultTotal = adultPrice * data.total_adaults;
      const childTotal = childPrice * data.total_children;
      const infantTotal = infantPrice * data.total_infants;

      total += adultTotal;
      total += childTotal;
      total += infantTotal;
    });

    // Calculate food costs
    if (data.food_details && data.food_details.length > 0) {
      data.food_details.forEach(food => {
        const adultPrice = food.food_info?.adult_selling_price || 0;
        const childPrice = food.food_info?.child_selling_price || 0;
        const infantPrice = food.food_info?.infant_selling_price || 0;
        const totalFood = (adultPrice * data.total_adaults) + (childPrice * data.total_children) + (infantPrice * data.total_infants);
        const convertedFood = isFoodPkr ? totalFood : totalFood * rate;
        total += convertedFood;
      });
    }

    // Calculate ziarat costs - use per-passenger-type prices
    // Calculate ziarat costs - use per-passenger-type prices
    if (data.ziarat_details && data.ziarat_details.length > 0) {
      data.ziarat_details.forEach(ziarat => {
        // Use per-passenger-type prices from ziarat_info (similar to food calculation)
        const adultPrice = ziarat.ziarat_info?.adult_selling_price || ziarat.adult_selling_price || 0;
        const childPrice = ziarat.ziarat_info?.child_selling_price || ziarat.child_selling_price || 0;
        const infantPrice = ziarat.ziarat_info?.infant_selling_price || ziarat.infant_selling_price || 0;

        const totalZiarat = (adultPrice * data.total_adaults) + (childPrice * data.total_children) + (infantPrice * data.total_infants);
        const convertedZiarat = isZiaratPkr ? totalZiarat : totalZiarat * rate;
        total += convertedZiarat;
      });
    }

    setTotalPrice(total);
  };

  useEffect(() => {
    if (packageData && riyalRate) {
      calculateTotalPrice(packageData);
    }
  }, [packageData, riyalRate]);

  // const calculateTotalPrice = (data) => {
  //   if (!data) return 0;

  //   let total = 0;

  //   // Calculate hotel costs
  //   data.hotel_details.forEach(hotel => {
  //     total += (hotel.price || 0) * data.total_adaults;
  //   });

  //   // Calculate visa costs
  //   total += (data.adault_visa_price || 0) * data.total_adaults;
  //   total += (data.child_visa_price || 0) * data.total_children;
  //   total += (data.infant_visa_price || 0) * data.total_infants;

  //   // Calculate transport costs
  //   data.transport_details.forEach(transport => {
  //     total += (transport.transport_sector_info?.adault_price || 0) * data.total_adaults;
  //     total += (transport.transport_sector_info?.child_price || 0) * data.total_children;
  //     total += (transport.transport_sector_info?.infant_price || 0) * data.total_infants;
  //   });

  //   // Calculate flight costs
  //   data.ticket_details.forEach(ticket => {
  //     total += (ticket.ticket_info?.adult_price || 0) * data.total_adaults;
  //     total += (ticket.ticket_info?.child_price || 0) * data.total_children;
  //     total += (ticket.ticket_info?.infant_price || 0) * data.total_infants;
  //   });

  //   setTotalPrice(total);
  // };

  const getCityName = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : `City (ID: ${cityId})`;
  };

  const getTitleOptions = (passengerType) => {
    switch (passengerType) {
      case "Adult":
        return (
          <>
            <option value="">Select Title</option>
            <option value="MR">MR</option>
            <option value="MRS">MRS</option>
            <option value="MS">MS</option>
          </>
        );
      case "Child":
        return (
          <>
            <option value="">Select Title</option>
            <option value="MSTR">MSTR</option>
            <option value="MISS">MISS</option>
          </>
        );
      case "Infant":
        return (
          <>
            <option value="">Select Title</option>
            <option value="MSTR">MSTR</option>
            <option value="MISS">MISS</option>
          </>
        );
      default:
        return <option value="">Select Type First</option>;
    }
  };

  // const [passengers, setPassengers] = useState([]);

  const addPassenger = () => {
    setPassengers([...passengers, createPassenger("Adult")]);
  };

  const removePassenger = (id) => {
    if (passengers.length <= packageData.total_adaults + packageData.total_children + packageData.total_infants) {
      alert("You cannot remove the initial passengers included in the package");
      return;
    }
    setPassengers(passengers.filter((p) => p.id !== id));
  };

  const updatePassenger = (id, field, value) => {
    setPassengers(
      passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handlePassportUpload = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors({
          ...formErrors,
          [`passenger-passportFile-${id}`]: "File size should be less than 2MB"
        });
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setFormErrors({
          ...formErrors,
          [`passenger-passportFile-${id}`]: "Only JPEG, PNG, or PDF files are allowed"
        });
        return;
      }
      updatePassenger(id, "passportFile", file);
      setFormErrors({
        ...formErrors,
        [`passenger-passportFile-${id}`]: undefined
      });
    }
  };

  // Convert File to base64 string
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle Continue Booking - save passengers to sessionStorage
  const handleContinueBooking = async () => {
    try {
      // Validate all passengers have required fields
      const errors = {};
      passengers.forEach(passenger => {
        if (!passenger.title) errors[`passenger-title-${passenger.id}`] = "Title is required";
        if (!passenger.name) errors[`passenger-name-${passenger.id}`] = "First name is required";
        if (!passenger.lName) errors[`passenger-lName-${passenger.id}`] = "Last name is required";
        if (!passenger.DOB) errors[`passenger-DOB-${passenger.id}`] = "Date of birth is required";
        if (!passenger.passportNumber) errors[`passenger-passportNumber-${passenger.id}`] = "Passport number is required";
        if (!passenger.passportExpiry) errors[`passenger-passportExpiry-${passenger.id}`] = "Passport expiry is required";
        if (!passenger.country) errors[`passenger-country-${passenger.id}`] = "Country is required";
        if (!passenger.passportFile) errors[`passenger-passportFile-${passenger.id}`] = "Passport file is required";
      });

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error("Please fill all required fields");
        return;
      }

      // Convert all passport files to base64
      const passengersWithBase64 = await Promise.all(
        passengers.map(async (passenger) => {
          const base64File = await fileToBase64(passenger.passportFile);
          return {
            ...passenger,
            passportFile: base64File
          };
        })
      );

      // Get token for expiry calculation
      const token = localStorage.getItem('token');
      let expiresAt = Date.now() + 60 * 60 * 1000; // default 1 hour
      try {
        if (token) {
          const decodeFn = (jwtDecode && jwtDecode.default) ? jwtDecode.default : jwtDecode;
          const decoded = decodeFn(token);
          if (decoded && decoded.exp) {
            expiresAt = decoded.exp * 1000;
          }
        }
      } catch (e) {
        // use default
      }

      // Save to sessionStorage
      const payload = {
        __version: 1,
        __expiresAt: expiresAt,
        value: {
          passengers: passengersWithBase64,
          manualFamilies: manualFamilies
        }
      };

      sessionStorage.setItem('umrah_passengers_v1', JSON.stringify(payload));
      toast.success('Passenger data saved successfully');

      // Navigate to review page
      navigate('/packages/custom-umrah/review');
    } catch (error) {
      console.error('Error saving passenger data:', error);
      toast.error('Failed to save passenger data');
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    passengers.forEach(passenger => {
      if (!passenger.title) {
        errors[`passenger-title-${passenger.id}`] = "Title is required";
        isValid = false;
      }
      if (!passenger.name) {
        errors[`passenger-name-${passenger.id}`] = "First name is required";
        isValid = false;
      }
      if (!passenger.lName) {
        errors[`passenger-lName-${passenger.id}`] = "Last name is required";
        isValid = false;
      }
      if (!passenger.DOB) {
        errors[`passenger-DOB-${passenger.id}`] = "DOB is required";
        isValid = false;
      }
      if (!passenger.passportNumber) {
        errors[`passenger-passportNumber-${passenger.id}`] = "Passport number is required";
        isValid = false;
      }
      if (!passenger.passportExpiry) {
        errors[`passenger-passportExpiry-${passenger.id}`] = "Passport expiry is required";
        isValid = false;
      } else if (new Date(passenger.passportExpiry) < new Date()) {
        errors[`passenger-passportExpiry-${passenger.id}`] = "Passport must be valid";
        isValid = false;
      }
      if (!passenger.passportIssue) {
        errors[`passenger-passportIssue-${passenger.id}`] = "Passport issue date is required";
        isValid = false;
      }
      if (!passenger.country) {
        errors[`passenger-country-${passenger.id}`] = "Country is required";
        isValid = false;
      }
      if (!passenger.passportFile) {
        errors[`passenger-passportFile-${passenger.id}`] = "Passport copy is required";
        isValid = false;
      }

      if (passenger.dob) {
        const dobDate = new Date(passenger.dob);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();

        if (passenger.type === "Adult" && age < 12) {
          errors[`passenger-${passenger.id}-dob`] = "Adult must be 12+ years";
          isValid = false;
        } else if (passenger.type === "Child" && (age < 2 || age >= 12)) {
          errors[`passenger-${passenger.id}-dob`] = "Child must be 2-11 years";
          isValid = false;
        } else if (passenger.type === "Infant" && age >= 2) {
          errors[`passenger-${passenger.id}-dob`] = "Infant must be under 2 years";
          isValid = false;
        }
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleFieldChange = (passengerId, field, value) => {
    setPassengers(prev =>
      prev.map(p =>
        p.id === passengerId ? { ...p, [field]: value } : p
      )
    );

    // Clear error for this field if it becomes valid
    setFormErrors(prevErrors => {
      const updatedErrors = { ...prevErrors };
      if (value && updatedErrors[`passenger-${field}-${passengerId}`]) {
        delete updatedErrors[`passenger-${field}-${passengerId}`];
      }
      return updatedErrors;
    });
  };


  // const handleContinue = (e) => {
  //   e.preventDefault();
  //   if (validateForm()) {
  //     // Prepare the data to pass to BookingReview
  //     const bookingData = {
  //       packageData,
  //       passengers,
  //       totalPrice,
  //       cities // if you need city names in the review
  //     };

  //     // Navigate to BookingReview with state
  //     navigate("/packages/custom-umrah/review", { state: bookingData });
  //   }
  // };

  if (loading) {
    return <div className="text-center py-5">Loading...</div>;
  }

  if (!packageData) {
    return <div className="text-center py-5">Package not found</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4 mb-3">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center flex-wrap">
                    {/* Step 1 */}
                    <div className="d-flex align-items-center me-4">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        1
                      </div>
                      <span className="ms-2 text-primary fw-bold">
                        Booking Detail
                      </span>
                    </div>

                    {/* Line 1 (active) */}
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>

                    {/* Step 2 (now marked complete) */}
                    <div className="d-flex align-items-center mx-4">
                      <div
                        className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        2
                      </div>
                      <span className="ms-2 text-muted">
                        Booking Review
                      </span>
                    </div>

                    {/* Line 2 (inactive) */}
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>

                    {/* Step 3 (still upcoming) */}
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        3
                      </div>
                      <span className="ms-2 text-muted">Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="row mt-5">
                <div className="col-12">
                  <h5 className="mb-4 fw-bold">Booking Detail</h5>

                  {/* Package Details Card */}
                  <div className="card mb-4">
                    <div className="card-body" style={{ background: "#F2F9FF" }}>
                      <div className="row">
                        <div className="col-md-8">
                          <h4 className="mb-3 fw-bold">Custom Umrah Package</h4>

                          {/* Hotel Details */}
                          <div className="mb-3">
                            <strong>Hotel:</strong>
                            {packageData.hotel_details && packageData.hotel_details.length > 0 ? (
                              packageData.hotel_details.map((hotel, index) => {
                                const hotelName = hotel.hotel_info?.name || hotel.self_hotel_name || (hotel.hotel ? `Hotel ID: ${hotel.hotel}` : 'Unknown Hotel');
                                return (
                                  <div key={index} className="small text-muted">
                                    {hotel.number_of_nights || 0} Nights at {hotelName} ({hotel.room_type}) -
                                    Check-in: {formatDate(hotel.check_in_time)}, Check-out: {formatDate(hotel.check_out_time)}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="small text-muted">Not included</div>
                            )}
                          </div>

                          {/* Transport Details */}
                          <div className="mb-3">
                            <strong>Transport:</strong>
                            {packageData.transport_details && packageData.transport_details.length > 0 ? (
                              packageData.transport_details.map((transport, index) => {
                                let sectorDisplay = 'Transport Service';

                                // FIRST: Check if this transport has a big sector with small sectors
                                if (transport.transport_sector_info?.big_sector?.small_sectors &&
                                  transport.transport_sector_info.big_sector.small_sectors.length > 0) {
                                  // Build full route from small sectors
                                  const smallSectors = transport.transport_sector_info.big_sector.small_sectors;
                                  const cityCodes = [];

                                  // Add first departure city
                                  if (smallSectors[0]) {
                                    cityCodes.push(smallSectors[0].departure_city || smallSectors[0].departure_city_code || '');
                                  }

                                  // Add all arrival cities
                                  smallSectors.forEach(s => {
                                    cityCodes.push(s.arrival_city || s.arrival_city_code || '');
                                  });

                                  // Remove consecutive duplicates
                                  const uniqueCodes = cityCodes.filter((code, idx, array) =>
                                    idx === 0 || code !== array[idx - 1]
                                  );

                                  const vehicleName = transport.vehicle_type || transport.transport_sector_info?.name || 'Transport';
                                  sectorDisplay = `${uniqueCodes.join('-')} (${smallSectors.length} sectors) - ${vehicleName}`;

                                } else if (transport.departure_city && transport.arrival_city) {
                                  // Individual sector from expanded data
                                  const depCity = transport.departure_city;
                                  const arrCity = transport.arrival_city;
                                  const vehicleName = transport.vehicle_type || 'Transport';
                                  const sectorType = transport.sector_type ? ` - ${transport.sector_type}` : '';
                                  sectorDisplay = `${depCity} → ${arrCity} (${vehicleName})${sectorType}`;

                                } else if (transport.transport_sector_info) {
                                  // Fallback for small sectors
                                  const sector = transport.transport_sector_info?.small_sector || transport.transport_sector_info;
                                  if (sector && (sector.departure_city || sector.departure_city_code)) {
                                    const depCity = sector.departure_city_code || sector.departure_city || '';
                                    const arrCity = sector.arrival_city_code || sector.arrival_city || '';
                                    const vehicleName = transport.transport_sector_info?.name || transport.vehicle_type || 'Transport';
                                    sectorDisplay = `${depCity} → ${arrCity} (${vehicleName})`;
                                  } else {
                                    sectorDisplay = transport.transport_sector_info?.name || transport.vehicle_type || 'Transport Service';
                                  }
                                }

                                return (
                                  <div key={index} className="small text-muted">
                                    {sectorDisplay}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="small text-muted">Not included</div>
                            )}
                          </div>

                          {/* Flight Details */}
                          <div className="mb-3">
                            <strong>Flight:</strong>
                            {packageData.ticket_details && packageData.ticket_details.length > 0 ? (
                              packageData.ticket_details.map((ticket, index) => (
                                <React.Fragment key={index}>
                                  {ticket.ticket_info?.trip_details?.map((trip, tripIndex) => (
                                    <div key={tripIndex} className="small text-muted">
                                      {formatFlightDisplay(trip)}
                                    </div>
                                  ))}
                                </React.Fragment>
                              ))
                            ) : (
                              <div className="small text-muted">Not included</div>
                            )}
                          </div>

                          {/* Food Details */}
                          <div className="mb-3">
                            <strong>Food:</strong>
                            {packageData.food_details && packageData.food_details.length > 0 ? (
                              packageData.food_details.map((food, index) => {
                                const totalPax = (packageData.total_adaults || 0) + (packageData.total_children || 0) + (packageData.total_infants || 0);
                                return (
                                  <div key={index} className="small text-muted">
                                    {food.food_info?.title || 'Food Service'} - {totalPax} persons
                                    {food.hotel_name && ` at ${food.hotel_name}`}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="small text-muted">Not included</div>
                            )}
                          </div>

                          {/* Ziarat Details */}
                          <div className="mb-3">
                            <strong>Ziarat:</strong>
                            {packageData.ziarat_details && packageData.ziarat_details.length > 0 ? (
                              packageData.ziarat_details.map((ziarat, index) => (
                                <div key={index} className="small text-muted">
                                  {ziarat.ziarat_info?.ziarat_title || 'Ziarat Service'}
                                </div>
                              ))
                            ) : (
                              <div className="small text-muted">Not included</div>
                            )}
                          </div>

                          {/* Visa Details */}
                          <div className="mb-3">
                            <strong>Umrah Visa:</strong>
                            <div className="small text-muted">
                              Adults: {packageData.total_adaults} | Children: {packageData.total_children} | Infants: {packageData.total_infants}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <h4 className="mb-3">Prices Summary</h4>

                          {/* Hotel Prices */}
                          <div className="mb-3">
                            <div className="small text-muted fw-bold">Hotel:</div>
                            {packageData.hotel_details && packageData.hotel_details.length > 0 ? (
                              packageData.hotel_details.map((hotel, index) => {
                                // Use total_price directly
                                const displayPrice = hotel.total_price || hotel.price || 0;
                                return (
                                  <div key={index} className="small">
                                    {displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="small">Not included</div>
                            )}
                          </div>

                          {/* Transport Prices */}
                          <div className="mb-3">
                            <div className="small text-muted fw-bold">Transport:</div>
                            {packageData.transport_details && packageData.transport_details.length > 0 ? (
                              <div className="small">
                                {packageData.transport_details.map((transport, index) => {
                                  const displayPrice = transport.price || 0;
                                  return (
                                    <div key={index}>
                                      {displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="small">Not included</div>
                            )}
                          </div>

                          {/* Flight Prices */}
                          <div className="mb-3">
                            <div className="small text-muted fw-bold">Flight:</div>
                            {packageData.ticket_details && packageData.ticket_details.length > 0 ? (
                              <div className="small">
                                {(() => {
                                  // Enhanced Flight Price Lookup
                                  const tInfo = packageData.ticket_details[0]?.ticket_info;
                                  const adultPrice = tInfo?.adult_selling_price || tInfo?.adult_fare || tInfo?.adult_price || 0;
                                  const childPrice = tInfo?.child_selling_price || tInfo?.child_fare || tInfo?.child_price || 0;
                                  const infantPrice = tInfo?.infant_selling_price || tInfo?.infant_fare || tInfo?.infant_price || 0;

                                  const totalFlight = (adultPrice * packageData.total_adaults) + (childPrice * packageData.total_children) + (infantPrice * packageData.total_infants);
                                  return `PKR ${totalFlight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                })()}
                              </div>
                            ) : (
                              <div className="small">Not included</div>
                            )}
                          </div>

                          {/* Food Prices */}
                          <div className="mb-3">
                            <div className="small text-muted fw-bold">Food:</div>
                            {packageData.food_details && packageData.food_details.length > 0 ? (
                              packageData.food_details.map((food, index) => {
                                // Use per-passenger-type rates like the invoice
                                const adultPrice = food.food_info?.adult_selling_price || 0;
                                const childPrice = food.food_info?.child_selling_price || 0;
                                const infantPrice = food.food_info?.infant_selling_price || 0;
                                const totalFood = (adultPrice * packageData.total_adaults) + (childPrice * packageData.total_children) + (infantPrice * packageData.total_infants);
                                const displayFood = riyalRate?.is_food_pkr ? totalFood : totalFood * (riyalRate?.rate || 1);
                                return (
                                  <div key={index} className="small">
                                    PKR {(food.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="small">Not included</div>
                            )}
                          </div>

                          {/* Ziarat Prices */}
                          <div className="mb-3">
                            <div className="small text-muted fw-bold">Ziarat:</div>
                            {packageData.ziarat_details && packageData.ziarat_details.length > 0 ? (
                              packageData.ziarat_details.map((ziarat, index) => {
                                const totalPax = (packageData.total_adaults || 0) + (packageData.total_children || 0) + (packageData.total_infants || 0);
                                const adultPrice = ziarat.ziarat_info?.adult_selling_price || 0;
                                const childPrice = ziarat.ziarat_info?.child_selling_price || 0;
                                const infantPrice = ziarat.ziarat_info?.infant_selling_price || 0;
                                const totalZiarat = (adultPrice * packageData.total_adaults) + (childPrice * packageData.total_children) + (infantPrice * packageData.total_infants);
                                const displayZiarat = riyalRate?.is_ziarat_pkr ? totalZiarat : totalZiarat * (riyalRate?.rate || 1);
                                return (
                                  <div key={index} className="small">
                                    PKR {(ziarat.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="small">Not included</div>
                            )}
                          </div>

                          {/* Visa Prices */}
                          <div className="mb-3">
                            <div className="small text-muted fw-bold">Visa:</div>
                            <div className="small">
                              PKR {(packageData.visa_total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>

                          {/* Total Price */}
                          <div className="mt-3 pt-2 border-top">
                            <h5 className="fw-bold">Total Price: PKR {(packageData.total_cost || totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passengers Details */}
                  <div className="small">
                    <div className="card-body">
                      <h4 className="mb-4">Passengers Details For Umrah Package</h4>

                      {manualFamilies && manualFamilies.length > 0 ? (
                        // Display passengers grouped by family
                        manualFamilies.map((family, familyIndex) => {
                          const familyPassengers = passengers.filter(p => p.familyIndex === familyIndex);
                          return (
                            <div key={familyIndex} className="mb-4">
                              <h5 className="fw-bold mb-3 text-primary">{family.name || `Family ${familyIndex + 1}`}</h5>
                              {familyPassengers.map((passenger) => (
                                <div key={passenger.id} className="row mb-3">
                                  {/* Passenger Type with Head of Family Badge */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">
                                      Type
                                      {passenger.isHead && (
                                        <span className="badge bg-success ms-2">Head of Family</span>
                                      )}
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control bg-light shadow-none"
                                      value={passenger.type}
                                      readOnly
                                      disabled
                                    />
                                  </div>

                                  {/* Title */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Title</label>
                                    <select
                                      className={`form-select bg-light shadow-none ${formErrors[`passenger-title-${passenger.id}`] ? "is-invalid" : ""}`}
                                      value={passenger.title}
                                      onChange={(e) => handleFieldChange(passenger.id, "title", e.target.value)}
                                      required
                                    >
                                      {getTitleOptions(passenger.type)}
                                    </select>
                                    {formErrors[`passenger-title-${passenger.id}`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-title-${passenger.id}`]}</div>
                                    )}
                                  </div>

                                  {/* First Name */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">First Name</label>
                                    <input
                                      type="text"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-name-${passenger.id}`] ? "is-invalid" : ""}`}
                                      value={passenger.name}
                                      onChange={(e) => handleFieldChange(passenger.id, "name", e.target.value)}
                                      placeholder="First name"
                                      required
                                    />
                                    {formErrors[`passenger-name-${passenger.id}`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-name-${passenger.id}`]}</div>
                                    )}
                                  </div>

                                  {/* Last Name */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Last Name</label>
                                    <input
                                      type="text"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-lName-${passenger.id}`] ? "is-invalid" : ""}`}
                                      value={passenger.lName}
                                      onChange={(e) => handleFieldChange(passenger.id, "lName", e.target.value)}
                                      placeholder="Last name"
                                      required
                                    />
                                    {formErrors[`passenger-lName-${passenger.id}`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-lName-${passenger.id}`]}</div>
                                    )}
                                  </div>

                                  {/* DOB */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">DOB</label>
                                    <input
                                      type="date"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-DOB-${passenger.id}`] ? "is-invalid" : ""}`}
                                      value={passenger.DOB}
                                      onChange={(e) => handleFieldChange(passenger.id, "DOB", e.target.value)}
                                      placeholder="Date of birth"
                                      required
                                    />
                                    {formErrors[`passenger-DOB-${passenger.id}`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-DOB-${passenger.id}`]}</div>
                                    )}
                                  </div>

                                  {/* Passport Number */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Passport</label>
                                    <input
                                      type="text"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-passportNumber-${passenger.id}`] ? "is-invalid" : ""}`}
                                      value={passenger.passportNumber}
                                      onChange={(e) => handleFieldChange(passenger.id, "passportNumber", e.target.value)}
                                      placeholder="AB1234567"
                                      required
                                    />
                                    {formErrors[`passenger-passportNumber-${passenger.id}`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-passportNumber-${passenger.id}`]}</div>
                                    )}
                                  </div>

                                  {/* Passport Issue */}
                                  < div className="col-lg-2 mb-2" >
                                    <label className="control-label">Passport Issue</label>
                                    <input
                                      type="date"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-passportIssue-${passenger.id}`] ? "is-invalid" : ""}`}
                                      value={passenger.passportIssue}
                                      onChange={(e) => handleFieldChange(passenger.id, "passportIssue", e.target.value)}
                                      required
                                      max={new Date().toISOString().split('T')[0]}
                                    />
                                    {
                                      formErrors[`passenger-passportIssue-${passenger.id}`] && (
                                        <div className="invalid-feedback">{formErrors[`passenger-passportIssue-${passenger.id}`]}</div>
                                      )
                                    }
                                  </div>

                                  {/* Passport Expiry */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Passport Expiry</label>
                                    <input
                                      type="date"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-passportExpiry-${passenger.id}`] ? "is-invalid" : ""}`}
                                      value={passenger.passportExpiry}
                                      onChange={(e) => handleFieldChange(passenger.id, "passportExpiry", e.target.value)}
                                      required
                                      min={new Date().toISOString().split('T')[0]}
                                    />
                                    {formErrors[`passenger-passportExpiry-${passenger.id}`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-passportExpiry-${passenger.id}`]}</div>
                                    )}
                                  </div>

                                  {/* Country */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Country</label>
                                    <div>
                                      <RawSelect
                                        options={countries.map(c => ({ label: c, value: c }))}
                                        value={passenger.country ? { label: passenger.country, value: passenger.country } : null}
                                        onChange={(opt) => handleFieldChange(passenger.id, "country", opt ? opt.value : "")}
                                        placeholder="Select Country"
                                        isSearchable={true}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                        styles={{
                                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                          control: (base, state) => ({
                                            ...base,
                                            minHeight: 38,
                                            height: 38,
                                            borderRadius: 4,
                                            border: formErrors[`passenger-country-${passenger.id}`] ? '1px solid #dc3545' : '1px solid #ced4da'
                                          }),
                                          singleValue: (base) => ({ ...base, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })
                                        }}
                                        classNamePrefix="react-select"
                                      />
                                      {formErrors[`passenger-country-${passenger.id}`] && (
                                        <div className="invalid-feedback d-block">{formErrors[`passenger-country-${passenger.id}`]}</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Passport Upload */}
                                  <div className="col-lg-2 mb-2 mt-2 d-flex align-items-center">
                                    <input
                                      type="file"
                                      id={`passport-upload-${passenger.id}`}
                                      style={{ display: 'none' }}
                                      onChange={(e) => handlePassportUpload(passenger.id, e)}
                                      accept="image/*,.pdf"
                                      required={!passenger.passportFile}
                                    />
                                    <label
                                      htmlFor={`passport-upload-${passenger.id}`}
                                      className={`btn ${passenger.passportFile ? 'btn-success' : 'btn-primary'}`}
                                    >
                                      <CloudUpload />
                                      {passenger.passportFile ? "Uploaded" : 'Passport'}
                                    </label>
                                    {formErrors[`passenger-passportFile-${passenger.id}`] && (
                                      <div className="invalid-feedback d-block">{formErrors[`passenger-passportFile-${passenger.id}`]}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })
                      ) : (
                        // Fallback: display all passengers ungrouped
                        passengers.map((passenger) => (
                          <div key={passenger.id} className="row mb-3">
                            {/* Passenger Type */}
                            <div className="col-lg-2 mb-2">
                              <label className="control-label">Type</label>
                              <input
                                type="text"
                                className="form-control bg-light shadow-none"
                                value={passenger.type}
                                readOnly
                                disabled
                              />
                            </div>

                            {/* Title */}
                            <div className="col-lg-2 mb-2">
                              <label className="control-label">Title</label>
                              <select
                                className={`form-select bg-light shadow-none ${formErrors[`passenger-title-${passenger.id}`] ? "is-invalid" : ""}`}
                                value={passenger.title}
                                onChange={(e) => handleFieldChange(passenger.id, "title", e.target.value)}
                                required
                              >
                                {getTitleOptions(passenger.type)}
                              </select>
                              {formErrors[`passenger-title-${passenger.id}`] && (
                                <div className="invalid-feedback">{formErrors[`passenger-title-${passenger.id}`]}</div>
                              )}
                            </div>

                            {/* First Name */}
                            <div className="col-lg-2 mb-2">
                              <label className="control-label">First Name</label>
                              <input
                                type="text"
                                className={`form-control bg-light shadow-none ${formErrors[`passenger-name-${passenger.id}`] ? "is-invalid" : ""}`}
                                value={passenger.name}
                                onChange={(e) => handleFieldChange(passenger.id, "name", e.target.value)}
                                placeholder="First name"
                                required
                              />
                              {formErrors[`passenger-name-${passenger.id}`] && (
                                <div className="invalid-feedback">{formErrors[`passenger-name-${passenger.id}`]}</div>
                              )}
                            </div>

                            {/* Last Name */}
                            <div className="col-lg-2 mb-2">
                              <label className="control-label">Last Name</label>
                              <input
                                type="text"
                                className={`form-control bg-light shadow-none ${formErrors[`passenger-lName-${passenger.id}`] ? "is-invalid" : ""}`}
                                value={passenger.lName}
                                onChange={(e) => handleFieldChange(passenger.id, "lName", e.target.value)}
                                placeholder="Last name"
                                required
                              />
                              {formErrors[`passenger-lName-${passenger.id}`] && (
                                <div className="invalid-feedback">{formErrors[`passenger-lName-${passenger.id}`]}</div>
                              )}
                            </div>

                            {/* Last Name */}
                            <div className="col-lg-2 mb-2">
                              <label className="control-label">DOB</label>
                              <input
                                type="date"
                                className={`form-control bg-light shadow-none ${formErrors[`passenger-DOB-${passenger.id}`] ? "is-invalid" : ""}`}
                                value={passenger.DOB}
                                onChange={(e) => handleFieldChange(passenger.id, "DOB", e.target.value)}
                                placeholder="Last name"
                                required
                              />
                              {formErrors[`passenger-lName-${passenger.id}`] && (
                                <div className="invalid-feedback">{formErrors[`passenger-DOB-${passenger.id}`]}</div>
                              )}
                            </div>

                            {/* Passport Number */}
                            <div className="col-lg-2 mb-2">
                              <label className="control-label">Passport</label>
                              <input
                                type="text"
                                className={`form-control bg-light shadow-none ${formErrors[`passenger-passportNumber-${passenger.id}`] ? "is-invalid" : ""}`}
                                value={passenger.passportNumber}
                                onChange={(e) => handleFieldChange(passenger.id, "passportNumber", e.target.value)}
                                placeholder="AB1234567"
                                required
                              />
                              {formErrors[`passenger-passportNumber-${passenger.id}`] && (
                                <div className="invalid-feedback">{formErrors[`passenger-passportNumber-${passenger.id}`]}</div>
                              )}
                            </div>


                            {/* Passport Issue */}
                            < div className="col-lg-2 mb-2" >
                              <label className="control-label">Passport Issue</label>
                              <input
                                type="date"
                                className={`form-control bg-light shadow-none ${formErrors[`passenger-passportIssue-${passenger.id}`] ? "is-invalid" : ""}`}
                                value={passenger.passportIssue}
                                onChange={(e) => handleFieldChange(passenger.id, "passportIssue", e.target.value)}
                                required
                                max={new Date().toISOString().split('T')[0]}
                              />
                              {
                                formErrors[`passenger-passportIssue-${passenger.id}`] && (
                                  <div className="invalid-feedback">{formErrors[`passenger-passportIssue-${passenger.id}`]}</div>
                                )
                              }
                            </div>

                            {/* Passport Expiry */}
                            <div className="col-lg-2 mb-2">
                              <label className="control-label">Passport Expiry</label>
                              <input
                                type="date"
                                className={`form-control bg-light shadow-none ${formErrors[`passenger-passportExpiry-${passenger.id}`] ? "is-invalid" : ""}`}
                                value={passenger.passportExpiry}
                                onChange={(e) => handleFieldChange(passenger.id, "passportExpiry", e.target.value)}
                                required
                                min={new Date().toISOString().split('T')[0]}
                              />
                              {formErrors[`passenger-passportExpiry-${passenger.id}`] && (
                                <div className="invalid-feedback">{formErrors[`passenger-passportExpiry-${passenger.id}`]}</div>
                              )}
                            </div>

                            {/* Country */}
                            <div className="col-lg-2 mb-2">
                              <label className="control-label">Country</label>
                              <select
                                className={`form-select bg-light shadow-none ${formErrors[`passenger-country-${passenger.id}`] ? "is-invalid" : ""}`}
                                value={passenger.country}
                                onChange={(e) => handleFieldChange(passenger.id, "country", e.target.value)}
                                required
                              >
                                <option value="">Select Country</option>
                                {countries.map(country => (
                                  <option key={country} value={country}>{country}</option>
                                ))}
                              </select>
                              {formErrors[`passenger-country-${passenger.id}`] && (
                                <div className="invalid-feedback">{formErrors[`passenger-country-${passenger.id}`]}</div>
                              )}
                            </div>

                            {/* Passport Upload */}
                            <div className="col-lg-2 mb-2 mt-2 d-flex align-items-center">
                              <input
                                type="file"
                                id={`passport-upload-${passenger.id}`}
                                style={{ display: 'none' }}
                                onChange={(e) => handlePassportUpload(passenger.id, e)}
                                accept="image/*,.pdf"
                                required={!passenger.passportFile}
                              />
                              <label
                                htmlFor={`passport-upload-${passenger.id}`}
                                className={`btn ${passenger.passportFile ? 'btn-success' : 'btn-primary'}`}
                              >
                                <CloudUpload />
                                {passenger.passportFile ? "Uploaded" : 'Passport'}
                              </label>
                              {formErrors[`passenger-passportFile-${passenger.id}`] && (
                                <div className="invalid-feedback d-block">{formErrors[`passenger-passportFile-${passenger.id}`]}</div>
                              )}
                            </div>
                          </div>
                        ))
                      )}

                      {/* <div className="row mt-4">
                      <div className="col-12">
                        <button
                          className="btn btn-primary me-3"
                          onClick={addPassenger}
                        >
                          Add Passenger
                        </button>
                      </div>
                    </div> */}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12 text-end">
                      <Link
                        to="/packages/umrah-calculater"
                        className="btn btn-secondary me-2"
                      >
                        Close
                      </Link>
                      <button
                        className="btn "
                        id="btn"
                        onClick={handleContinueBooking}
                      >
                        Continue Booking
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div >
      </div >
    </div >
  );
};

export default CustomUmrahPackagesDetail;