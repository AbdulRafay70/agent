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
  const [agencyType, setAgencyType] = useState(null);
  const [foodInfo, setFoodInfo] = useState(null);
  const [makkahZiyaratInfo, setMakkahZiyaratInfo] = useState(null);
  const [madinahZiyaratInfo, setMadinahZiyaratInfo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  // If no location.state provided, try to load from sessionStorage (packages flow)
  useEffect(() => {
    if (!pkgState) {
      try {
        const bookRaw = sessionStorage.getItem('agent_package_book_v1') || sessionStorage.getItem('umrah_booknow_v1');
        console.log('📦 Loading from sessionStorage:', bookRaw ? 'found data' : 'no data');
        if (bookRaw) {
          const parsed = JSON.parse(bookRaw);
          console.log('📦 Parsed sessionStorage data:', {
            totalPrice: parsed?.value?.totalPrice,
            childPrices: parsed?.value?.childPrices,
            infantPrices: parsed?.value?.infantPrices,
            hasPackage: !!parsed?.value?.package
          });
          if (parsed && parsed.value) {
            const v = parsed.value;
            setPkgState(v.package || null);
            setRoomTypesState(v.roomTypes || []);
            setTotalPriceState(v.totalPrice || 0);
            setChildPrices(v.childPrices || 0);
            setInfantPrices(v.infantPrices || 0);
            console.log('📦 Set totalPriceState to:', v.totalPrice || 0);
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
          console.log('✅ Review page - Fetched agency type:', agencyData.agency_type);

          // Fetch discount group if available
          if (agencyData.discount_group) {
            try {
              const discResponse = await axios.get(`http://127.0.0.1:8000/api/discounts/?discount_group=${agencyData.discount_group}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (discResponse.status === 200 && Array.isArray(discResponse.data)) {
                const umrahDiscount = discResponse.data.find(d => d.things === "umrah_package");
                if (umrahDiscount) {
                  const amt = Number(umrahDiscount.umrah_package_discount_amount) || 0;
                  console.log('💰 Found applicable discount:', amt);
                  setDiscountAmount(amt);
                }
              }
            } catch (err) {
              console.error('❌ Error fetching discounts:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching agency type:', error);
      }
    };

    fetchAgencyType();
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
        const response = await axios.get(`http://127.0.0.1:8000/api/riyal-rates/?organization=${orgId}`, {
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
        const response = await fetch(`http://127.0.0.1:8000/api/booking-expiry/?organization=${orgId}`, {
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
        const response = await fetch(`http://127.0.0.1:8000/api/bookings/?organization=${orgId}`, {
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

  // Fetch Food Details if ID exists
  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (pkgState?.food_price_id) {
        try {
          const token = localStorage.getItem("agentAccessToken");
          const response = await axios.get(`http://127.0.0.1:8000/api/food-prices/${pkgState.food_price_id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.status === 200) {
            console.log("🍽️ Fetched Food Info:", response.data);
            setFoodInfo(response.data);
          }
        } catch (error) {
          console.error("❌ Error fetching food details:", error);
        }
      }
    };
    fetchFoodDetails();
    fetchFoodDetails();
  }, [pkgState?.food_price_id]);

  // Fetch Ziyarat Details (Makkah & Madinah)
  useEffect(() => {
    const fetchZiyaratDetails = async () => {
      const token = localStorage.getItem("agentAccessToken");

      // Fetch Makkah Ziyarat
      if (pkgState?.makkah_ziyarat_id) {
        try {
          const res = await axios.get(`http://127.0.0.1:8000/api/ziarat-prices/${pkgState.makkah_ziyarat_id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.status === 200) {
            console.log("🕋 Fetched Makkah Ziyarat Info:", res.data);
            setMakkahZiyaratInfo(res.data);
          }
        } catch (err) {
          console.error("❌ Error fetching Makkah ziyarat details:", err);
        }
      }

      // Fetch Madinah Ziyarat
      if (pkgState?.madinah_ziyarat_id) {
        try {
          const res = await axios.get(`http://127.0.0.1:8000/api/ziarat-prices/${pkgState.madinah_ziyarat_id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.status === 200) {
            console.log("🕌 Fetched Madinah Ziyarat Info:", res.data);
            setMadinahZiyaratInfo(res.data);
          }
        } catch (err) {
          console.error("❌ Error fetching Madinah ziyarat details:", err);
        }
      }
    };
    fetchZiyaratDetails();
  }, [pkgState?.makkah_ziyarat_id, pkgState?.madinah_ziyarat_id]);

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
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper to format transport route
  const getTransportRouteDisplay = (transportInfo) => {
    if (!transportInfo) return "N/A";

    // Handle Big Sector (Chain of cities)
    if (transportInfo.big_sector) {
      const smalls = transportInfo.big_sector.small_sectors || [];
      if (smalls.length > 0) {
        const cities = [smalls[0].departure_city];
        smalls.forEach(s => cities.push(s.arrival_city));
        return cities.join(" ➔ ");
      }
      return transportInfo.big_sector.name || `Region #${transportInfo.big_sector.id}`;
    }

    // Handle Small Sector
    if (transportInfo.small_sector) {
      return `${transportInfo.small_sector.departure_city} ➔ ${transportInfo.small_sector.arrival_city}`;
    }

    // Fallback - use vehicle_name or type if specific route name unavailable
    return transportInfo.vehicle_name || transportInfo.vehicle_type || transportInfo.name || "N/A";
  };

  const getPriceForRoomType = (type) => {
    if (!pkgState) return 0;

    const ticketInfo = pkgState.ticket_details?.[0]?.ticket_info || pkgState.ticket_details?.[0];
    const basePrice =
      (Number(pkgState.adault_visa_selling_price) || Number(pkgState.adault_visa_price) || 0) +
      (Number(pkgState.transport_selling_price) || Number(pkgState.transport_price) || 0) +
      (Number(ticketInfo?.adult_selling_price) || Number(ticketInfo?.adult_price) || Number(ticketInfo?.adult_fare) || Number(pkgState.adult_ticket_price) || 0) +
      (Number(pkgState.food_selling_price) || Number(pkgState.food_price) || 0) +
      (Number(pkgState.makkah_ziyarat_selling_price) || Number(pkgState.makkah_ziyarat_price) || 0) +
      (Number(pkgState.madinah_ziyarat_selling_price) || Number(pkgState.madinah_ziyarat_price) || 0);

    // --- BACKUP CALCULATION ---
    // (Logic moved to getEffectiveBasePrice to avoid clutter, but we need basePrice + hotelPrice here)

    const hotelPrice = pkgState.hotel_details?.reduce((sum, hotel) => {
      let pricePerNight = 0;
      switch (type.toUpperCase()) {
        case 'SHARING': pricePerNight = Number(hotel.sharing_bed_selling_price) || Number(hotel.sharing_bed_price) || 0; break;
        case 'DOUBLE': pricePerNight = Number(hotel.double_bed_selling_price) || Number(hotel.double_bed_price) || 0; break;
        case 'TRIPLE': pricePerNight = Number(hotel.triple_bed_selling_price) || Number(hotel.triple_bed_price) || 0; break;
        case 'QUAD': pricePerNight = Number(hotel.quad_bed_selling_price) || Number(hotel.quad_bed_price) || 0; break;
        case 'QUINT': pricePerNight = Number(hotel.quaint_bed_selling_price) || Number(hotel.quaint_bed_price) || Number(hotel.quint_bed_price) || 0; break;
        case 'PRIVATE_DOUBLE':
        case 'PRIVATE DOUBLE': pricePerNight = (Number(hotel.double_bed_selling_price) || Number(hotel.double_bed_price) || 0) * 2; break;
        default: pricePerNight = 0;
      }
      return sum + (pricePerNight * (Number(hotel.number_of_nights) || 0));
    }, 0) || 0;

    // Add 500 PKR service charge for packages (applied only to Area Agency)
    const serviceCharge = (agencyType === 'Full Agency') ? 0 : 500;

    return basePrice + hotelPrice + serviceCharge;
  };

  // Logic to get the EFFECTIVE base price (Ticket+Visa+Transport+Food+Ziyarat)
  // checks if the calculated one is 0, and if so, tries to derive from Grand Total
  // only works for simple single-pax or uniform cases, but better than 0.
  const getEffectiveBasePrice = () => {
    if (!pkgState) return 0;
    const ticketInfo = pkgState.ticket_details?.[0]?.ticket_info || pkgState.ticket_details?.[0];
    let base = (Number(pkgState.adault_visa_selling_price) || Number(pkgState.adault_visa_price) || 0) +
      (Number(pkgState.transport_selling_price) || Number(pkgState.transport_price) || 0) +
      (Number(ticketInfo?.adult_selling_price) || Number(ticketInfo?.adult_price) || Number(ticketInfo?.adult_fare) || Number(pkgState.adult_ticket_price) || 0) +
      (Number(pkgState.food_selling_price) || Number(pkgState.food_price) || 0) +
      (Number(pkgState.makkah_ziyarat_selling_price) || Number(pkgState.makkah_ziyarat_price) || 0) +
      (Number(pkgState.madinah_ziyarat_selling_price) || Number(pkgState.madinah_ziyarat_price) || 0);

    // If base is 0 but we have a Total Price, try to infer base
    if (base === 0 && totalPriceState > 0 && passengersState.length > 0) {
      // Calculate Total Hotel Cost
      let totalHotelCost = 0;
      roomTypesState.forEach(type => {
        const paxInRoom = passengersState.filter(p => p.roomType === type && p.type !== "Infant");
        // Calculate hotel cost for this room type
        // Logic: Hotel Price Per Pax * Pax Count
        const hotelPricePerPax = pkgState.hotel_details?.reduce((sum, hotel) => {
          let pricePerNight = 0;
          switch (type.toUpperCase()) {
            case 'SHARING': pricePerNight = Number(hotel.sharing_bed_selling_price) || 0; break;
            case 'DOUBLE': pricePerNight = Number(hotel.double_bed_selling_price) || 0; break;
            case 'TRIPLE': pricePerNight = Number(hotel.triple_bed_selling_price) || 0; break;
            case 'QUAD': pricePerNight = Number(hotel.quad_bed_selling_price) || 0; break;
            case 'QUINT': pricePerNight = Number(hotel.quaint_bed_selling_price) || 0; break;
            case 'PRIVATE_DOUBLE':
            case 'PRIVATE DOUBLE': pricePerNight = (Number(hotel.double_bed_selling_price) || 0) * 2; break; // Full room cost per pax if single occupancy? 
            // Actually Private Double means 1 person pays for 2 beds.
            default: pricePerNight = 0;
          }
          return sum + (pricePerNight * (Number(hotel.number_of_nights) || 0));
        }, 0) || 0;

        totalHotelCost += hotelPricePerPax * paxInRoom.length;
      });

      // Subtract Service Charges (500 per pax)
      const totalService = (agencyType === 'Full Agency' ? 0 : 500) * passengersState.filter(p => p.type !== "Infant").length;

      // Remaining is Total Base (Adults*Base + Children*ChildBase + Infants*InfantBase)
      // For simplicity, assume Base is approx (Total - Hotel - Svc) / NonInfantPax
      // This is a rough fallback but better than 0.
      const nonInfantPax = passengersState.filter(p => p.type !== "Infant").length;
      if (nonInfantPax > 0) {
        const residual = totalPriceState - totalHotelCost - totalService;
        if (residual > 0) {
          base = residual / nonInfantPax;
          console.log('⚠️ Derived Base Price from Total:', base);
        }
      }
    }
    return base;
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

  // Read from agentOrganization JSON object (where login actually stores the data)
  const getAgentOrgData = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    try {
      return JSON.parse(agentOrg);
    } catch (e) {
      console.error('Failed to parse agentOrganization:', e);
      return null;
    }
  };

  const agentOrgData = getAgentOrgData();
  const userId = agentOrgData?.user_id;
  const agencyId = agentOrgData?.agency_id;
  const BranchId = agentOrgData?.branch_id;

  // const submitBooking = async () => {
  //   setIsSubmitting(true);
  //   try {
  //     const token = localStorage.getItem("agentAccessToken");
  //     const orgId = getOrgId();
  //     const bookingData = await formatBookingData();

  //     console.log("BookingData Payload:", bookingData);

  //     const response = await axios.post(`http://127.0.0.1:8000/api/bookings/`, bookingData, {
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
    console.log('HOTEL DETAILS SOURCE ARRAY:', pkgState.hotel_details);
    const hotelDetails = pkgState.hotel_details.map(hotel => {
      console.log('🏨 Processing Hotel Row:', hotel);
      console.log('🏨 Hotel Keys:', Object.keys(hotel));
      console.log('🏨 Hotel Info FULL:', JSON.stringify(hotel.hotel_info, null, 2));

      console.log('🏨 Hotel Debug:', {
        hotel_info: hotel.hotel_info,
        prices: hotel.hotel_info?.prices,
        sharing_bed_price: hotel.sharing_bed_price,
        double_bed_price: hotel.double_bed_price,
        triple_bed_price: hotel.triple_bed_price,
        id_check: {
          from_info: hotel.hotel_info?.id,
          from_hotel_prop: hotel.hotel,
          from_id: hotel.id,
          from_hotel_id: hotel.hotel_id
        }
      });


      // Get the room type from user's selection (roomTypesState), not from hotel prices array
      // The user selected a specific room type (e.g., "sharing"), so use that
      const selectedRoomType = roomTypesState[0] || "sharing";  // Default to sharing if not found
      const roomType = selectedRoomType;
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
        selectedRoomType,
        roomType,
        pricePerNight,
        nights: hotel.number_of_nights,
        paxCount,
        totalPassengers: passengersState.length
      });

      // Use TOTAL passenger count for this room type
      const paxCountInRoom = roomTypeCounts[roomType] || 0;

      // Calculate total for this hotel stay
      // Formula: Price Per Night * Number of Nights * Number of Pax
      // The user confirmed 140,000 for 2000*35*2, so it MUST be per person.
      const totalPricePKR = pricePerNight * (parseInt(hotel.number_of_nights) || 0) * paxCountInRoom;

      console.log('🔄 Price Calculation:', {
        pricePerNight,
        nights: hotel.number_of_nights,
        paxCountInRoom,
        total: totalPricePKR
      });

      console.log('🏨 Hotel pricing (PKR):', {
        pricePerNightPKR: pricePerNight,
        nights: hotel.number_of_nights,
        totalPassengers: paxCountInRoom,
        totalPricePKR
      });

      return {
        check_in_date: hotel.check_in_date || hotel.check_in_time || "",
        check_out_date: hotel.check_out_date || hotel.check_out_time || "",
        number_of_nights: parseInt(hotel.number_of_nights) || 0,
        room_type: roomType,
        // Send explicit model fields
        price_in_pkr: parseFloat(pricePerNight),
        total_in_pkr: parseFloat(totalPricePKR),
        price_in_sar: 0,

        price: parseFloat(pricePerNight),  // Send PKR price directly
        quantity: parseInt(paxCountInRoom), // Set quantity to pax count for record keeping
        total_price: parseFloat(totalPricePKR),  // Send PKR total directly
        riyal_rate: 1,  // Set to 1 so backend multiplication doesn't change the value
        is_price_pkr: true,  // TRUE - we're sending PKR
        hotel: hotel.hotel_info?.id || hotel.hotel || hotel.id || hotel.hotel_id,
      };
    });

    // Format transport details
    // If package has transport_details array, use it; otherwise create from package-level transport_selling_price
    const transportDetails = (pkgState.transport_details && pkgState.transport_details.length > 0)
      ? pkgState.transport_details.map(transport => {
        // Extract Big Sector & Small Sectors for detailed route info
        const bigSector = transport.transport_sector_info?.big_sector;
        const smallSectors = bigSector?.small_sectors || [];

        // Map to sector_details format expected by BookingTransportDetailsSerializer
        const sectorDetails = smallSectors.map((sector, index) => ({
          sector_no: index + 1,
          small_sector_id: sector.id,
          sector_type: sector.sector_type,
          is_airport_pickup: sector.is_airport_pickup,
          is_airport_drop: sector.is_airport_drop,
          is_hotel_to_hotel: sector.is_hotel_to_hotel,
          departure_city: sector.departure_city,
          arrival_city: sector.arrival_city,
          contact_person_name: sector.contact_name,
          contact_number: sector.contact_number
        }));

        const priceVal = Number(transport.transport_selling_price || transport.price || transport.transport_sector_info?.adault_price) || 0;

        return {
          vehicle_type: transport.transport_sector || transport.vehicle_type?.id || transport.transport_sector_info?.vehicle_type,
          transport_sector: transport.transport_sector || transport.transport_sector_info?.id,
          big_sector_id: bigSector?.id,
          // Send explicit model fields to ensure serializer accepts them
          price_in_pkr: priceVal,
          price_in_sar: 0,
          // Keep legacy fields just in case, but rely on price_in_pkr
          price: priceVal,
          quantity: 1,
          total_price: priceVal,
          is_price_pkr: riyalRate?.is_transport_pkr ?? true,
          riyal_rate: Number(riyalRate?.rate) || 0,
          sector_details: sectorDetails
        };
      })
      : (pkgState.transport_selling_price && Number(pkgState.transport_selling_price) > 0)
        ? [{
          // Create transport detail from package-level price
          vehicle_type: null,
          transport_sector: null,
          price: Number(pkgState.transport_selling_price) || 0,
          quantity: passengersState.length,  // Per passenger
          total_price: (Number(pkgState.transport_selling_price) || 0) * passengersState.length,
          is_price_pkr: true,
          riyal_rate: Number(riyalRate?.rate) || 0,
        }]
        : [];  // No transport

    // Format ticket details
    // Format ticket details - Direct Mapping from Package State
    const ticketInfo = pkgState.ticket_details?.[0]?.ticket_info;
    const ticketDetails = [{
      trip_details: ticketInfo?.trip_details?.map(trip => ({
        departure_date_time: trip.departure_date_time,
        arrival_date_time: trip.arrival_date_time,
        trip_type: trip.trip_type,
        departure_city: trip.departure_city,
        arrival_city: trip.arrival_city,
        flight_number: trip.flight_number,
        airline_code: trip.airline?.code || trip.airline_code,
      })) || [],
      stopover_details: ticketInfo?.stopover_details?.map(stop => ({
        stopover_city: stop.stopover_city,
        stopover_duration: stop.stopover_duration,
        trip_type: stop.trip_type
      })) || [],
      is_meal_included: ticketInfo?.is_meal_included || false,
      is_refundable: ticketInfo?.is_refundable || false,
      child_price: Number(ticketInfo?.child_price || pkgState.child_ticket_price) || 0,
      infant_price: Number(ticketInfo?.infant_price || pkgState.infant_ticket_price) || 0,
      adult_price: Number(ticketInfo?.adult_price || pkgState.adult_ticket_price) || 0,
      weight: parseFloat(ticketInfo?.baggage_weight || ticketInfo?.weight) || 0,
      seats: parseInt(pkgState.total_seats) || 1,
      pieces: parseInt(ticketInfo?.baggage_pieces || ticketInfo?.pieces) || 1,
      is_umrah_seat: true,
      trip_type: ticketInfo?.trip_type || "",
      departure_stay_type: ticketInfo?.departure_stay_type || "",
      return_stay_type: ticketInfo?.return_stay_type || "",
      status: "CONFIRMED",
      is_price_pkr: true,
      riyal_rate: parseFloat(riyalRate?.rate || 0),
      ticket: ticketInfo?.id, // ID reference
      pnr: ticketInfo?.pnr || "TEMP-PNR"
    }];

    console.log('🎫 Ticket Details being sent:', JSON.stringify(ticketDetails, null, 2));

    // Format person details - convert files to base64
    const personDetails = await Promise.all(passengersState.map(async (passenger, index) => {
      const isAdult = passenger.type === "Adult";
      const isChild = passenger.type === "Child";
      const isVisaIncluded = pkgState.adault_visa_selling_price > 0 || pkgState.child_visa_selling_price > 0 || pkgState.infant_visa_selling_price > 0;
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
        visa_price: parseFloat(isAdult ? pkgState.adault_visa_selling_price : isChild ? pkgState.child_visa_selling_price : pkgState.infant_visa_selling_price) || 0,
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
    // Add 500 PKR service charge per passenger (excluding infants), but skip for Full Agency
    const serviceCharge = (agencyType === 'Full Agency') ? 0 : 500;

    const nonInfantPassengers = passengersState.filter(p => p.type !== "Infant").length;
    const totalServiceCharge = serviceCharge * nonInfantPassengers;

    const allTotalPrice = totalTicketAmount + totalHotelAmount + totalTransportAmount +
      totalVisaAmount + totalFoodAmount + totalZiyaratAmount + totalServiceCharge;

    console.log('💰 Price Breakdown:', {
      totalTicketAmount,
      totalHotelAmount,
      totalTransportAmount,
      totalVisaAmount,
      totalFoodAmount,
      totalZiyaratAmount,
      serviceCharge,
      nonInfantPassengers,
      totalServiceCharge,
      allTotalPrice,
      totalPriceState: totalPriceState,
      childPrices: childPrices,
      infantPrices: infantPrices
    });

    // Use totalPriceState (package selling price from UI) if available and greater than recalculated sum
    // This handles the case where session data might be missing price fields but the passed total is correct.
    let finalTotalAmount = allTotalPrice + (Number(childPrices) || 0) + (Number(infantPrices) || 0);

    // Fallback: If totalPriceState is significantly larger than our recalculated sum, assume components were missing data
    // and trust the passed state.
    if (totalPriceState > 0 && totalPriceState > finalTotalAmount) {
      console.log('⚠️ Using passed totalPriceState as recalculated sum is lower (missing data).');
      finalTotalAmount = totalPriceState;
    }

    console.log('💰 Final Total Amount:', {
      usingAllTotalPrice: finalTotalAmount === allTotalPrice,
      allTotalPrice,
      totalPriceState,
      childPrices,
      infantPrices,
      finalTotalAmount
    });

    const orgId = parseInt(getOrgId());
    const userIdNum = parseInt(userId);
    const agencyIdNum = parseInt(agencyId);
    const branchIdNum = parseInt(BranchId);

    // Log the values for debugging
    console.log('🔍 User/Agency/Branch IDs from localStorage:', {
      userId,
      agencyId,
      BranchId,
      orgId,
      userIdNum,
      agencyIdNum,
      branchIdNum,
      isValidUser: !isNaN(userIdNum) && userIdNum > 0,
      isValidAgency: !isNaN(agencyIdNum) && agencyIdNum > 0,
      isValidBranch: !isNaN(branchIdNum) && branchIdNum > 0,
      isValidOrg: !isNaN(orgId) && orgId > 0
    });

    // Validate that we have valid IDs
    if (!userIdNum || isNaN(userIdNum) || userIdNum <= 0) {
      console.error('❌ Invalid user ID:', userIdNum);
      alert('User ID is missing or invalid. Please log in again.');
      return null;
    }

    // Agency and branch are optional for employees
    // Only validate if they are provided
    if (agencyIdNum && (isNaN(agencyIdNum) || agencyIdNum <= 0)) {
      console.error('❌ Invalid agency ID:', agencyIdNum);
      alert('Agency ID is invalid. Please log in again.');
      return null;
    }

    if (branchIdNum && (isNaN(branchIdNum) || branchIdNum <= 0)) {
      console.error('❌ Invalid branch ID:', branchIdNum);
      alert('Branch ID is invalid. Please log in again.');
      return null;
    }

    if (!orgId || isNaN(orgId) || orgId <= 0) {
      console.error('❌ Invalid organization ID:', orgId);
      alert('Organization ID is missing or invalid. Please log in again.');
      return null;
    }

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
      food: foodInfo?.title || "Package Food",
      description: foodInfo?.description || "",
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
    // We can have Makkah, Madinah, or both.
    const ziyaratDetails = [];

    // Makkah Ziyarat
    if ((Number(pkgState.makkah_ziyarat_selling_price) || 0) > 0) {
      ziyaratDetails.push({
        ziarat: makkahZiyaratInfo?.title || "Makkah Ziyarat",
        city: "Makkah",
        adult_price: Number(pkgState.makkah_ziyarat_selling_price) || 0,
        child_price: Number(pkgState.makkah_ziyarat_selling_price) || 0,
        infant_price: Number(pkgState.makkah_ziyarat_selling_price) || 0,
        total_adults: Number(passengersState.filter(p => p.type === "Adult").length) || 0,
        total_children: Number(passengersState.filter(p => p.type === "Child").length) || 0,
        total_infants: Number(passengersState.filter(p => p.type === "Infant").length) || 0,
        is_price_pkr: riyalRate?.is_ziarat_pkr ?? true,
        riyal_rate: Number(riyalRate?.rate) || 0,
        total_price_pkr: (Number(pkgState.makkah_ziyarat_selling_price) || 0) * passengersState.length,
        contact_person_name: makkahZiyaratInfo?.description || "", // Using description for now if relevant logic needed
      });
    }

    // Madinah Ziyarat
    if ((Number(pkgState.madinah_ziyarat_selling_price) || 0) > 0) {
      ziyaratDetails.push({
        ziarat: madinahZiyaratInfo?.title || "Madinah Ziyarat",
        city: "Madinah",
        adult_price: Number(pkgState.madinah_ziyarat_selling_price) || 0,
        child_price: Number(pkgState.madinah_ziyarat_selling_price) || 0,
        infant_price: Number(pkgState.madinah_ziyarat_selling_price) || 0,
        total_adults: Number(passengersState.filter(p => p.type === "Adult").length) || 0,
        total_children: Number(passengersState.filter(p => p.type === "Child").length) || 0,
        total_infants: Number(passengersState.filter(p => p.type === "Infant").length) || 0,
        is_price_pkr: riyalRate?.is_ziarat_pkr ?? true,
        riyal_rate: Number(riyalRate?.rate) || 0,
        total_price_pkr: (Number(pkgState.madinah_ziyarat_selling_price) || 0) * passengersState.length,
        contact_person_name: madinahZiyaratInfo?.description || "",
      });
    }

    return {
      hotel_details: hotelDetails,
      transport_details: transportDetails,
      ticket_details: ticketDetails,
      person_details: personDetails,
      food_details: foodDetails,  // Added at booking level
      ziyarat_details: ziyaratDetails,  // Added at booking level
      payment_details: [],

      booking_number: `UMRAH-${Number(bookingNumber) || Math.floor(Math.random() * 10000)}`,
      expiry_time: new Date(Date.now() + (Number(expiryTime) || 24) * 60 * 60 * 1000).toISOString(),
      total_pax: Number(passengersState.length) || 0,
      total_adult: Number(passengersState.filter(p => p.type === "Adult").length) || 0,
      total_infant: Number(passengersState.filter(p => p.type === "Infant").length) || 0,
      total_child: Number(passengersState.filter(p => p.type === "Child").length) || 0,
      total_ticket_amount: Number(totalTicketAmount) + totalServiceCharge || 0,  // Include service charge here so backend recalculation works
      total_hotel_amount: Number(totalHotelAmount) || 0,  // Changed from totalPriceState to totalHotelAmount
      total_transport_amount: Number(totalTransportAmount) || 0,
      total_visa_amount: Number(totalVisaAmount) || 0,
      total_visa_amount: Number(totalVisaAmount) || 0,
      total_amount: (Number(finalTotalAmount) || 0) - (Number(discountAmount) || 0),  // Use package selling price minus discount

      // PKR/SAR specific amounts (matching Custom Umrah)
      // For Umrah packages, prices are ALREADY in PKR, so don't multiply by riyal_rate
      total_hotel_amount_pkr: Number(totalHotelAmount),  // Already in PKR, no conversion needed
      total_transport_amount_pkr: Number(totalTransportAmount),  // Already in PKR
      total_ticket_amount_pkr: Number(totalTicketAmount) + totalServiceCharge,  // Include service charge
      total_visa_amount_pkr: Number(totalVisaAmount),
      total_food_amount_pkr: Number(totalFoodAmount),  // Food amount
      total_ziyarat_amount_pkr: Number(totalZiyaratAmount),

      // CRITICAL: Set total_discount to prevent backend from recalculating total_amount
      // Backend skips recalculation if total_discount > 0 (see booking/models.py line 641)
      total_discount: Number(discountAmount) > 0 ? Number(discountAmount) : 0.01,  // Use actual discount or tiny value
      discount_notes: Number(discountAmount) > 0 ? "Agency Discount Applied" : "Service charge included in total_amount",

      is_paid: false,
      status: "Under-process",  // Match Custom Umrah: "Under-process"
      payment_status: "Pending",  // Match Custom Umrah: "Pending"
      is_partial_payment_allowed: false,  // Match Custom Umrah: false
      category: "Package",
      booking_type: "UMRAH",  // Add booking_type like Custom Umrah
      is_full_package: true,  // Add is_full_package like Custom Umrah
      umrah_package_id: pkgState?.id || pkgState?.package_id || pkgState?.umrah_package_id || null,  // Changed from umrah_package to umrah_package_id
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

      // If formatBookingData returns null, it means validation failed
      if (!bookingData) {
        console.error('❌ Booking data validation failed');
        setIsSubmitting(false);
        return;
      }

      console.log("BookingData Payload (stringified):", {
        ...bookingData
      });

      console.log("🔍 TOTAL_AMOUNT DEBUG:", {
        total_amount: bookingData.total_amount,
        total_ticket_amount: bookingData.total_ticket_amount,
        total_hotel_amount: bookingData.total_hotel_amount,
        total_transport_amount: bookingData.total_transport_amount,
        total_visa_amount: bookingData.total_visa_amount
      });

      console.log("📤 Sending as JSON (not FormData)");

      // -------- API call - SEND AS JSON, NOT FormData! --------
      const response = await axios.post(
        `http://127.0.0.1:8000/api/bookings/`,
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
                              {pkgState?.hotel_details?.map((hotel, i) => {
                                const cityName = hotel.hotel_info?.city_name || hotel.hotel_info?.city || "N/A";
                                return `${hotel.number_of_nights} Nights at ${cityName} (${hotel.hotel_info?.name})`;
                              }).join(" / ") || "N/A"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Selected Room Types:</strong>
                            <div className="small text-muted">
                              {roomTypesState.map(r => r.replace(/_/g, ' ').toUpperCase()).join(", ") || "None selected"}
                            </div>
                          </div>
                          <div className="mb-2">
                            <strong>Transport:</strong>
                            <div className="small text-muted">
                              {getTransportRouteDisplay(pkgState?.transport_details?.[0]?.transport_sector_info)}
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
                          {/* Adults per Room Type */}
                          <div className="mb-3">
                            {roomTypesState.map((type) => {
                              const adultsInRoom = passengersState.filter(p => p.roomType === type && p.type === "Adult").length;
                              if (adultsInRoom === 0) return null;

                              const hotelPrice = getPriceForRoomType(type) - (getEffectiveBasePrice() + (agencyType === 'Full Agency' ? 0 : 500));
                              // Use Effective Base Price
                              const effectiveTotal = (getEffectiveBasePrice() + hotelPrice + (agencyType === 'Full Agency' ? 0 : 500));

                              return (
                                <div key={`adult-${type}`} className="mb-2 small">
                                  <span className="fw-bold">Adult ({type}):</span>
                                  <span> Rs. {effectiveTotal.toLocaleString()} × {adultsInRoom} = </span>
                                  <span className="text-primary">Rs. {(effectiveTotal * adultsInRoom).toLocaleString()}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Children (Assumed Without Bed for now or derived) */}
                          {(() => {
                            const children = passengersState.filter(p => p.type === "Child");
                            if (children.length === 0) return null;

                            // Calculate Child Price (Base Price without Hotel, minus Visa/Ticket difference)
                            // This matches the logic implied: Child Price = Package Base - (Adult - Child diffs)
                            // Note: We use the base helper from getPriceForRoomType logic implicitly or redefine it.
                            // For safety, let's calculate it consistently.
                            const ticketInfo = pkgState.ticket_details?.[0]?.ticket_info || pkgState.ticket_details?.[0];
                            const adultTicket = Number(ticketInfo?.adult_selling_price) || Number(ticketInfo?.adult_price) || Number(pkgState.adult_ticket_price) || 0;
                            const childTicket = Number(ticketInfo?.child_selling_price) || Number(ticketInfo?.child_price) || Number(pkgState.child_ticket_price) || 0;

                            const adultVisa = Number(pkgState.adault_visa_selling_price) || Number(pkgState.adault_visa_price) || 0;
                            const childVisa = Number(pkgState.child_visa_selling_price) || Number(pkgState.child_visa_price) || 0;

                            // Base components common to all
                            const transport = Number(pkgState.transport_selling_price) || Number(pkgState.transport_price) || 0;
                            const food = Number(pkgState.food_selling_price) || Number(pkgState.food_price) || 0;
                            const ziarat = (Number(pkgState.makkah_ziyarat_selling_price) || 0) + (Number(pkgState.madinah_ziyarat_selling_price) || 0);

                            const childTotal = childVisa + childTicket + transport + food + ziarat;

                            return (
                              <div className="mb-2 small">
                                <span className="fw-bold">Child (Without Bed):</span>
                                <span> Rs. {childTotal.toLocaleString()} × {children.length} = </span>
                                <span className="text-primary">Rs. {(childTotal * children.length).toLocaleString()}</span>
                              </div>
                            );
                          })()}

                          {/* Infants */}
                          {(() => {
                            const infants = passengersState.filter(p => p.type === "Infant");
                            if (infants.length === 0) return null;

                            const ticketInfo = pkgState.ticket_details?.[0]?.ticket_info || pkgState.ticket_details?.[0];
                            const infantTicket = Number(ticketInfo?.infant_selling_price) || Number(ticketInfo?.infant_price) || Number(pkgState.infant_ticket_price) || 0;
                            const infantVisa = Number(pkgState.infant_visa_selling_price) || Number(pkgState.infant_visa_price) || 0;

                            const infantTotal = infantTicket + infantVisa;

                            return (
                              <div className="mb-2 small text-info">
                                <span className="fw-bold">Infant:</span>
                                <span> Rs. {infantTotal.toLocaleString()} × {infants.length} = </span>
                                <span> Rs. {(infantTotal * infants.length).toLocaleString()}</span>
                              </div>
                            );
                          })()}

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