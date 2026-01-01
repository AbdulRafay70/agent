import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import axios from "axios";

const BookingReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stateFromLocation = location.state || {};
  const initialPkg = stateFromLocation.package || null;
  const initialPassengers = stateFromLocation.passengers || [];
  const initialRoomTypes = stateFromLocation.roomTypes || [];
  const initialTotalPrice = stateFromLocation.totalPrice || 0;
  const initialChildPrices = stateFromLocation.childPrices || 0;
  const initialInfantPrices = stateFromLocation.infantPrices || 0;

  const [pkgState, setPkgState] = useState(initialPkg);
  const [passengersState, setPassengersState] = useState(initialPassengers);
  const [roomTypesState, setRoomTypesState] = useState(initialRoomTypes);
  const [totalPriceState, setTotalPriceState] = useState(initialTotalPrice);
  const [childPrices, setChildPrices] = useState(initialChildPrices || 0);
  const [infantPrices, setInfantPrices] = useState(initialInfantPrices || 0);
  // If no location.state provided, try to load from sessionStorage (packages flow)
  useEffect(() => {
    if (!pkgState) {
      try {
        const bookRaw = sessionStorage.getItem('agent_package_book_v1') || sessionStorage.getItem('umrah_booknow_v1');
        if (bookRaw) {
          const parsed = JSON.parse(bookRaw);
          if (parsed && parsed.value) {
            const v = parsed.value;
            setPkgState(v.package || null);
            setRoomTypesState(v.roomTypes || []);
            setTotalPriceState(v.totalPrice || 0);
            setChildPrices(v.childPrices || 0);
            setInfantPrices(v.infantPrices || 0);
          }
        }

        const passRaw = sessionStorage.getItem('agent_package_passengers_v1') || sessionStorage.getItem('umrah_passengers_v1');
        if (passRaw) {
          const parsedP = JSON.parse(passRaw);
          if (parsedP && parsedP.value && parsedP.value.passengers) {
            setPassengersState(parsedP.value.passengers);
          }
        }
      } catch (e) {
        console.error('Failed to load session booking data:', e);
      }
    }
  }, []);
  const [riyalRate, setRiyalRate] = useState(0);
  const [expiryTime, setExpiryTime] = useState(24);
  const [bookingNumber, setBookingNumber] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [currentPassport, setCurrentPassport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShowPassport = (passportFile) => {
    setCurrentPassport(passportFile);
    setShowModal(true);
  };

  // Fetch riyal rate and expiry time from API
  useEffect(() => {
    const fetchRiyalRate = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const orgId = getOrgId();
        const response = await axios.get(`https://api.saer.pk/api/riyal-rates/?organization=${orgId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          const data = response.data;
          if (data && data.length > 0) {
            setRiyalRate(data[0] || {});
          }
        }

      } catch (error) {
        console.error('Error fetching riyal rate:', error);
      }
    };

    const fetchExpiryTime = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const orgId = getOrgId();
        const response = await fetch(`https://api.saer.pk/api/booking-expiry/?organization=${orgId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setExpiryTime(data[0].umrah_expiry_time || 24);
          }
        }
      } catch (error) {
        console.error('Error fetching expiry time:', error);
      }
    };

    const fetchLastBookingNumber = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const orgId = getOrgId();
        const response = await fetch(`https://api.saer.pk/api/bookings/?organization=${orgId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setBookingNumber(data.count + 1);
        }
      } catch (error) {
        console.error('Error fetching booking count:', error);
      }
    };

    fetchRiyalRate();
    fetchExpiryTime();
    fetchLastBookingNumber();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFlightDetails = () => {
    if (!pkgState?.ticket_details?.[0]?.ticket_info) return {};
    const ticket = pkgState.ticket_details[0].ticket_info;
    const tripDetails = ticket.trip_details || [];

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
    let airlineCode = 'N/A';
    if (ticket.airline?.code) {
      airlineCode = ticket.airline.code;
    } else if (ticket.airline?.name && airlineNameToCode[ticket.airline.name]) {
      airlineCode = airlineNameToCode[ticket.airline.name];
    } else if (ticket.flight_number) {
      const flightNum = ticket.flight_number.toString().toUpperCase();
      const match = flightNum.match(/^([A-Z]{2,3})/);
      if (match) airlineCode = match[1];
    } else if (tripDetails[0]?.flight_number) {
      const flightNum = tripDetails[0].flight_number.toString().toUpperCase();
      const match = flightNum.match(/^([A-Z]{2,3})/);
      if (match) airlineCode = match[1];
    }

    return {
      departure: tripDetails[0] || {},
      return: tripDetails[1] || {},
      airline: { code: airlineCode }
    };
  };

  const flightDetails = getFlightDetails();

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

  const getPriceForRoomType = (type) => {
    if (!pkgState) return 0;

    const ticketInfo = pkgState.ticket_details?.[0]?.ticket_info;
    const basePrice =
      (pkgState.adault_visa_selling_price || 0) +
      (pkgState.transport_selling_price || 0) +
      (ticketInfo?.adult_selling_price || ticketInfo?.adult_price || 0) +
      (pkgState.food_selling_price || 0) +
      (pkgState.makkah_ziyarat_selling_price || 0) +
      (pkgState.madinah_ziyarat_selling_price || 0);

    const hotelPrice = pkgState.hotel_details?.reduce((sum, hotel) => {
      let pricePerNight = 0;
      switch (type.toUpperCase()) {
        case 'SHARING': pricePerNight = hotel.sharing_bed_selling_price || 0; break;
        case 'DOUBLE': pricePerNight = hotel.double_bed_selling_price || 0; break;
        case 'TRIPLE': pricePerNight = hotel.triple_bed_selling_price || 0; break;
        case 'QUAD': pricePerNight = hotel.quad_bed_selling_price || 0; break;
        case 'QUINT': pricePerNight = hotel.quaint_bed_selling_price || 0; break;
        default: pricePerNight = 0;
      }
      return sum + (pricePerNight * (hotel.number_of_nights || 0));
    }, 0) || 0;

    return basePrice + hotelPrice;
  };

  const calculateRoomQuantity = (roomType, paxCount) => {
    const paxPerRoom = getPassengerCountForRoomType(roomType);
    return Math.ceil(paxCount / paxPerRoom);
  };

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

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0];
  };

  const userId = localStorage.getItem("userId");
  const agencyId = Number(localStorage.getItem("agencyId"));
  const BranchId = Number(localStorage.getItem("branchId"));

  // const submitBooking = async () => {
  //   setIsSubmitting(true);
  //   try {
  //     const token = localStorage.getItem("agentAccessToken");
  //     const orgId = getOrgId();
  //     const bookingData = await formatBookingData();

  //     console.log("BookingData Payload:", bookingData);

  //     const response = await axios.post(`https://api.saer.pk/api/bookings/`, bookingData, {
  //       headers: {
  //         // "Content-Type": "application/json",
  //          "Content-Type": "multipart/form-data",
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });

  //     if (response.status >= 200 && response.status < 300) {
  //       console.log('Booking created successfully:', response.data);
  //       navigate('/packages/pay', {
  //         state: {
  //           bookingId: response.data.id,
  //           totalAmount: totalPrice,
  //           package: pkg
  //         }
  //       });
  //     } else {
  //       console.error('Failed to create booking:', response.statusText);
  //       alert('Failed to create booking. Please try again.');
  //     }
  //   } catch (error) {
  //     console.error('Error creating booking:', error);
  //     if (error.response) {
  //       console.error('Error response data:', error.response.data);
  //     }
  //     alert('An error occurred while creating the booking. Please check the console for details.');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const formatBookingData = async () => {
    if (!pkgState) return null;

    // Count paxs for each room type (excluding infants)
    const roomTypeCounts = {};
    roomTypesState.forEach(type => {
      const paxCount = passengersState.filter(p => p.roomType === type && p.type !== "Infant").length;
      roomTypeCounts[type] = paxCount;
    });

    // Format hotel details
    const hotelDetails = pkgState.hotel_details.map(hotel => {
      console.log('🏨 Hotel Debug:', {
        hotel_info: hotel.hotel_info,
        prices: hotel.hotel_info?.prices,
        sharing_bed_price: hotel.sharing_bed_price,
        double_bed_price: hotel.double_bed_price,
        triple_bed_price: hotel.triple_bed_price
      });

      const roomType = hotel.hotel_info?.prices?.[0]?.room_type || "";
      const paxCount = roomTypeCounts[roomType] || 0;
      // Simple quantity calculation - default to 1 room
      const quantity = paxCount > 0 ? 1 : 1;  // Always at least 1 room

      // Get price per night from PACKAGE-LEVEL selling prices (these are in PKR!)
      let pricePerNight = 0;
      switch (roomType.toUpperCase()) {
        case 'SHARING': pricePerNight = Number(hotel.sharing_bed_selling_price) || 0; break;
        case 'DOUBLE': pricePerNight = Number(hotel.double_bed_selling_price) || 0; break;
        case 'TRIPLE': pricePerNight = Number(hotel.triple_bed_selling_price) || 0; break;
        case 'QUAD': pricePerNight = Number(hotel.quad_bed_selling_price) || 0; break;
        case 'QUINT': pricePerNight = Number(hotel.quaint_bed_selling_price) || 0; break;
        case 'ROOM': pricePerNight = Number(hotel.double_bed_selling_price) || 0; break;  // Default "room" to double
        default: pricePerNight = 0;
      }

      console.log('🏨 Using package-level PKR price:', {
        roomType,
        pricePerNight,
        nights: hotel.number_of_nights,
        paxCount,
        totalPassengers: passengersState.length
      });

      // Use TOTAL passenger count, not per-room-type count
      const totalPassengers = passengersState.filter(p => p.type !== "Infant").length;
      const totalPricePKR = pricePerNight * (Number(hotel.number_of_nights) || 0) * totalPassengers;

      console.log('🏨 Hotel pricing (PKR):', {
        pricePerNightPKR: pricePerNight,
        nights: hotel.number_of_nights,
        totalPassengers,
        totalPricePKR
      });

      return {
        check_in_date: hotel.check_in_date || hotel.check_in_time || "",
        check_out_date: hotel.check_out_date || hotel.check_out_time || "",
        number_of_nights: parseInt(hotel.number_of_nights) || 0,
        room_type: roomType,
        price: parseFloat(pricePerNight),  // Send PKR price directly
        quantity: parseInt(quantity),
        total_price: parseFloat(totalPricePKR),  // Send PKR total directly
        riyal_rate: 1,  // Set to 1 so backend multiplication doesn't change the value (PKR × 1 = PKR)
        is_price_pkr: true,  // TRUE - we're sending PKR
        hotel: hotel.hotel_info?.id,
      };
    });

    // Format transport details
    const transportDetails = pkgState.transport_details.map(transport => ({
      vehicle_type: transport.transport_sector_info?.vehicle_type,
      transport_sector: transport.transport_sector_info?.id,
      price: Number(transport.price || transport.transport_sector_info?.adault_price) || 0,
      quantity: 1,
      total_price: Number(transport.price || transport.transport_sector_info?.adault_price) || 0,
      is_price_pkr: riyalRate?.is_transport_pkr ?? true,
      riyal_rate: Number(riyalRate?.rate) || 0,
    }));

    // Format ticket details
    const flightDetails = getFlightDetails();
    const ticketDetails = [{
      trip_details: [
        {
          departure_date_time: flightDetails.departure?.departure_date_time || new Date().toISOString(),
          arrival_date_time: flightDetails.departure?.arrival_date_time || new Date().toISOString(),
          trip_type: "Depearture",
          departure_city: parseInt(flightDetails.departure?.departure_city),
          arrival_city: parseInt(flightDetails.departure?.arrival_city)
        },
        flightDetails.return ? {
          departure_date_time: flightDetails.return?.departure_date_time || new Date().toISOString(),
          arrival_date_time: flightDetails.return?.arrival_date_time || new Date().toISOString(),
          trip_type: "Return",
          departure_city: parseInt(flightDetails.return?.departure_city),
          arrival_city: parseInt(flightDetails.return?.arrival_city)
        } : null
      ].filter(Boolean),
      stopover_details: flightDetails.stopover_city && flightDetails.stopover_city !== null ? [
        {
          stopover_duration: parseInt(flightDetails.stopover_duration),
          trip_type: parseInt(flightDetails.trip_type),
          stopover_city: parseInt(flightDetails.stopover_city)
        }
      ] : [],
      is_meal_included: pkgState.ticket_details?.[0]?.ticket_info?.is_meal_included || false,
      is_refundable: pkgState.ticket_details?.[0]?.ticket_info?.is_refundable || false,
      // pnr: pkg.ticket_details?.[0]?.ticket_info?.pnr || "",
      child_price: Number(pkgState.ticket_details?.[0]?.ticket_info?.child_price || pkgState.child_ticket_price) || 0,
      infant_price: Number(pkgState.ticket_details?.[0]?.ticket_info?.infant_price || pkgState.infant_ticket_price) || 0,
      adult_price: Number(pkgState.ticket_details?.[0]?.ticket_info?.adult_price || pkgState.adult_ticket_price) || 0,
      weight: parseFloat(pkgState.ticket_details?.[0]?.ticket_info?.weight),
      seats: parseInt(pkgState.total_seats),
      pieces: parseInt(pkgState.ticket_details?.[0]?.ticket_info?.pieces),
      is_umrah_seat: true,
      // trip_type: pkg.ticket_details?.[0]?.ticket_info?.trip_type || "",
      // departure_stay_type: pkg.ticket_details?.[0]?.ticket_info?.departure_stay_type || "",
      // return_stay_type: pkg.ticket_details?.[0]?.ticket_info?.return_stay_type || "",
      status: "CONFIRMED",
      is_price_pkr: true,
      riyal_rate: parseFloat(riyalRate?.rate || 0),
      // ticket: parseInt(pkg.ticket_details?.[0]?.ticket_info?.id),
      pnr: pkgState.ticket_details?.[0]?.ticket_info?.pnr || "TEMP-PNR",
      trip_type: pkgState.ticket_details?.[0]?.ticket_info?.trip_type,   // ensure numeric ID
      departure_stay_type: pkgState.ticket_details?.[0]?.ticket_info?.departure_stay_type,
      return_stay_type: pkgState.ticket_details?.[0]?.ticket_info?.return_stay_type,
      ticket: pkgState.ticket_details?.[0]?.ticket_info?.id

    }];

    // Format person details - convert files to base64
    const personDetails = await Promise.all(passengersState.map(async (passenger, index) => {
      const isAdult = passenger.type === "Adult";
      const isChild = passenger.type === "Child";
      const isVisaIncluded = pkgState.adault_visa_price > 0 || pkgState.child_visa_price > 0 || pkgState.infant_visa_price > 0;
      const visaStatus = isVisaIncluded ? "NOT APPLIED" : "NOT INCLUDED";

      const isTicketIncluded = pkgState.ticket_details && pkgState.ticket_details.length > 0;
      const ticketStatus = isTicketIncluded ? "NOT APPROVED" : "NOT INCLUDED";

      const adultTicketPrice = pkgState.ticket_details?.[0]?.ticket_info?.adult_price || 0;
      const childTicketPrice = pkgState.ticket_details?.[0]?.ticket_info?.child_price || 0;
      const infantTicketPrice = pkgState.ticket_details?.[0]?.ticket_info?.infant_price || 0;

      // Handle passport file - convert to base64 string
      let passportPictureBase64 = null;
      if (passenger.passportFile) {
        try {
          let blob;

          if (typeof passenger.passportFile === "string" && passenger.passportFile.startsWith("blob:")) {
            // Convert blob URL to blob
            const response = await fetch(passenger.passportFile);
            blob = await response.blob();
          } else if (passenger.passportFile instanceof File) {
            // Already a file object
            blob = passenger.passportFile;
          } else if (typeof passenger.passportFile === "string" && passenger.passportFile.startsWith("data:")) {
            // Already a base64 string
            passportPictureBase64 = passenger.passportFile;
          }

          // Convert blob to base64 if we have a blob
          if (blob) {
            passportPictureBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.error('Error processing passport file:', error);
        }
      }

      return {
        // Removed ziyarat_details and food_details - now at booking level
        age_group: passenger.type.toUpperCase(),
        person_title: passenger.title || '',
        first_name: passenger.name || '',
        last_name: passenger.lName || '',
        passport_number: passenger.passportNumber || '',
        date_of_birth: passenger.dob ? new Date(passenger.dob).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        passpoet_issue_date: passenger.passportIssue ? new Date(passenger.passportIssue).toISOString().split('T')[0] : '', // Fixed: use passenger.passportIssue
        passport_expiry_date: passenger.passportExpiry ? new Date(passenger.passportExpiry).toISOString().split('T')[0] : '', // Fixed: use passenger.passportExpiry
        // passport_picture removed - cannot send File objects in JSON, will be uploaded separately later
        country: passenger.country || '',
        is_visa_included: isVisaIncluded,
        is_ziyarat_included: true,
        is_food_included: true,
        visa_price: parseFloat(isAdult ? pkgState.adault_visa_price : isChild ? pkgState.child_visa_price : pkgState.infant_visa_price) || 0,
        food_price: parseFloat(pkgState.food_selling_price) || 0,  // Changed from food_price to food_selling_price
        ziyarat_price: parseFloat(isAdult ? (Number(pkgState.makkah_ziyarat_selling_price) || 0) + (Number(pkgState.madinah_ziyarat_selling_price) || 0) : 0) || 0,  // Changed to *_selling_price
        ticket_price: parseFloat(isAdult ? adultTicketPrice : isChild ? childTicketPrice : infantTicketPrice) || 0,
        is_family_head: passenger.isFamilyHead || false,
        family_number: parseInt(passenger.familyNumber) || 0,
        visa_status: visaStatus,
        ticket_status: ticketStatus,
        ticket_remarks: "",
        visa_group_number: "",
        ticket_voucher_number: "",
        ticker_brn: "",
        food_voucher_number: "",
        food_brn: "",
        ziyarat_voucher_number: "",
        ziyarat_brn: "",
        transport_voucher_number: "",
        transport_brn: "",
      };
    }));


    // Calculate total amounts
    const totalTicketAmount = personDetails.reduce((sum, person) => sum + person.ticket_price, 0);
    const totalHotelAmount = hotelDetails.reduce((sum, hotel) => sum + hotel.total_price, 0);
    const totalTransportAmount = transportDetails.reduce((sum, transport) => sum + (transport.total_price || 0), 0);
    const totalVisaAmount = personDetails.reduce((sum, person) => sum + person.visa_price, 0);
    const totalFoodAmount = personDetails.reduce((sum, person) => sum + person.food_price, 0);
    const totalZiyaratAmount = personDetails.reduce((sum, person) => sum + person.ziyarat_price, 0);

    // Calculate grand total - use CALCULATED amounts, not UI state
    const allTotalPrice = totalTicketAmount + totalHotelAmount + totalTransportAmount +
      totalVisaAmount + totalFoodAmount + totalZiyaratAmount;

    console.log('💰 Price Breakdown:', {
      totalTicketAmount,
      totalHotelAmount,  // Changed from totalPriceState to totalHotelAmount
      totalTransportAmount,
      totalVisaAmount,
      totalFoodAmount,
      totalZiyaratAmount,
      allTotalPrice
    });

    const orgId = parseInt(getOrgId()) || 0;
    const userIdNum = parseInt(userId) || 0;
    const agencyIdNum = parseInt(agencyId) || 0;
    const branchIdNum = parseInt(BranchId) || 0;

    console.log('🍽️ Food/Ziyarat Debug:', {
      food_selling_price: pkgState.food_selling_price,
      makkah_ziyarat_selling_price: pkgState.makkah_ziyarat_selling_price,
      madinah_ziyarat_selling_price: pkgState.madinah_ziyarat_selling_price,
      totalFoodAmount,
      totalZiyaratAmount
    });

    console.log('📦 Full pkgState for food/ziyarat:', {
      food_details: pkgState.food_details,
      ziarat_details: pkgState.ziarat_details,
      ziyarat_details: pkgState.ziyarat_details,
      all_keys: Object.keys(pkgState).filter(k => k.includes('food') || k.includes('ziyarat') || k.includes('ziarat'))
    });

    // Prepare food_details at booking level (not person level)
    const foodDetails = (Number(pkgState.food_selling_price) || 0) > 0 ? [{
      food: "Package Food",
      adult_price: Number(pkgState.food_selling_price) || 0,
      child_price: Number(pkgState.food_selling_price) || 0,
      infant_price: Number(pkgState.food_selling_price) || 0,
      total_adults: Number(passengersState.filter(p => p.type === "Adult").length) || 0,
      total_children: Number(passengersState.filter(p => p.type === "Child").length) || 0,
      total_infants: Number(passengersState.filter(p => p.type === "Infant").length) || 0,
      is_price_pkr: riyalRate?.is_food_pkr ?? true,
      riyal_rate: Number(riyalRate?.rate) || 0,
      total_price_pkr: totalFoodAmount,
      total_price_sar: riyalRate?.is_food_pkr ? 0 : totalFoodAmount / (Number(riyalRate?.rate) || 1),
    }] : [];

    // Prepare ziyarat_details at booking level (not person level)
    const ziaratDetails = (Number(pkgState.makkah_ziyarat_selling_price) + Number(pkgState.madinah_ziyarat_selling_price)) > 0 ? [{
      ziarat: "Package Ziyarat",
      city: "", // Can be populated if city info is available
      adult_price: (Number(pkgState.makkah_ziyarat_selling_price) || 0) + (Number(pkgState.madinah_ziyarat_selling_price) || 0),
      child_price: 0,
      infant_price: 0,
      total_adults: Number(passengersState.filter(p => p.type === "Adult").length) || 0,
      total_children: Number(passengersState.filter(p => p.type === "Child").length) || 0,
      total_infants: Number(passengersState.filter(p => p.type === "Infant").length) || 0,
      is_price_pkr: riyalRate?.is_ziarat_pkr ?? true,
      riyal_rate: Number(riyalRate?.rate) || 0,
      total_price_pkr: totalZiyaratAmount,
      total_price_sar: riyalRate?.is_ziarat_pkr ? 0 : totalZiyaratAmount / (Number(riyalRate?.rate) || 1),
    }] : [];

    return {
      hotel_details: hotelDetails,
      transport_details: transportDetails,
      ticket_details: ticketDetails,
      person_details: personDetails,
      food_details: foodDetails,  // Added at booking level
      ziyarat_details: ziaratDetails,  // Added at booking level
      payment_details: [],

      booking_number: `UMRAH-${Number(bookingNumber) || Math.floor(Math.random() * 10000)}`,
      expiry_time: new Date(Date.now() + (Number(expiryTime) || 24) * 60 * 60 * 1000).toISOString(),
      total_pax: Number(passengersState.length) || 0,
      total_adult: Number(passengersState.filter(p => p.type === "Adult").length) || 0,
      total_infant: Number(passengersState.filter(p => p.type === "Infant").length) || 0,
      total_child: Number(passengersState.filter(p => p.type === "Child").length) || 0,
      total_ticket_amount: Number(totalTicketAmount) || 0,
      total_hotel_amount: Number(totalHotelAmount) || 0,  // Changed from totalPriceState to totalHotelAmount
      total_transport_amount: Number(totalTransportAmount) || 0,
      total_visa_amount: Number(totalVisaAmount) || 0,
      total_amount: Number(allTotalPrice) || 0,

      // PKR/SAR specific amounts (matching Custom Umrah)
      // For Umrah packages, prices are ALREADY in PKR, so don't multiply by riyal_rate
      total_hotel_amount_pkr: Number(totalHotelAmount),  // Already in PKR, no conversion needed
      total_transport_amount_pkr: Number(totalTransportAmount),  // Already in PKR
      total_ticket_amount_pkr: Number(totalTicketAmount),
      total_visa_amount_pkr: Number(totalVisaAmount),
      total_food_amount_pkr: Number(totalFoodAmount),
      total_ziyarat_amount_pkr: Number(totalZiyaratAmount),

      is_paid: false,
      status: "Under-process",  // Match Custom Umrah: "Under-process"
      payment_status: "Pending",  // Match Custom Umrah: "Pending"
      is_partial_payment_allowed: false,  // Match Custom Umrah: false
      category: "Package",
      booking_type: "UMRAH",  // Add booking_type like Custom Umrah
      is_full_package: true,  // Add is_full_package like Custom Umrah
      user_id: Number(userIdNum) || 0,  // Changed from user to user_id
      organization_id: Number(orgId) || 0,  // Changed from organization to organization_id
      branch_id: Number(branchIdNum) || 0,  // Changed from branch to branch_id
      agency_id: Number(agencyIdNum) || 0  // Changed from agency to agency_id
    };
  };

  const submitBooking = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("agentAccessToken");
      const orgId = getOrgId();
      const bookingData = await formatBookingData();

      console.log("BookingData Payload (stringified):", {
        ...bookingData
      });

      console.log("📤 Sending as JSON (not FormData)");

      // -------- API call - SEND AS JSON, NOT FormData! --------
      const response = await axios.post(
        `https://api.saer.pk/api/bookings/`,
        bookingData,  // Send as JSON object, not FormData
        {
          headers: {
            "Content-Type": "application/json",  // JSON, not multipart/form-data
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        console.log("Booking created successfully:", response.data);
        navigate("/packages/pay", {
          state: {
            bookingId: response.data.id,
            totalAmount: totalPriceState,
            package: pkgState,
          },
        });
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
        console.error("Error response headers:", error.response.headers);

        // Show detailed error message
        let errorMessage = "An error occurred while creating the booking.\n\n";
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage += error.response.data;
          } else if (error.response.data.non_field_errors) {
            errorMessage += "Validation Errors:\n";
            errorMessage += error.response.data.non_field_errors.join('\n');
          } else if (error.response.data.detail) {
            errorMessage += error.response.data.detail;
          } else {
            errorMessage += JSON.stringify(error.response.data, null, 2);
          }
        }
        alert(errorMessage);
      } else {
        alert("An error occurred while creating the booking. Please check the console for details.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        <div className="col-12 col-lg-10 ps-lg-4">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="d-flex align-items-center me-4">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "30px", height: "30px", fontSize: "14px" }}>
                        1
                      </div>
                      <span className="ms-2 text-primary fw-bold">Booking Detail</span>
                    </div>
                    <div className="flex-grow-1 bg-primary" style={{ height: "2px" }}></div>
                    <div className="d-flex align-items-center mx-4">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "30px", height: "30px", fontSize: "14px" }}>
                        2
                      </div>
                      <span className="ms-2 text-primary fw-bold">Booking Review</span>
                    </div>
                    <div className="flex-grow-1" style={{ height: "2px", backgroundColor: "#dee2e6" }}></div>
                    <div className="d-flex align-items-center">
                      <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{ width: "30px", height: "30px", fontSize: "14px" }}>
                        3
                      </div>
                      <span className="ms-2 text-muted">Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row my-5">
                <div className="col-12">
                  <h5 className="mb-4 fw-bold">Booking Review</h5>
                  <div className="card mb-4">
                    <div className="card-body" style={{ background: "#F2F9FF" }}>
                      <div className="row">
                        <div className="col-md-8">
                          <h4 className="mb-3 fw-bold">{pkgState?.title || "Umrah Package"}</h4>
                          <div className="mb-2">
                            <strong>Hotels:</strong>
                            <div className="small text-muted">
                              {pkgState?.hotel_details?.map((hotel, i) => (
                                `${hotel.number_of_nights} Nights at ${hotel.hotel_info?.city} (${hotel.hotel_info?.name})`
                              )).join(" / ") || "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Selected Room Types:</strong>
                            <div className="small text-muted">
                              {roomTypesState.join(", ") || "None selected"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Transport:</strong>
                            <div className="small text-muted">
                              {pkgState?.transport_details?.[0]?.transport_sector_info?.reference
                                ? formatSectorReference(pkgState.transport_details[0].transport_sector_info.reference)
                                : pkgState?.transport_details?.[0]?.transport_sector_info?.name || "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Food:</strong>
                            <div className="small text-muted">
                              {(pkgState?.food_selling_price || 0) > 0 ? "INCLUDED" : "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Ziyarat:</strong>
                            <div className="small text-muted">
                              {((pkgState?.makkah_ziyarat_selling_price || 0) > 0 || (pkgState?.madinah_ziyarat_selling_price || 0) > 0) ? "YES" : "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Flight:</strong>
                            <div className="small text-muted">
                              Travel Date: {flightDetails.departure?.departure_date_time ?
                                `${flightDetails.airline?.code} - ${formatDateTime(flightDetails.departure.departure_date_time)} to ${formatDateTime(flightDetails.departure.arrival_date_time)}` :
                                "N/A"}
                            </div>
                            <div className="small text-muted">
                              Return Date: {flightDetails.return?.departure_date_time ?
                                `${flightDetails.airline?.code} - ${formatDateTime(flightDetails.return.departure_date_time)} to ${formatDateTime(flightDetails.return.arrival_date_time)}` :
                                "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <h4 className="mb-3 fw-bold">Price Calculation</h4>
                          <div className="mb-3">
                            {roomTypesState.map((type) => {
                              const paxCount = passengersState.filter(p => p.roomType === type && p.type !== "Infant").length;
                              const price = getPriceForRoomType(type);
                              const quantity = calculateRoomQuantity(type, paxCount);

                              return (
                                <div key={type} className="mb-2 small">
                                  <span className="fw-bold">{type} Room:</span>
                                  <span> Rs. {price.toLocaleString()} × {quantity} = </span>
                                  <span className="text-primary">Rs. {(price * quantity).toLocaleString()}</span>
                                  <div className="text-muted">({paxCount} paxs in {quantity} rooms)</div>
                                </div>
                              );
                            })}
                          </div>

                          {childPrices > 0 && (
                            <div className="text-success small">
                              Child Discounts Applied: Rs. {childPrices.toLocaleString()}
                            </div>
                          )}

                          {infantPrices > 0 && (
                            <div className="text-info small">
                              Infant Charges: Rs. {infantPrices.toLocaleString()}
                            </div>
                          )}

                          <div className="border-top pt-2 mt-2 fw-bold">
                            Grand Total: Rs. {totalPriceState.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded mb-4">
                    <h5 className="mb-3 fw-bold">Passengers Passport Detail</h5>
                    <div className="table-responsive">
                      <table className="table mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Type</th>
                            <th>Title</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Passport No</th>
                            <th>Passport Issue</th>
                            <th>Passport Expiry</th>
                            <th>Country</th>
                            <th>Room Type</th>
                            <th>Visa Pic</th>
                          </tr>
                        </thead>
                        <tbody>
                          {passengersState.map((passenger, index) => (
                            <tr key={index}>
                              <td>{passenger.type}</td>
                              <td>{passenger.title}</td>
                              <td>{passenger.name}</td>
                              <td>{passenger.lName}</td>
                              <td>{passenger.passportNumber || "N/A"}</td>
                              <td>{formatDate(passenger.passportIssue)}</td>
                              <td>{formatDate(passenger.passportExpiry)}</td>
                              <td>{passenger.country}</td>
                              <td>{passenger.roomType}</td>
                              <td>
                                {passenger.passportFile ? (
                                  <Button
                                    variant="link"
                                    onClick={() => handleShowPassport(passenger.passportFile)}
                                  >
                                    See
                                  </Button>
                                ) : (
                                  "Not Provided"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-3">
                    <Link
                      to="/packages/detail"
                      className="btn btn-secondary px-4"
                      state={{ package: pkgState, passengers: passengersState, roomTypes: roomTypesState, totalPrice: totalPriceState }}
                    >
                      Back To Edit
                    </Link>
                    <button
                      onClick={submitBooking}
                      className="btn px-4"
                      id="btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Make Booking"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Passport Document</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {currentPassport ? (
            typeof currentPassport === "string" && currentPassport.startsWith("data:application/pdf") ? (
              <iframe
                src={currentPassport}
                width="100%"
                height="500px"
                title="Passport PDF"
                frameBorder="0"
              />
            ) : (
              <img
                src={typeof currentPassport === "string" ? currentPassport : URL.createObjectURL(currentPassport)}
                alt="Passport"
                style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
              />
            )
          ) : (
            <div>No passport document available</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BookingReview;