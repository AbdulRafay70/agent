import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CloudUpload, PersonDash } from "react-bootstrap-icons";
import { Plus, Upload } from "lucide-react";
import RawSelect from 'react-select';
import { toast } from 'react-toastify';
import * as jwtDecode from 'jwt-decode';

const AgentPackagesDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    package: pkg,
    roomType,
    totalPrice: initialTotalPrice,
    passengers: initialPassengers = [],
    roomTypes: initialRoomTypes = [],
    childPrices: initialChildPrices = 0,
    infantPrices: initialInfantPrices = 0
  } = location.state || {};

  // Initialize state with values from location.state if available
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes.length ? initialRoomTypes : (roomType ? [roomType] : []));
  const [passengers, setPassengers] = useState(initialPassengers);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(pkg?.total_seats || 0);
  const [totalPrice, setTotalPrice] = useState(initialTotalPrice || 0);
  const [childPrices, setChildPrices] = useState(initialChildPrices || 0);
  const [infantPrices, setInfantPrices] = useState(initialInfantPrices || 0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [familyHeads, setFamilyHeads] = useState([]);
  const [showInfantModal, setShowInfantModal] = useState(false);
  const [selectedFamilyHead, setSelectedFamilyHead] = useState("");
  const [selectedRooms, setSelectedRooms] = useState({});
  const [agencyType, setAgencyType] = useState(null);

  // Room type definitions (passengers per room)
  const bedsPerRoomType = {
    sharing: 1,
    double: 2,
    triple: 3,
    quad: 4,
    quint: 5,
  };

  // Fetch agency type on component mount
  useEffect(() => {
    const fetchAgencyType = async () => {
      try {
        const agentOrg = localStorage.getItem('agentOrganization');
        if (!agentOrg) return;

        const orgData = JSON.parse(agentOrg);
        const agencyId = orgData.agency_id;

        if (!agencyId) return;

        const token = localStorage.getItem('agentAccessToken');
        const orgId = orgData.ids[0];

        const response = await fetch(`http://127.0.0.1:8000/api/agencies/${agencyId}/?organization=${orgId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const agencyData = await response.json();
          setAgencyType(agencyData.agency_type);
          console.log('✅ Fetched agency type:', agencyData.agency_type);
        }
      } catch (error) {
        console.error('Error fetching agency type:', error);
      }
    };

    fetchAgencyType();
  }, []);

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
  ];

  // Format sector reference to readable route
  const formatSectorReference = (reference) => {
    if (!reference) return '';
    const referenceMap = {
      'full_package': 'R/T - Jed(A)-Mak(H)-Med(H)-Mak(H)-Jed(A)',
      'jeddah_makkah': 'Jed(A)-Mak(H)',
      'makkah_madinah': 'Mak(H)-Med(H)',
      'madinah_makkah': 'Med(H)-Mak(H)',
      'makkah_jeddah': 'Mak(H)-Jed(A)',
      'jeddah_madinah': 'Jed(A)-Med(H)',
      'madinah_jeddah': 'Med(H)-Jed(A)',
    };
    return referenceMap[reference] || reference.replace(/_/g, '-').toUpperCase();
  };

  const calculateChildPrice = () => {
    if (!pkg) return 0;
    return (pkg.adault_visa_price || 0) - (pkg.child_visa_price || 0);
  };

  const calculateInfantPrice = () => {
    if (!pkg) return 0;
    return (pkg.infant_visa_price || 0) + (pkg.ticket_details?.[0]?.ticket_info?.infant_price || 0);
  };

  const getPriceForPassenger = (passenger) => {
    if (passenger.type === "Child") {
      return getPriceForRoomType(passenger.roomType) - calculateChildPrice();
    } else if (passenger.type === "Infant") {
      return calculateInfantPrice();
    }
    return getPriceForRoomType(passenger.roomType);
  };

  const updatePassenger = (id, field, value) => {
    const passengerIndex = passengers.findIndex(p => p.id === id);
    const passenger = passengers[passengerIndex];
    const oldType = passenger.type;
    const oldPrice = getPriceForPassenger(passenger);

    const updatedPassengers = passengers.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );

    setPassengers(updatedPassengers);

    // Clear error for this field when user starts typing/selecting
    const errorKey = `passenger-${id}-${field}`;
    if (formErrors[errorKey]) {
      const newErrors = { ...formErrors };
      delete newErrors[errorKey];
      setFormErrors(newErrors);
    }

    // Update prices if passenger type changed
    if (field === "type" && value !== oldType) {
      const newPrice = getPriceForPassenger({ ...passenger, type: value });
      const priceDifference = newPrice - oldPrice;

      setTotalPrice(prev => prev + priceDifference);

      if (value === "Child") {
        setChildPrices(prev => prev + calculateChildPrice());
      } else if (oldType === "Child") {
        setChildPrices(prev => prev - calculateChildPrice());
      }

      if (value === "Infant") {
        setInfantPrices(prev => prev + calculateInfantPrice());
      } else if (oldType === "Infant") {
        setInfantPrices(prev => prev - calculateInfantPrice());
      }
    }
  };

  // Initialize passengers and prices based on room types on first load
  useEffect(() => {
    // Check for saved draft from Book Now before redirecting
    const savedDraft = sessionStorage.getItem('umrah_booknow_v1');
    if (!pkg && !savedDraft) {
      navigate('/packages');
      return;
    }

    if (!isInitialized && passengers.length === 0) {
      const maxSeats = pkg?.total_seats || 0;
      let remainingSeats = maxSeats;
      const newPassengers = [];
      let priceTotal = 0;

      roomTypes.forEach(type => {
        const count = getPassengerCountForRoomType(type);

        if (remainingSeats >= count) {
          const roomPrice = getPriceForRoomType(type);
          priceTotal += roomPrice * count;

          const groupId = `${type}-${Math.random().toString(36).substr(2, 9)}`;

          for (let i = 0; i < count; i++) {
            newPassengers.push({
              id: `${groupId}-${i}`,
              type: "Adult",
              title: "",
              name: "",
              lName: "",
              passportNumber: "",
              passportIssue: "",
              passportExpiry: "",
              dob: "",
              country: "",
              passportFile: null,
              roomType: type,
              groupId: groupId,
              isFamilyHead: i === 0
            });
            remainingSeats--;
          }
        }
      });

      setPassengers(newPassengers);
      setTotalPrice(priceTotal);
      setAvailableSeats(remainingSeats);
      setIsInitialized(true);
    }
  }, [pkg, navigate, roomTypes, isInitialized, passengers.length]);

  // Recalculate total price whenever passengers change OR agency type is fetched
  useEffect(() => {
    if (passengers.length > 0 && agencyType !== null) {
      const calculatedTotal = passengers.reduce((sum, passenger) => {
        return sum + getPriceForPassenger(passenger);
      }, 0);
      setTotalPrice(calculatedTotal);
      console.log('💰 Recalculated total price:', calculatedTotal, 'for agency type:', agencyType);
    }
  }, [passengers, agencyType]);

  // Update family heads whenever passengers change
  useEffect(() => {
    const heads = passengers.filter(p => p.isFamilyHead);
    setFamilyHeads(heads);
  }, [passengers]);

  // Save to localStorage when data changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      const bookingData = {
        roomTypes,
        passengers,
        totalPrice,
        package: pkg
      };
      localStorage.setItem('umrahBookingData', JSON.stringify(bookingData));
    }
  }, [roomTypes, passengers, totalPrice, pkg, isInitialized]);

  // Cleanup localStorage when leaving the booking flow
  useEffect(() => {
    const currentPath = location.pathname;

    return () => {
      const newPath = window.location.pathname;
      if (!newPath.startsWith("/packages")) {
        localStorage.removeItem("umrahBookingData");
      }
    };
  }, [location.pathname]);

  const getPassengerCountForRoomType = (type) => {
    switch (type.toUpperCase()) {
      case 'SHARING': return 1;
      case 'DOUBLE': return 2;
      case 'TRIPLE': return 3;
      case 'QUAD': return 4;
      case 'QUINT': return 5;
      default: return 1;
    }
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

  const getPriceForRoomType = (type) => {
    if (!pkg) return 0;

    const visaPrice = pkg.adault_visa_selling_price || 0;
    const transportPrice = pkg.transport_selling_price || 0;

    // Try multiple paths for flight price
    const ticketInfo = pkg.ticket_details?.[0]?.ticket_info;
    const flightPrice = ticketInfo?.adult_selling_price || ticketInfo?.adult_price || 0;

    const foodPrice = pkg.food_selling_price || 0;
    const makkahZiyaratPrice = pkg.makkah_ziyarat_selling_price || 0;
    const madinahZiyaratPrice = pkg.madinah_ziyarat_selling_price || 0;

    const basePrice = visaPrice + transportPrice + flightPrice + foodPrice + makkahZiyaratPrice + madinahZiyaratPrice;

    console.log('💰 Price Calculation for', type);
    console.log('  - Visa:', visaPrice);
    console.log('  - Transport:', transportPrice);
    console.log('  - Flight (adult_selling_price):', ticketInfo?.adult_selling_price);
    console.log('  - Flight (adult_price):', ticketInfo?.adult_price);
    console.log('  - Flight (final):', flightPrice);
    console.log('  - Food:', foodPrice);
    console.log('  - Makkah Ziyarat:', makkahZiyaratPrice);
    console.log('  - Madinah Ziyarat:', madinahZiyaratPrice);
    console.log('  - Base Price:', basePrice);

    const hotelPrice = pkg.hotel_details?.reduce((sum, hotel) => {
      let pricePerNight = 0;
      switch (type.toUpperCase()) {
        case 'SHARING': pricePerNight = hotel.sharing_bed_selling_price || 0; break;
        case 'DOUBLE': pricePerNight = hotel.double_bed_selling_price || 0; break;
        case 'TRIPLE': pricePerNight = hotel.triple_bed_selling_price || 0; break;
        case 'QUAD': pricePerNight = hotel.quad_bed_selling_price || 0; break;
        case 'QUINT': pricePerNight = hotel.quaint_bed_selling_price || 0; break;
        default: pricePerNight = 0;
      }
      const hotelTotal = pricePerNight * (hotel.number_of_nights || 0);
      console.log(`  - Hotel ${hotel.hotel_name}: ${pricePerNight} × ${hotel.number_of_nights} nights = ${hotelTotal}`);
      return sum + hotelTotal;
    }, 0) || 0;


    console.log('  - Total Hotel Price:', hotelPrice);

    // Add 500 PKR service charge for packages (applied only to Area Agency)
    const serviceCharge = (agencyType === 'Full Agency') ? 0 : 500;

    console.log('  - Agency Type:', agencyType);
    console.log('  - Service Charge:', serviceCharge);
    console.log('  - FINAL TOTAL:', basePrice + hotelPrice + serviceCharge);

    return basePrice + hotelPrice + serviceCharge;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFlightDetails = () => {
    if (!pkg?.ticket_details?.[0]?.ticket_info) return {};

    const ticket = pkg.ticket_details[0].ticket_info;
    const tripDetails = ticket.trip_details || [];

    console.log('🔍 DEBUG Flight Data:');
    console.log('  - Full ticket object:', ticket);
    console.log('  - ticket.airline:', ticket.airline);
    console.log('  - tripDetails:', tripDetails);
    console.log('  - pkg.ticket_details[0]:', pkg.ticket_details[0]);

    // Airline name to IATA code mapping
    const airlineNameToCode = {
      'Pakistan International Airlines': 'PIA',
      'PIA': 'PIA',
      'Saudi Arabian Airlines': 'SV',
      'Saudia': 'SV',
      'Emirates': 'EK',
      'Etihad Airways': 'EY',
      'Qatar Airways': 'QR',
      'Air Arabia': 'G9',
      'Fly Dubai': 'FZ',
      'Serene Air': 'ER',
      'AirBlue': 'PA',
    };

    // Try to get airline code from various sources
    let airlineCode = 'XX'; // Default fallback

    // 1. Try from ticket.airline object
    if (ticket.airline?.code) {
      airlineCode = ticket.airline.code;
    }
    // 2. Try from ticket.airline.name mapping
    else if (ticket.airline?.name && airlineNameToCode[ticket.airline.name]) {
      airlineCode = airlineNameToCode[ticket.airline.name];
    }
    // 3. Try to extract from main flight_number (e.g., "PIA-123" -> "PIA")
    else if (ticket.flight_number) {
      const flightNum = ticket.flight_number.toString().toUpperCase();
      const match = flightNum.match(/^([A-Z]{2,3})/);
      if (match) {
        airlineCode = match[1];
      }
    }
    // 4. Try to extract from trip details flight number
    else if (tripDetails[0]?.flight_number) {
      const flightNum = tripDetails[0].flight_number.toString().toUpperCase();
      const match = flightNum.match(/^([A-Z]{2,3})/);
      if (match) {
        airlineCode = match[1];
      }
    }

    console.log('  - Final airline code:', airlineCode);

    return {
      departure: tripDetails[0] || {},
      return: tripDetails[1] || {},
      airline: { code: airlineCode }
    };
  };

  const flightDetails = getFlightDetails();

  const flightMinAdultAge = pkg?.flight_min_adult_age || 0;
  const flightMaxAdultAge = pkg?.flight_max_adult_age || 0;
  const maxInfantAllowed = pkg?.max_infant_allowed || 0;

  // const addRoomType = (type) => {
  //   const count = getPassengerCountForRoomType(type);
  //   if (availableSeats < count) {
  //     alert(`Only ${availableSeats} seat(s) left - not enough for ${type} room`);
  //     return;
  //   }

  //   const roomPrice = getPriceForRoomType(type);
  //   const groupId = `${type}-${Math.random().toString(36).substr(2, 9)}`;
  //   const newPassengers = [...passengers];

  // Orphaned loop removed: the `addRoomType` implementation was commented out
  // and this loop referenced `count` which is undefined here. If you
  // re-enable `addRoomType`, reintroduce the loop inside that function.

  //   setPassengers(newPassengers);
  //   setRoomTypes([...roomTypes, type]);
  //   setTotalPrice(totalPrice + (roomPrice * count));
  //   setAvailableSeats(availableSeats - count);
  //   setShowRoomModal(false);
  // };

  // const removePassengerGroup = (groupId) => {
  //   const groupPassengers = passengers.filter(p => p.groupId === groupId);
  //   const removedRoomType = groupPassengers[0]?.roomType;

  //   let priceReduction = 0;
  //   let seatsFreed = 0;

  //   groupPassengers.forEach(passenger => {
  //     if (passenger.type === "Infant") {
  //       priceReduction += calculateInfantPrice();
  //     } else {
  //       priceReduction += getPriceForRoomType(removedRoomType);
  //     }
  //     seatsFreed++;
  //   });

  //   const updatedPassengers = passengers.filter(p => p.groupId !== groupId);
  //   const updatedRoomTypes = roomTypes.filter(rt => rt !== removedRoomType);
  //   const newTotalPrice = totalPrice - priceReduction;

  //   setPassengers(updatedPassengers);
  //   setRoomTypes(updatedRoomTypes);
  //   setTotalPrice(newTotalPrice);
  //   setAvailableSeats(availableSeats + seatsFreed);
  // };

  const handleAddInfant = () => {
    if (!canAddInfant()) {
      alert(`You can only add ${maxInfantAllowed || 10} infant(s) with at least 1 adult`);
      return;
    }

    // Get unique room groups
    const roomGroups = {};
    passengers.forEach(p => {
      if (p.groupId && p.roomType) {
        const key = `${p.roomType}_${p.groupId}`;
        if (!roomGroups[key]) {
          roomGroups[key] = { roomType: p.roomType, groupId: p.groupId };
        }
      }
    });

    const rooms = Object.values(roomGroups);

    if (rooms.length === 0) {
      alert("No rooms available. Please add a room first.");
      return;
    } else if (rooms.length === 1) {
      // Auto-add infant to the only room
      const room = rooms[0];
      const familyHead = passengers.find(p => p.groupId === room.groupId && p.isFamilyHead);

      if (familyHead) {
        const newPassenger = {
          id: `infant-${Math.random().toString(36).substr(2, 9)}`,
          type: "Infant",
          title: "",
          name: "",
          lName: "",
          passportNumber: "",
          passportIssue: "",
          passportExpiry: "",
          dob: "",
          country: "",
          passportFile: null,
          roomType: familyHead.roomType,
          groupId: familyHead.groupId,
          isFamilyHead: false
        };

        setPassengers([...passengers, newPassenger]);
        setTotalPrice(totalPrice + calculateInfantPrice());
        setAvailableSeats(availableSeats - 1);
      }
    } else {
      // Multiple rooms - show modal to select
      setShowInfantModal(true);
    }
  };

  const confirmAddInfant = () => {
    if (!selectedFamilyHead) {
      alert("Please select a family head for the infant");
      return;
    }

    const familyHead = passengers.find(p => p.id === selectedFamilyHead);
    if (!familyHead) return;

    const newPassenger = {
      id: `infant-${Math.random().toString(36).substr(2, 9)}`,
      type: "Infant",
      title: "",
      name: "",
      lName: "",
      passportNumber: "",
      passportIssue: "",
      passportExpiry: "",
      dob: "",
      country: "",
      passportFile: null,
      roomType: familyHead.roomType,
      groupId: familyHead.groupId,
      isFamilyHead: false
    };

    setPassengers([...passengers, newPassenger]);
    setTotalPrice(totalPrice + calculateInfantPrice());
    setAvailableSeats(availableSeats - 1);
    setShowInfantModal(false);
    setSelectedFamilyHead("");
  };

  const canAddInfant = () => {
    const totalAdultsChildren = passengers.filter(p =>
      p.type === "Adult" || p.type === "Child"
    ).length;
    const totalInfants = passengers.filter(p => p.type === "Infant").length;

    // Simplified validation: just check if we have adults and haven't exceeded infant limit
    const hasAdults = totalAdultsChildren > 0;
    const infantLimit = maxInfantAllowed > 0 ? maxInfantAllowed : 10; // Default to 10 if not set
    const belowInfantLimit = totalInfants < infantLimit;

    return hasAdults && belowInfantLimit;
  };

  const removeInfant = (passengerId) => {
    const infant = passengers.find(p => p.id === passengerId);
    if (!infant || infant.type !== "Infant") return;

    const updatedPassengers = passengers.filter(p => p.id !== passengerId);
    setPassengers(updatedPassengers);
    setTotalPrice(totalPrice - calculateInfantPrice());
    setInfantPrices(infantPrices - calculateInfantPrice());
    setAvailableSeats(availableSeats + 1);
  };

  // Handle room selection changes in modal
  const handleRoomChange = (roomType, increment) => {
    setSelectedRooms(prevRooms => {
      const currentCount = prevRooms[roomType] || 0;
      const newCount = currentCount + increment;
      if (newCount < 0) return prevRooms;
      if (newCount === 0) {
        const { [roomType]: _, ...rest } = prevRooms;
        return rest;
      }
      return { ...prevRooms, [roomType]: newCount };
    });
  };

  // Handle adding selected rooms
  const handleAddRooms = () => {
    const totalNewPassengers = Object.entries(selectedRooms).reduce((sum, [type, count]) => {
      return sum + (bedsPerRoomType[type] || 0) * count;
    }, 0);

    if (totalNewPassengers === 0) {
      alert("Please select at least one room.");
      return;
    }

    if (totalNewPassengers > availableSeats) {
      alert(`Only ${availableSeats} seats available. You selected ${totalNewPassengers} passengers.`);
      return;
    }

    // Add passengers for each selected room
    const newPassengers = [...passengers];
    let priceIncrease = 0;

    Object.entries(selectedRooms).forEach(([roomType, count]) => {
      const paxPerRoom = bedsPerRoomType[roomType] || 0;
      const roomPrice = getPriceForRoomType(roomType);

      for (let r = 0; r < count; r++) {
        const groupId = `${roomType}-${Math.random().toString(36).substr(2, 9)}`;

        for (let i = 0; i < paxPerRoom; i++) {
          newPassengers.push({
            id: `${groupId}-${i}`,
            type: "Adult",
            title: "",
            name: "",
            lName: "",
            passportNumber: "",
            passportIssue: "",
            passportExpiry: "",
            dob: "",
            country: "",
            passportFile: null,
            roomType: roomType,
            groupId: groupId,
            isFamilyHead: i === 0
          });
        }

        priceIncrease += roomPrice * paxPerRoom;
      }
    });

    setPassengers(newPassengers);
    setTotalPrice(totalPrice + priceIncrease);
    setAvailableSeats(availableSeats - totalNewPassengers);
    setSelectedRooms({});
    setShowRoomModal(false);
  };


  const validateForm = () => {
    const errors = {};
    let isValid = true;

    passengers.forEach((passenger) => {
      const requiredFields = [
        'type', 'title', 'name', 'lName',
        'passportNumber', 'passportIssue'
        , 'passportExpiry', 'country'
      ];

      requiredFields.forEach(field => {
        const fieldKey = `passenger-${passenger.id}-${field}`;
        if (!passenger[field] || passenger[field].toString().trim() === '') {
          errors[fieldKey] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
          isValid = false;
        }
      });

      // Check for passport file
      if (!passenger.passportFile) {
        errors[`passenger-${passenger.id}-passportFile`] = "Passport file is required";
        isValid = false;
      }

      if (passenger.passportExpiry && passenger.passportIssue) {
        const expiryDate = new Date(passenger.passportExpiry);
        const issueDate = new Date(passenger.passportIssue);
        if (expiryDate <= issueDate) {
          errors[`passenger-${passenger.id}-passportExpiry`] = "Passport expiry must be after issue date";
          isValid = false;
        }
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

    console.log('Validation errors:', errors);
    setFormErrors(errors);
    return isValid;
  };

  // Convert File to base64 string
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleNavigation = (path, options = {}) => {
    navigate(path, {
      ...options,
      state: {
        package: pkg,
        passengers,
        roomTypes,
        totalPrice
      }
    });
  };

  const handleContinue = async () => {
    console.log('Validating form...');
    if (validateForm()) {
      console.log('Validation passed');
      try {
        // Convert passport files to base64 and prepare passenger payload
        const passengersWithBase64 = await Promise.all(passengers.map(async (p) => {
          if (p.passportFile && typeof p.passportFile !== 'string') {
            try {
              const base64 = await fileToBase64(p.passportFile);
              return { ...p, passportFile: base64 };
            } catch (err) {
              console.error('Failed to convert passport file to base64 for', p.id, err);
              return { ...p, passportFile: null };
            }
          }
          return p;
        }));

        // compute expiry from token
        const token = localStorage.getItem('agentAccessToken') || localStorage.getItem('token');
        let expiresAt = Date.now() + 60 * 60 * 1000;
        try {
          if (token) {
            const decodeFn = (jwtDecode && jwtDecode.default) ? jwtDecode.default : jwtDecode;
            const decoded = decodeFn(token);
            if (decoded && decoded.exp) expiresAt = decoded.exp * 1000;
          }
        } catch (e) { /* ignore */ }

        // Save package selection to sessionStorage
        console.log('💾 Saving to sessionStorage:', {
          totalPrice,
          childPrices,
          infantPrices,
          roomTypes,
          passengersCount: passengersWithBase64.length
        });

        const bookPayload = {
          __version: 1,
          __expiresAt: expiresAt,
          value: {
            package: pkg,
            roomTypes,
            totalPrice,
            childPrices,
            infantPrices
          }
        };
        sessionStorage.setItem('agent_package_book_v1', JSON.stringify(bookPayload));

        // Save passengers to sessionStorage
        const passengerPayload = {
          __version: 1,
          __expiresAt: expiresAt,
          value: {
            passengers: passengersWithBase64
          }
        };
        sessionStorage.setItem('agent_package_passengers_v1', JSON.stringify(passengerPayload));

        // Navigate to review page (Review will read session data)
        navigate('/packages/review');
      } catch (err) {
        console.error('Error during continue booking:', err);
        toast.error('Failed to prepare booking. Please try again.');
      }
    } else {
      // console.log('Validation failed, errors:', formErrors);
      // Scroll to first error
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.is-invalid');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };


  // const [cities, setCities] = useState([]);

  // const getCityCode = (cityId) => {
  //   const city = cities.find(c => c.id === cityId);
  //   return city.code;
  // };

  // const token = localStorage.getItem("agentAccessToken");
  // const getOrgId = () => {
  //   const agentOrg = localStorage.getItem("agentOrganization");
  //   if (!agentOrg) return null;
  //   const orgData = JSON.parse(agentOrg);
  //   return orgData.ids[0];
  // };
  // const orgId = getOrgId();

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       // Always fetch cities data
  //       const citiesResponse = await axios.get(
  //         `http://127.0.0.1:8000/api/cities/?organization=${orgId}`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       setCities(citiesResponse.data);
  //     } catch (error) {
  //       console.error("Error fetching cities:", error);
  //     }
  //   };

  //   fetchData();
  // }, [orgId, token]);

  // Add familyNumber state
  const [familyCounter, setFamilyCounter] = useState(1);

  // Modify addRoomType function
  const addRoomType = (type) => {
    const count = getPassengerCountForRoomType(type);
    if (availableSeats < count) {
      alert(`Only ${availableSeats} seat(s) left - not enough for ${type} room`);
      return;
    }

    const roomPrice = getPriceForRoomType(type);
    const groupId = `${type}-${Math.random().toString(36).substr(2, 9)}`;
    const familyNumber = familyCounter; // Assign current family number
    const newPassengers = [...passengers];

    for (let i = 0; i < count; i++) {
      newPassengers.push({
        id: `${groupId}-${i}`,
        type: i === 0 ? "" : "",
        title: i === 0 ? "" : "",
        name: "",
        lName: "",
        passportNumber: "",
        passportIssue: "",
        passportExpiry: "",
        country: "",
        passportFile: null,
        roomType: type,
        groupId: groupId,
        isFamilyHead: i === 0,
        familyNumber: familyNumber
      });
    }

    setPassengers(newPassengers);
    setRoomTypes([...roomTypes, type]);
    setTotalPrice(totalPrice + (roomPrice * count));
    setAvailableSeats(availableSeats - count);
    setFamilyCounter(familyCounter + 1); // Increment for next family
    setShowRoomModal(false);
  };

  // Modify removePassengerGroup function
  const removePassengerGroup = (groupId) => {
    const groupPassengers = passengers.filter(p => p.groupId === groupId);
    const removedRoomType = groupPassengers[0]?.roomType;
    const removedFamilyNumber = groupPassengers[0]?.familyNumber;

    let priceReduction = 0;
    let seatsFreed = 0;

    groupPassengers.forEach(passenger => {
      if (passenger.type === "Infant") {
        priceReduction += calculateInfantPrice();
      } else {
        priceReduction += getPriceForRoomType(removedRoomType);
      }
      seatsFreed++;
    });

    const updatedPassengers = passengers.filter(p => p.groupId !== groupId);
    const updatedRoomTypes = roomTypes.filter(rt => rt !== removedRoomType);
    const newTotalPrice = totalPrice - priceReduction;

    setPassengers(updatedPassengers);
    setRoomTypes(updatedRoomTypes);
    setTotalPrice(newTotalPrice);
    setAvailableSeats(availableSeats + seatsFreed);

    // Note: We don't decrement familyCounter as numbers should remain unique
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
            <div className="px-3 mt-3 px-lg-4">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center flex-wrap">
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
                    <div
                      className="flex-grow-1 bg-primary"
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>
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
                      <span className="ms-2 text-muted">Booking Review</span>
                    </div>
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>
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
              <div className="row my-5">
                <div className="col-12">
                  <h5 className="mb-4 fw-bold">Booking Detail</h5>

                  {/* Package Details Card */}
                  <div className="card mb-4">
                    <div className="card-body" style={{ background: "#F2F9FF" }}>
                      <div className="row">
                        <div className="col-md-8">
                          <h4 className="mb-3 fw-bold">{pkg?.title || "Umrah Package"}</h4>
                          <div className="mb-2">
                            <strong>Hotels:</strong>
                            <div className="small text-muted">
                              {pkg?.hotel_details?.map((hotel, i) => (
                                `${hotel.number_of_nights} Nights at ${hotel.hotel_info?.city} (${hotel.hotel_info?.name})`
                              )).join(" / ") || "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Selected Room Types:</strong>
                            <div className="small text-muted">
                              {roomTypes.join(", ") || "None selected"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Transport:</strong>
                            <div className="small text-muted">
                              {pkg?.transport_details?.[0]?.transport_sector_info?.reference
                                ? formatSectorReference(pkg.transport_details[0].transport_sector_info.reference)
                                : pkg?.transport_details?.[0]?.transport_sector_info?.name || "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Food:</strong>
                            <div className="small text-muted">
                              {(pkg?.food_selling_price || 0) > 0 ? "INCLUDED" : "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Ziyarat:</strong>
                            <div className="small text-muted">
                              {((pkg?.makkah_ziyarat_selling_price || 0) > 0 || (pkg?.madinah_ziyarat_selling_price || 0) > 0) ? "YES" : "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Flight:</strong>
                            <div className="small text-muted">
                              Travel Date: {flightDetails.departure?.departure_date_time ?
                                `${flightDetails.airline?.code}${flightDetails.departure.flight_number ? `-${flightDetails.departure.flight_number}` : ''} - ${formatDateTime(flightDetails.departure.departure_date_time)} to ${formatDateTime(flightDetails.departure.arrival_date_time)}` :
                                "N/A"}
                            </div>
                            <div className="small text-muted">
                              Return Date: {flightDetails.return?.departure_date_time ?
                                `${flightDetails.airline?.code}${flightDetails.return.flight_number ? `-${flightDetails.return.flight_number}` : ''} - ${formatDateTime(flightDetails.return.departure_date_time)} to ${formatDateTime(flightDetails.return.arrival_date_time)}` :
                                "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <h4 className="mb-3 fw-bold">Price Calculation</h4>

                          {/* Room Type Prices */}
                          <div className="mb-3">
                            {roomTypes.map((type) => {
                              const count = passengers.filter(p => p.roomType === type).length;
                              const price = getPriceForRoomType(type);
                              return (
                                <div key={type} className="mb-2 small">
                                  <span className="fw-bold">{type} Room:</span>
                                  <span> Rs. {price.toLocaleString()} × {count} = </span>
                                  <span className="text-primary">Rs. {(price * count).toLocaleString()}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Child Discounts (if any) */}
                          {childPrices > 0 && (
                            <div className="text-success small">
                              Child Discounts Applied: Rs. {childPrices.toLocaleString()}
                            </div>
                          )}

                          {/* Infant Charges (if any) */}
                          {infantPrices > 0 && (
                            <div className="text-info small">
                              Infant Charges: Rs. {infantPrices.toLocaleString()}
                            </div>
                          )}

                          {/* Grand Total */}
                          <div className="border-top pt-2 mt-2 fw-bold">
                            Grand Total: Rs. {totalPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passengers Details */}
                  <div className="small">
                    <div className="d-flex justify-content-between flex-wrap small align-items-center mb-4">
                      <h4 className="fw-bold">
                        Passengers Details For Umrah Package
                      </h4>
                      <div className="d-flex align-items-center ">
                        <button
                          id="btn" className="btn me-2"
                          onClick={handleAddInfant}
                          disabled={!canAddInfant()}
                        >
                          <Plus size={16} /> Infant
                        </button>
                        <button
                          id="btn" className="btn"
                          onClick={() => setShowRoomModal(true)}
                          disabled={availableSeats <= 0}
                        >
                          Add Room
                        </button>
                      </div>
                    </div>

                    {formErrors.general && (
                      <div className="alert alert-danger">{formErrors.general}</div>
                    )}

                    {passengers.length === 0 ? (
                      <div className="alert alert-info">
                        No passengers added yet. Please select a room type.
                      </div>
                    ) : (
                      Object.values(
                        passengers.reduce((groups, passenger) => {
                          if (!groups[passenger.groupId]) {
                            groups[passenger.groupId] = {
                              roomType: passenger.roomType,
                              passengers: []
                            };
                          }
                          groups[passenger.groupId].passengers.push(passenger);
                          return groups;
                        }, {})
                      ).map((group, groupIndex) => {
                        const groupAdults = group.passengers.filter(p => p.type === "Adult");
                        return (
                          <div key={groupIndex} className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h5 className="fw-bold text-primary">
                                {group.roomType} Room
                                {/* {groupIndex + 1} */}
                              </h5>
                              <div className="d-flex gap-3">
                                <div className="mb-2">
                                  <label className="control-label">Family Head</label>
                                  <input
                                    type="text"
                                    className="form-control bg-light shadow-none"
                                    value={(() => {
                                      const familyHead = group.passengers.find(p => p.isFamilyHead);
                                      if (familyHead && familyHead.name && familyHead.lName) {
                                        return `${familyHead.name} ${familyHead.lName}`;
                                      }
                                      return 'First Adult (Auto-assigned)';
                                    })()}
                                    disabled
                                    readOnly
                                  />
                                </div>
                                <div className="d-flex align-items-center">
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removePassengerGroup(group.passengers[0].groupId)}
                                  >
                                    <PersonDash size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {group.passengers.map((passenger, index) => {
                              return (
                                <div key={passenger.id} className="row mb-3">
                                  {/* Passenger Type */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Type</label>
                                    <select
                                      className={`form-select bg-light shadow-none ${formErrors[`passenger-${passenger.id}-type`] ? "is-invalid" : ""}`}
                                      value={passenger.type || 'Adult'}
                                      onChange={(e) => updatePassenger(passenger.id, "type", e.target.value)}
                                      required
                                    >
                                      <option value="Adult">Adult</option>
                                      <option value="Child">Child</option>
                                      <option value="Infant">Infant</option>
                                    </select>
                                    {formErrors[`passenger-${passenger.id}-type`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-type`]}</div>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Title</label>
                                    <select
                                      className={`form-select bg-light shadow-none ${formErrors[`passenger-${passenger.id}-title`] ? "is-invalid" : ""}`}
                                      value={passenger.title}
                                      onChange={(e) => updatePassenger(passenger.id, "title", e.target.value)}
                                      required
                                      disabled={!passenger.type}
                                    >
                                      {getTitleOptions(passenger.type)}
                                    </select>
                                    {formErrors[`passenger-${passenger.id}-title`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-title`]}</div>
                                    )}
                                  </div>

                                  {/* First Name */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">First Name</label>
                                    <input
                                      type="text"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-name`] ? "is-invalid" : ""}`}
                                      value={passenger.name}
                                      onChange={(e) => updatePassenger(passenger.id, "name", e.target.value)}
                                      placeholder="First name"
                                      required
                                    />
                                    {formErrors[`passenger-${passenger.id}-name`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-name`]}</div>
                                    )}
                                  </div>

                                  {/* Last Name */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Last Name</label>
                                    <input
                                      type="text"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-lName`] ? "is-invalid" : ""}`}
                                      value={passenger.lName}
                                      onChange={(e) => updatePassenger(passenger.id, "lName", e.target.value)}
                                      placeholder="Last name"
                                      required
                                    />
                                    {formErrors[`passenger-${passenger.id}-lName`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-lName`]}</div>
                                    )}
                                  </div>

                                  {/* Passport Number */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Passport</label>
                                    <input
                                      type="text"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-passportNumber`] ? "is-invalid" : ""}`}
                                      value={passenger.passportNumber}
                                      onChange={(e) => updatePassenger(passenger.id, "passportNumber", e.target.value)}
                                      placeholder="AB1234567"
                                      required
                                    />
                                    {formErrors[`passenger-${passenger.id}-passportNumber`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-passportNumber`]}</div>
                                    )}
                                  </div>

                                  {/* Date of Birth */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">DOB</label>
                                    <input
                                      type="date"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-dob`] ? "is-invalid" : ""}`}
                                      value={passenger.dob || ''}
                                      onChange={(e) => updatePassenger(passenger.id, "dob", e.target.value)}
                                      max={new Date().toISOString().split('T')[0]} // Can't be born in future
                                    />
                                    {formErrors[`passenger-${passenger.id}-dob`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-dob`]}</div>
                                    )}
                                  </div>

                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Passport Issue</label>
                                    <input
                                      type="date"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-passportIssue`] ? "is-invalid" : ""}`}
                                      value={passenger.passportIssue}
                                      onChange={(e) => updatePassenger(passenger.id, "passportIssue", e.target.value)}
                                      required
                                      max={new Date().toISOString().split('T')[0]} // Can't issue passport in future
                                    />
                                    {formErrors[`passenger-${passenger.id}-passportIssue`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-passportIssue`]}</div>
                                    )}
                                  </div>

                                  {/* Passport Expiry */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Passport Expiry</label>
                                    <input
                                      type="date"
                                      className={`form-control bg-light shadow-none ${formErrors[`passenger-${passenger.id}-passportExpiry`] ? "is-invalid" : ""}`}
                                      value={passenger.passportExpiry}
                                      onChange={(e) => updatePassenger(passenger.id, "passportExpiry", e.target.value)}
                                      required
                                      min={new Date().toISOString().split('T')[0]} // Today's date
                                    />
                                    {formErrors[`passenger-${passenger.id}-passportExpiry`] && (
                                      <div className="invalid-feedback">{formErrors[`passenger-${passenger.id}-passportExpiry`]}</div>
                                    )}
                                  </div>



                                  {/* Country */}
                                  <div className="col-lg-2 mb-2">
                                    <label className="control-label">Country</label>
                                    <div>
                                      <RawSelect
                                        options={countries.map(c => ({ label: c, value: c }))}
                                        value={passenger.country ? { label: passenger.country, value: passenger.country } : null}
                                        onChange={(opt) => updatePassenger(passenger.id, "country", opt ? opt.value : "")}
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
                                            border: formErrors[`passenger-${passenger.id}-country`] ? '1px solid #dc3545' : '1px solid #ced4da'
                                          }),
                                          singleValue: (base) => ({ ...base, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })
                                        }}
                                        classNamePrefix="react-select"
                                      />
                                      {formErrors[`passenger-${passenger.id}-country`] && (
                                        <div className="invalid-feedback d-block">{formErrors[`passenger-${passenger.id}-country`]}</div>
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

                                  {/* Remove Infant Button */}
                                  {passenger.type === "Infant" && (
                                    <div className="col-lg-2 mb-2 mt-2 d-flex align-items-center">
                                      <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() => removeInfant(passenger.id)}
                                      >
                                        Remove Infant
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Infant Selection Modal */}
                  {showInfantModal && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Select Family Head for Infant</h5>
                            <button type="button" className="btn-close" onClick={() => setShowInfantModal(false)}></button>
                          </div>
                          <div className="modal-body">
                            <div className="mb-3">
                              <label className="form-label">Select Family Head:</label>
                              <select
                                className="form-select"
                                value={selectedFamilyHead}
                                onChange={(e) => setSelectedFamilyHead(e.target.value)}
                              >
                                <option value="">Select Family Head</option>
                                {familyHeads.map(head => (
                                  <option key={head.id} value={head.id}>
                                    {head.name} {head.lName} ({head.roomType} Room)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="modal-footer">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowInfantModal(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              id="btn" className="btn"
                              onClick={confirmAddInfant}
                            >
                              Add Infant
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Room Type Modal */}
                  {showRoomModal && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Select Room Type</h5>
                            <button type="button" className="btn-close" onClick={() => setShowRoomModal(false)}></button>
                          </div>
                          <div className="modal-body">
                            {Object.keys(bedsPerRoomType).map(roomType => {
                              const count = selectedRooms[roomType] || 0;
                              const pricePerPerson = getPriceForRoomType(roomType.toUpperCase());
                              const bedsInRoom = bedsPerRoomType[roomType];

                              return (
                                <div key={roomType} className="d-flex align-items-center justify-content-between p-3 mb-2 border rounded">
                                  <div>
                                    <strong className="text-capitalize">{roomType} ({bedsInRoom} {bedsInRoom === 1 ? 'Bed' : 'Beds'})</strong>
                                    <div className="small text-muted">{bedsInRoom} {bedsInRoom === 1 ? 'person' : 'persons'} per room</div>
                                    <div className="small text-primary fw-bold">Rs. {pricePerPerson.toLocaleString()} per adult</div>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <button
                                      className="btn btn-outline-secondary btn-sm"
                                      onClick={() => handleRoomChange(roomType, -1)}
                                      disabled={count === 0}
                                    >
                                      -
                                    </button>
                                    <span className="px-3 fw-bold">{count}</span>
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => handleRoomChange(roomType, 1)}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            <div className="mt-4 p-3 bg-light rounded">
                              <div className="d-flex justify-content-between mb-2">
                                <span>Total Adults:</span>
                                <strong>
                                  {Object.entries(selectedRooms).reduce((sum, [type, count]) => {
                                    return sum + (bedsPerRoomType[type] || 0) * count;
                                  }, 0)}
                                </strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Estimated Total:</span>
                                <strong className="text-primary">
                                  Rs. {Object.entries(selectedRooms).reduce((sum, [type, count]) => {
                                    const pricePerPerson = getPriceForRoomType(type.toUpperCase());
                                    const bedsInRoom = bedsPerRoomType[type] || 0;
                                    return sum + (pricePerPerson * bedsInRoom * count);
                                  }, 0).toLocaleString()}
                                </strong>
                              </div>
                            </div>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>
                              Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleAddRooms}>
                              Add Rooms
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="row mt-4">
                    <div className="col-12 text-end">
                      <Link to="/packages" className="btn btn-secondary me-2">
                        Close
                      </Link>
                      <button
                        onClick={handleContinue}
                        id="btn" className="btn"
                      >
                        Continue Booking
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPackagesDetail;