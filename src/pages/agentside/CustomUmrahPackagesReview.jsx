import React, { useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
// import { Link, useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { CloudUpload, Search, Utensils } from "lucide-react";
import { Bag } from "react-bootstrap-icons";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const BookingReview = () => {
  const [currentStep] = useState(2);
  const [showModal, setShowModal] = useState(false);
  const [currentPassport, setCurrentPassport] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [manualFamilies, setManualFamilies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [riyalRate, setRiyalRate] = useState(null);
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  const navigate = useNavigate();

  // Load data from sessionStorage on mount
  React.useEffect(() => {
    // Load package data
    const packageStorage = sessionStorage.getItem('umrah_booknow_v1');
    if (packageStorage) {
      try {
        const parsed = JSON.parse(packageStorage);
        const pkg = parsed.value || null;
        setPackageData(pkg);

        // Also load passengers/families from package data if available
        if (pkg && pkg.formData && pkg.formData.passengers) {
          setPassengers(pkg.formData.passengers);
        }
        if (pkg && pkg.manualFamilies) {
          setManualFamilies(pkg.manualFamilies);
        }

      } catch (e) {
        console.error('Error parsing package data:', e);
      }
    }

    // Fallback: Load passenger data from separate storage if exists (legacy or direct passenger edit flow)
    const passengerStorage = sessionStorage.getItem('umrah_passengers_v1');
    if (passengerStorage) {
      try {
        const parsed = JSON.parse(passengerStorage);
        // Only override if package data didn't provide them, or if we want to prioritize this storage
        if (parsed.value?.passengers?.length > 0) {
          setPassengers(parsed.value.passengers);
        }
        if (parsed.value?.manualFamilies?.length > 0) {
          setManualFamilies(parsed.value.manualFamilies);
        }
      } catch (e) {
        console.error('Error parsing passenger data:', e);
      }
    }

    // Fetch riyal rate
    const fetchRiyalRate = async () => {
      try {
        const agentOrg = localStorage.getItem("agentOrganization");
        if (!agentOrg) {
          console.error('No agentOrganization in localStorage');
          setIsLoadingRate(false);
          return;
        }
        const orgData = JSON.parse(agentOrg);
        const orgId = orgData.ids[0];

        // Get auth token
        const token = localStorage.getItem("agentAccessToken");
        if (!token) {
          console.error('No auth token found');
          setIsLoadingRate(false);
          return;
        }

        console.log('Fetching riyal rate for org:', orgId);
        const response = await axios.get(
          `http://127.0.0.1:8000/api/riyal-rates/?organization=${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log('Riyal rate response:', response.data);
        if (response.data && response.data.length > 0) {
          setRiyalRate(response.data[0]);
          console.log('Riyal rate set:', response.data[0]);
        } else {
          console.error('No riyal rate data found');
        }
      } catch (error) {
        console.error('Error fetching riyal rate:', error);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchRiyalRate();
  }, []);

  const handleBackToEdit = () => {
    const draftId = `draft-${Date.now()}`;
    navigate(`/packages/custom-umrah/detail/${draftId}`);
  };

  // Use total price from session data directly
  const totalPrice = React.useMemo(() => {
    if (!packageData) return 0;
    return packageData.total_cost || 0;
  }, [packageData]);

  if (!packageData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h4>No package data found</h4>
          <Link to="/packages/umrah-calculater" className="btn btn-primary mt-3">
            Go to Calculator
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const safeText = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (typeof val === 'object') {
      // prefer name, then code, then id
      return val.name || val.code || val.id || JSON.stringify(val);
    }
    return String(val);
  };

  const handleShowPassport = (passportFile) => {
    setCurrentPassport(passportFile);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentPassport(null);
  };

  // Helper function to get organization ID
  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    try {
      const orgData = JSON.parse(agentOrg);
      return orgData.ids && orgData.ids[0] ? orgData.ids[0] : null;
    } catch (e) {
      return null;
    }
  };

  // Helper function to get user ID from agentOrganization
  const getUserId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    try {
      const orgData = JSON.parse(agentOrg);
      return orgData.user_id || null;
    } catch (e) {
      return null;
    }
  };

  // Helper function to get agency ID from agentOrganization
  const getAgencyId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    try {
      const orgData = JSON.parse(agentOrg);
      return orgData.agency_id || null;
    } catch (e) {
      return null;
    }
  };

  // Helper function to get branch ID from agentOrganization
  const getBranchId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    try {
      const orgData = JSON.parse(agentOrg);
      return orgData.branch_id || null;
    } catch (e) {
      return null;
    }
  };

  // Helper function to generate booking number
  const generateBookingNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `BK${timestamp}${randomStr}`.toUpperCase();
  };

  // Helper function to get expiry time (24 hours from now by default)
  const getExpiryTime = () => {
    const expiryHours = 24; // Can be fetched from API if needed
    return new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
  };

  // Prepare booking data from session storage
  const prepareBookingData = () => {
    if (!packageData || !passengers || passengers.length === 0) {
      toast.error("Missing package or passenger data. Please go back and complete the booking.");
      return null;
    }

    const token = localStorage.getItem("agentAccessToken");
    const userId = getUserId();
    const agencyId = getAgencyId();
    const branchId = getBranchId();
    const orgId = getOrgId();

    // Validate required context IDs
    // Agency and branch are optional for employees
    if (!orgId || !userId) {
      console.error('Missing required IDs', { orgId, userId, agencyId, branchId });
      toast.error('Cannot make booking: missing organization or user context. Please ensure you are logged in.');
      return null;
    }

    // Count passengers by type
    const adultCount = passengers.filter(p => p.type === "Adult").length;
    const childCount = passengers.filter(p => p.type === "Child").length;
    const infantCount = passengers.filter(p => p.type === "Infant").length;

    // Calculate component totals
    let totalHotelAmount = 0;
    let totalTransportAmount = 0;
    let totalTicketAmount = 0;
    let totalVisaAmount = 0;
    let totalFoodAmount = 0;
    let totalZiaratAmount = 0;

    // Hotel details transformation
    const hotelDetails = (packageData.hotel_details || []).map(hotel => {
      // Extract total price from multiple possible sources
      // Priority: total_price (from Calculator) > savedNet (from saved packages) > price > cost
      const hotelTotalPrice = parseFloat(
        hotel.total_price ||
        hotel.savedNet ||
        hotel.price ||
        hotel.cost ||
        hotel.amount ||
        0
      );
      const numberOfNights = parseInt(hotel.number_of_nights || hotel.noOfNights || hotel.nights || 1);

      // Calculate per-night rate (price field should be per-night, not total)
      const perNightRate = numberOfNights > 0 ? hotelTotalPrice / numberOfNights : hotelTotalPrice;

      // Add TOTAL price to total hotel amount (not per-night rate!)
      totalHotelAmount += hotelTotalPrice;

      // Determine if hotel price is in PKR or SAR from riyal rate settings
      const isHotelPKR = riyalRate?.is_hotel_pkr || false;

      // Calculate SAR and PKR prices (using total price for calculations)
      const total_in_riyal_rate = isHotelPKR ? 0 : hotelTotalPrice; // SAR total
      const total_in_pkr = isHotelPKR ? hotelTotalPrice : hotelTotalPrice * (riyalRate?.rate || 1); // PKR total

      return {
        hotel: hotel.hotel || hotel.hotel_info?.id || null,
        check_in_date: hotel.check_in_time || hotel.checkIn || null,
        check_out_date: hotel.check_out_time || hotel.checkOut || null,
        number_of_nights: numberOfNights,
        room_type: hotel.room_type || hotel.roomType || "",
        price: perNightRate,  // Per-night rate
        quantity: 1,
        total_price: hotelTotalPrice,  // Total price
        is_price_pkr: isHotelPKR,
        riyal_rate: riyalRate?.rate || 0,
        total_in_riyal_rate: total_in_riyal_rate,
        total_in_pkr: total_in_pkr,
        special_request: hotel.special_request || hotel.specialRequest || "",
        sharing_type: hotel.sharing_type || hotel.sharingType || "",
        self_hotel_name: hotel.self_hotel_name || hotel.selfHotelName || "",
        // Include assigned_families for voucher generation
        assigned_families: hotel.assignedFamilies || hotel.assigned_families || []
      };
    });

    // Transport details transformation
    const transportDetails = (packageData.transport_details || []).map(transport => {
      const adultPrice = parseFloat(transport.transport_sector_info?.adault_price || transport.adault_price || 0);
      const childPrice = parseFloat(transport.transport_sector_info?.child_price || transport.child_price || 0);
      const infantPrice = parseFloat(transport.transport_sector_info?.infant_price || transport.infant_price || 0);

      // Check if transport is included in Visa price
      // Primary check: calculatedVisaPrices.includesTransport flag
      // Fallback check: if the original price is already 0, it means Calculator marked it as FREE
      const isTransportIncludedInVisa = packageData.calculatedVisaPrices?.includesTransport ||
        (adultPrice === 0 && childPrice === 0 && infantPrice === 0);

      console.log('🚐 Transport Debug:', {
        isTransportIncludedInVisa,
        calculatedVisaPrices: packageData.calculatedVisaPrices,
        originalAdultPrice: adultPrice,
        originalChildPrice: childPrice,
        originalInfantPrice: infantPrice,
        effectiveAdultPrice: isTransportIncludedInVisa ? 0 : adultPrice
      });

      // If transport is included in visa, price should be 0 for the booking payload
      const effectiveAdultPrice = isTransportIncludedInVisa ? 0 : adultPrice;
      const effectiveChildPrice = isTransportIncludedInVisa ? 0 : childPrice;
      const effectiveInfantPrice = isTransportIncludedInVisa ? 0 : infantPrice;

      const transportTotal = (effectiveAdultPrice * adultCount) + (effectiveChildPrice * childCount) + (effectiveInfantPrice * infantCount);
      totalTransportAmount += transportTotal;

      // Extract sector details from big_sector.small_sectors
      let sectorDetails = [];
      if (transport.transport_sector_info?.big_sector?.small_sectors) {
        sectorDetails = transport.transport_sector_info.big_sector.small_sectors.map((sector, index) => ({
          sector_no: index + 1,
          small_sector_id: sector.id,
          sector_type: sector.sector_type || '',
          is_airport_pickup: sector.is_airport_pickup || sector.sector_type === 'AIRPORT PICKUP',
          is_airport_drop: sector.is_airport_drop || sector.sector_type === 'AIRPORT DROP',
          is_hotel_to_hotel: sector.is_hotel_to_hotel || sector.sector_type === 'HOTEL TO HOTEL',
          departure_city: sector.departure_city || sector.departure_city_code || '',
          arrival_city: sector.arrival_city || sector.arrival_city_code || '',
          contact_number: sector.contact_number || '',
          contact_person_name: sector.contact_name || '',
          date: new Date().toISOString().split('T')[0], // Default to today, should be updated based on booking dates
          voucher_no: '',
          brn_no: ''
        }));
      } else if (transport.transport_sector_info?.small_sector) {
        // Single small sector
        const sector = transport.transport_sector_info.small_sector;
        sectorDetails = [{
          sector_no: 1,
          small_sector_id: sector.id,
          sector_type: sector.sector_type || '',
          is_airport_pickup: sector.is_airport_pickup || sector.sector_type === 'AIRPORT PICKUP',
          is_airport_drop: sector.is_airport_drop || sector.sector_type === 'AIRPORT DROP',
          is_hotel_to_hotel: sector.is_hotel_to_hotel || sector.sector_type === 'HOTEL TO HOTEL',
          departure_city: sector.departure_city || sector.departure_city_code || '',
          arrival_city: sector.arrival_city || sector.arrival_city_code || '',
          contact_number: sector.contact_number || '',
          contact_person_name: sector.contact_name || '',
          date: new Date().toISOString().split('T')[0],
          voucher_no: '',
          brn_no: ''
        }];
      }

      // Determine if transport is in PKR or SAR from riyal rate settings
      const isTransportPKR = riyalRate?.is_transport_pkr || false;
      const price_in_sar = isTransportPKR ? 0 : effectiveAdultPrice;
      const price_in_pkr = isTransportPKR ? transportTotal : transportTotal * (riyalRate?.rate || 1);

      return {
        vehicle_type: transport.vehicle_type || null,
        vehicle_type_display: transport.vehicle_type_display || null,
        big_sector_id: transport.big_sector_id || transport.transport_sector_info?.big_sector?.id || null,
        price: effectiveAdultPrice,
        total_price: transportTotal,
        is_price_pkr: isTransportPKR,
        riyal_rate: riyalRate?.rate || 0,
        price_in_pkr: price_in_pkr,
        price_in_sar: price_in_sar,
        sector_details: sectorDetails
      };
    });

    // Ticket/Flight details transformation
    const ticketDetails = (packageData.ticket_details || []).map((ticket, idx) => {
      // Use the info object if it exists (for nested structures), otherwise use the ticket object itself
      const ticketInfo = ticket.ticket_info || ticket;

      // LOGIC FIX: Prioritize the cost calculated in the Calculator
      // calculator sends: { ticket_info: {...}, flight_number: "...", price: 1000 ... }
      // or similar structure. We need to trust the `price` or `total_price` sent from calculator.

      const providedTotal = parseFloat(ticket.price || ticket.total_price || 0);
      const calculatedTotal = providedTotal > 0 ? providedTotal : 0;

      // If we have a provided total, we can infer per-person price if needed, 
      // or just use the provided total for the booking.
      const paxCount = adultCount + childCount + infantCount || 1;
      const inferredPerPax = calculatedTotal / paxCount;

      totalTicketAmount += calculatedTotal;

      let ticketId = null;
      if (ticket.id) {
        ticketId = parseInt(ticket.id);
      } else if (ticketInfo.id) {
        ticketId = parseInt(ticketInfo.id);
      } else if (ticketInfo.ticket) {
        ticketId = parseInt(typeof ticketInfo.ticket === 'object' ? ticketInfo.ticket.id : ticketInfo.ticket);
      }

      return {
        ticket: ticketId,
        pnr: ticketInfo.pnr || "N/A",
        trip_type: ticketInfo.trip_type || "Round-trip",
        departure_stay_type: ticketInfo.departure_stay_type || "standard",
        return_stay_type: ticketInfo.return_stay_type || "standard",
        seats: adultCount + childCount,
        // use inferred or explicit price per person
        adult_price: ticketInfo.adult_price || inferredPerPax,
        child_price: ticketInfo.child_price || inferredPerPax,
        infant_price: ticketInfo.infant_price || inferredPerPax,
        is_meal_included: ticketInfo.is_meal_included || false,
        is_refundable: ticketInfo.is_refundable || false,
        weight: ticketInfo.weight || 0,
        pieces: ticketInfo.pieces || 0,
        is_umrah_seat: ticketInfo.is_umrah_seat || true,
        // Add total price for this ticket entry (backend might need it or we use it for verifying)
        total_price: calculatedTotal
      };
    });

    // If no tickets in loop, totalTicketAmount might be 0. 
    // Double check if packageData has a global tickets_cost we should favor.
    if (totalTicketAmount === 0 && packageData.tickets_cost) {
      totalTicketAmount = parseFloat(packageData.tickets_cost);
    }

    // Food details transformation
    const foodDetails = (packageData.food_details || []).map(food => {
      // Calculator sends: { food: 15, price: 3500, total_price: 3500 ... }
      // We should trust `total_price` or `price` from this object.

      const foodId = food.food || food.food_id || (food.food_info ? food.food_info.id : null);

      // Use total_price from calculator if available (it accounts for pax count and savedNet)
      let totalCost = parseFloat(food.total_price || 0);
      if (totalCost === 0 && food.price) {
        totalCost = parseFloat(food.price); // fallback if price is actually the total
      }

      // Accumulate
      totalFoodAmount += totalCost;

      return {
        food: foodId || "",
        // If we have a total cost, we can put it here. 
        // Backend often expects per-pax prices in some fields, but for the booking payload
        // we mainly care about the total being correct or the reference being correct.
        // Let's pass the per-person price effectively if needed.
        adult_price: food.price || 0,
        child_price: food.price || 0,
        infant_price: food.price || 0,

        total_adults: adultCount,
        total_children: childCount,
        total_infants: infantCount,

        is_price_pkr: true, // Calculator usually sends net in PKR equivalent or converts it
        riyal_rate: riyalRate?.rate || 50,

        total_price_pkr: totalCost, // Trust the calculator's total
        total_price_sar: 0, // Assume PKR for simplicity unless defined otherwise
      };
    });

    // Ziarat details transformation
    const ziaratDetails = (packageData.ziarat_details || []).map(ziarat => {
      // Calculator sends: { ziarat: 15, price: 5000, total_price: 5000 ... }

      const ziaratId = ziarat.ziarat || ziarat.ziarat_id || (ziarat.ziarat_info ? ziarat.ziarat_info.id : null);

      let totalCost = parseFloat(ziarat.total_price || 0);
      if (totalCost === 0 && ziarat.price) {
        totalCost = parseFloat(ziarat.price);
      }

      totalZiaratAmount += totalCost;

      return {
        ziarat: ziaratId || "",
        city: ziarat.city || "",
        adult_price: ziarat.price || 0,
        child_price: ziarat.price || 0,
        infant_price: ziarat.price || 0,
        total_adults: adultCount,
        total_children: childCount,
        total_infants: infantCount,
        is_price_pkr: true,
        riyal_rate: riyalRate?.rate || 50,
        total_price_pkr: totalCost,
        total_price_sar: 0,
        date: ziarat.date
      };
    });

    // Visa amount calculation
    // Trust the calculated total from packageData if available
    if (packageData.visas_cost || packageData.visa_total_cost) {
      totalVisaAmount = parseFloat(packageData.visas_cost || packageData.visa_total_cost);
    } else {
      const adultVisaPrice = parseFloat(packageData.adault_visa_price || 0);
      const childVisaPrice = parseFloat(packageData.child_visa_price || 0);
      const infantVisaPrice = parseFloat(packageData.infant_visa_price || 0);
      totalVisaAmount = (adultVisaPrice * adultCount) + (childVisaPrice * childCount) + (infantVisaPrice * infantCount);
    }

    // Get ticket ID and prices from ticket_details for Person Details
    let ticketId = null;
    if (ticketDetails.length > 0) {
      ticketId = ticketDetails[0].ticket;
    }

    const adultTicketPrice = ticketDetails.length > 0 ? ticketDetails[0].adult_price : 0;
    const childTicketPrice = ticketDetails.length > 0 ? ticketDetails[0].child_price : 0;
    const infantTicketPrice = ticketDetails.length > 0 ? ticketDetails[0].infant_price : 0;

    // Calculate total passengers for food/ziyarat calculations
    const totalPax = adultCount + childCount + infantCount;

    // Person details transformation (passengers)
    const personDetails = passengers.map((passenger, index) => {
      // Get passenger-specific prices
      // For Visa, use the rate if available, checking multiple possible sources
      let passengerVisaPrice = 0;
      if (passenger.type === "Adult") {
        passengerVisaPrice = parseFloat(packageData.visa_rates?.adult || packageData.calculatedVisaPrices?.adultPrice || 0);
      } else if (passenger.type === "Child") {
        passengerVisaPrice = parseFloat(packageData.visa_rates?.child || packageData.calculatedVisaPrices?.childPrice || 0);
      } else {
        passengerVisaPrice = parseFloat(packageData.visa_rates?.infant || packageData.calculatedVisaPrices?.infantPrice || 0);
      }

      // Fallback: If still 0 but we have a total visa amount, distribute it (last resort)
      if (passengerVisaPrice === 0 && totalVisaAmount > 0) {
        // simple average if individual rates not found
        passengerVisaPrice = totalVisaAmount / (adultCount + childCount + infantCount);
      }

      const passengerTicketPrice = passenger.type === "Adult" ? adultTicketPrice :
        passenger.type === "Child" ? childTicketPrice : infantTicketPrice;

      return {
        age_group: passenger.type || "",
        person_title: passenger.title || "",
        first_name: passenger.name || "",
        last_name: passenger.lName || "",
        passport_number: passenger.passportNumber || "",
        date_of_birth: passenger.DOB || "",
        passpoet_issue_date: passenger.passportIssue || "",
        passport_expiry_date: passenger.passportExpiry || "",
        country: passenger.country || "",


        // Visa details
        is_visa_included: true,
        visa_price: passengerVisaPrice,
        is_visa_price_pkr: true,
        visa_rate_in_sar: 0,
        visa_rate_in_pkr: passengerVisaPrice,
        visa_riyal_rate: riyalRate?.rate || 0,
        visa_status: (passengerVisaPrice > 0 || packageData.is_full_package || packageData.add_visa || packageData.only_visa) ? "Pending" : "N/A",


        // Family details
        is_family_head: passenger.isHead || false,
        family_number: (passenger.familyIndex !== undefined && passenger.familyIndex !== null)
          ? passenger.familyIndex + 1
          : 0,

        // Ticket details
        ticket: ticketId,
        ticket_status: ticketDetails.length > 0 ? "NOT APPROVED" : "NOT INCLUDED",
        ticket_price: passengerTicketPrice,
        ticket_discount: 0,
        ticket_included: ticketDetails.length > 0,

        // Nested details - map from package-level to person-level
        contact_details: [],

        // Map person-specific Ziarat (distribute cost or just repeat details?)
        // Ideally we associate the Ziarat entry.
        ziyarat_details: ziaratDetails.map(z => ({
          city: z.city,
          total_pax: totalPax,
          per_pax_price: z.adult_price, // simplified
          total_price: z.total_price_pkr, // total for whole group (might need per-person share?)
          // if backend expects per-person cost here, we should divide.
          // But usually nested details on person are implicit or informative.
          // Let's keep it safe:
          total_price_in_pkr: z.total_price_pkr,
          price_in_sar: 0,
          date: z.date || new Date().toISOString().split('T')[0],
          price: z.adult_price,
          is_price_pkr: true,
          riyal_rate: z.riyal_rate
        })),

        food_details: foodDetails.map(f => ({
          food: f.food,
          total_pax: totalPax,
          per_pax_price: f.adult_price,
          total_price: f.total_price_pkr,
          total_price_in_pkr: f.total_price_pkr,
          price_in_sar: 0,
          price: f.adult_price,
          is_price_pkr: true,
          riyal_rate: f.riyal_rate
        }))
      };
    });

    // Calculate total amount - TRUST THE PACKAGE TOTAL if available
    // recalculate if not (summing components)
    let finalTotalAmount = totalHotelAmount + totalTransportAmount + totalTicketAmount +
      totalVisaAmount + totalFoodAmount + totalZiaratAmount;

    // If packageData has a total_cost, use it as the source of truth for the grand total
    // (but keep component breakdowns for the API)
    if (packageData.total_cost) {
      finalTotalAmount = parseFloat(packageData.total_cost);
    }

    // Prepare final booking payload
    const bookingData = {
      hotel_details: hotelDetails,
      transport_details: transportDetails,
      ticket_details: ticketDetails,
      food_details: foodDetails,
      ziyarat_details: ziaratDetails,
      person_details: personDetails,

      booking_number: generateBookingNumber(),
      expiry_time: getExpiryTime(),

      total_pax: adultCount + childCount + infantCount,
      total_adult: adultCount,
      total_child: childCount,
      total_infant: infantCount,

      total_hotel_amount: totalHotelAmount,
      total_transport_amount: totalTransportAmount,
      total_ticket_amount: totalTicketAmount,
      total_visa_amount: totalVisaAmount,
      total_amount: finalTotalAmount, // Use the reconciled total

      // PKR/SAR specific amounts
      total_hotel_amount_pkr: totalHotelAmount * (riyalRate?.rate || 1),
      total_transport_amount_pkr: totalTransportAmount * (riyalRate?.rate || 1),
      total_ticket_amount_pkr: totalTicketAmount,
      total_visa_amount_pkr: totalVisaAmount,
      total_food_amount_pkr: totalFoodAmount, // Already in PKR
      total_ziyarat_amount_pkr: totalZiaratAmount, // Already in PKR

      // Fallback for total if needed
      total_amount: finalTotalAmount,

      is_paid: false,
      status: "Under-process",  // Using "Under-process" as requested
      payment_status: "Pending",
      is_partial_payment_allowed: false,
      category: "Package",
      booking_type: "UMRAH",
      is_full_package: true,

      user_id: parseInt(userId),
      organization_id: parseInt(orgId),
      // Only include branch_id and agency_id if they exist (optional for employees)
      ...(branchId && !isNaN(parseInt(branchId)) ? { branch_id: parseInt(branchId) } : {}),
      ...(agencyId && !isNaN(parseInt(agencyId)) ? { agency_id: parseInt(agencyId) } : {})
    };

    console.log("📦 Prepared Booking Data:", bookingData);
    console.log("📦 Booking Data (JSON):", JSON.stringify(bookingData, null, 2));
    console.log("📦 ticket_details:", bookingData.ticket_details);
    console.log("📦 person_details:", bookingData.person_details);
    return bookingData;
  };

  // Handle Make Booking button click
  const handleMakeBooking = async () => {
    setIsSubmitting(true);
    const userId = getUserId();
    const agencyId = getAgencyId();
    const branchId = getBranchId();
    const orgId = getOrgId();

    try {
      const bookingData = prepareBookingData();
      if (!bookingData) {
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem("agentAccessToken");

      console.log("🚀 Sending booking data to API...");

      // Make API call to create booking (JSON only - passport images not included)
      const response = await axios.post(
        "http://127.0.0.1:8000/api/bookings/",
        bookingData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        const result = response.data;
        console.log("✅ Booking created successfully:", result);
        toast.success(`Booking created successfully! Booking Number: ${result.booking_number}`);

        // TODO: Passport upload needs a custom backend endpoint
        // The standard bookings PATCH endpoint doesn't support nested file uploads
        // For now, passports will need to be uploaded manually via admin panel

        // Passport Upload Logic (Re-enabled per request)
        // Upload passport images for passengers who have them
        console.log("📸 Starting passport image uploads...");
        const passportUploadPromises = [];

        for (let i = 0; i < passengers.length; i++) {
          const passenger = passengers[i];
          const personDetail = result.person_details?.[i];

          if (passenger.passportFile && personDetail?.id) {
            console.log(`📸 Uploading passport for passenger ${i + 1}: ${passenger.name}`);

            // Create FormData for file upload
            const formData = new FormData();

            // Build updated person_details array - update only the current passenger with passport
            const updatedPersonDetails = result.person_details.map((person, idx) => {
              if (idx === i) {
                // This is the passenger we're updating - include all fields except passport_picture
                const { passport_picture, ...personWithoutPassport } = person;
                return personWithoutPassport;
              }
              // For other passengers, remove passport_picture field
              const { passport_picture, ...personWithoutPassport } = person;
              return personWithoutPassport;
            });

            // Append the updated person_details as JSON
            formData.append('person_details', JSON.stringify(updatedPersonDetails));

            // Append the passport file for the specific passenger index
            // Django REST Framework expects: person_details[index].field_name
            formData.append(`person_details[${i}].passport_picture`, passenger.passportFile);

            // Append required IDs to satisfy serializer validation
            if (orgId) formData.append('organization_id', orgId);
            if (userId) formData.append('user_id', userId);
            if (agencyId) formData.append('agency_id', agencyId);
            if (branchId) formData.append('branch_id', branchId);

            // Upload passport image via PATCH to update the booking
            const uploadPromise = axios.patch(
              `http://127.0.0.1:8000/api/bookings/${result.id}/`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  'Authorization': `Bearer ${token}`
                }
              }
            ).then(() => {
              console.log(`✅ Passport uploaded for ${passenger.name}`);
            }).catch((err) => {
              console.error(`❌ Failed to upload passport for ${passenger.name}:`, err);
              console.error('Error response:', err.response?.data);
              // Don't fail the entire booking if passport upload fails
            });

            passportUploadPromises.push(uploadPromise);
          }
        }

        // Wait for all passport uploads to complete
        if (passportUploadPromises.length > 0) {
          await Promise.all(passportUploadPromises);
          console.log("✅ All passport images uploaded successfully");
          toast.success(`Uploaded ${passportUploadPromises.length} passport image(s)`);
        }


        // Clear session storage after successful booking
        sessionStorage.removeItem('umrah_booknow_v1');
        sessionStorage.removeItem('umrah_passengers_v1');

        // Save booking ID for payment page
        sessionStorage.setItem('last_booking_id', result.id);

        // Navigate to payment page with booking ID
        navigate('/packages/custom-umrah/pay', {
          state: {
            bookingId: result.id,
            bookingNumber: result.booking_number,
            packageData,
            passengers
          }
        });
      } else {
        throw new Error('Booking submission failed');
      }
    } catch (error) {
      console.error('❌ Error submitting booking:', error);

      // Detailed error logging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        try {
          const pretty = JSON.stringify(error.response.data, null, 2);
          console.error('Error response (formatted):', pretty);
          toast.error(`Booking failed: ${error.response.data.detail || error.response.statusText}`);
        } catch (e) {
          toast.error('Failed to submit booking. Please try again.');
        }
      } else if (error.request) {
        console.error('Error request:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        console.error('Error message:', error.message);
        toast.error('Failed to submit booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
              {/* Step Progress */}
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
                      style={{ height: "2px", backgroundColor: "#0d6efd" }}
                    ></div>

                    {/* Step 2 (now marked complete) */}
                    <div className="d-flex align-items-center mx-4">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        2
                      </div>
                      <span className="ms-2 text-primary fw-bold">
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

              {/* Package Details Card */}
              <div className="card mb-4">
                <div className="card-body" style={{ background: "#F2F9FF" }}>
                  <div className="row">
                    <div className="col-md-8">
                      <h4 className="mb-3 fw-bold">Custom Umrah Package</h4>

                      {/* Hotel Details */}
                      <div className="mb-2">
                        <strong>Hotels:</strong>
                        {packageData.hotel_details.map((hotel, index) => (
                          <div key={index} className="small text-muted">
                            {hotel.number_of_nights} Nights at {hotel.hotel_info?.name} ({hotel.room_type}) -
                            Check-in: {formatDate(hotel.check_in_time)},
                            Check-out: {formatDate(hotel.check_out_time)}
                          </div>
                        ))}
                      </div>

                      {/* Visa Details */}
                      <div className="mb-2">
                        <strong>Visa:</strong>
                        <div className="small text-muted">
                          Adults: {packageData.total_adaults} |
                          Children: {packageData.total_children} |
                          Infants: {packageData.total_infants}
                        </div>
                      </div>

                      {/* Transport Details */}
                      <div className="mb-2">
                        <strong>Transport:</strong>
                        {packageData.transport_details.map((transport, index) => {
                          const adultPrice = transport.transport_sector_info?.adault_price || 0;
                          const childPrice = transport.transport_sector_info?.child_price || 0;
                          const infantPrice = transport.transport_sector_info?.infant_price || 0;
                          const displayAdult = riyalRate?.is_transport_pkr ? adultPrice : adultPrice * (riyalRate?.rate || 1);
                          const displayChild = riyalRate?.is_transport_pkr ? childPrice : childPrice * (riyalRate?.rate || 1);
                          const displayInfant = riyalRate?.is_transport_pkr ? infantPrice : infantPrice * (riyalRate?.rate || 1);
                          return (
                            <div key={index} className="small text-muted">
                              {transport.vehicle_type} -
                              Adult: PKR {displayAdult.toLocaleString()} |
                              Child: PKR {displayChild.toLocaleString()} |
                              Infant: PKR {displayInfant.toLocaleString()}
                            </div>
                          );
                        })}
                      </div>

                      {/* Flight Details */}
                      <div className="mb-2">
                        <strong>Flight:</strong>
                        {packageData.ticket_details.map((ticket, index) => (
                          <React.Fragment key={index}>
                            {ticket.ticket_info?.trip_details?.map((trip, tripIndex) => (
                              <div key={tripIndex} className="small text-muted">
                                {trip.trip_type === "Departure" ? "Travel Date" : "Return Date"}: {safeText(trip.departure_city)} to {safeText(trip.arrival_city)} -
                                {formatDate(trip.departure_date_time)} to {formatDate(trip.arrival_date_time)}
                              </div>
                            ))}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Food Details */}
                      {packageData.food_details?.length > 0 && (
                        <div className="mb-2">
                          <strong>Food:</strong>
                          {packageData.food_details.map((food, idx) => (
                            <div key={idx} className="small text-muted">
                              {food.food_info?.title || food.title || 'Food'} - {safeText(food.food_info?.description) || ''}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ziarat Details */}
                      {packageData.ziarat_details?.length > 0 && (
                        <div className="mb-2">
                          <strong>Ziarat:</strong>
                          {packageData.ziarat_details.map((z, idx) => (
                            <div key={idx} className="small text-muted">
                              {z.ziarat_info?.ziarat_title || z.title || 'Ziarat'} - {safeText(z.ziarat_info?.description) || ''}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <h4 className="mb-3">Prices Summary</h4>

                      {/* Prices Summary - Using stored values directly */}

                      {/* Hotel Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Hotel Prices:</div>
                        {packageData.hotel_details.map((hotel, index) => {
                          // Use total_price directly from session
                          const displayPrice = hotel.total_price || hotel.price || 0;
                          return (
                            <div key={index} className="small">
                              {hotel.hotel_info?.name} ({hotel.room_type}): {displayPrice.toLocaleString()} for {hotel.number_of_nights} nights
                            </div>
                          );
                        })}
                      </div>

                      {/* Transport Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Transport:</div>
                        {packageData.transport_details.map((transport, index) => {
                          const displayPrice = transport.price || 0; // Total calculated in step 1
                          return (
                            <div key={index} className="small">
                              {transport.vehicle_type || 'Transport'}: {displayPrice.toLocaleString()}
                            </div>
                          )
                        })}
                      </div>

                      {/* Flight Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Flight:</div>
                        {packageData.ticket_details.length > 0 ? packageData.ticket_details.map((ticket, idx) => (
                          <div key={idx} className="small">
                            Ticket {idx + 1}: {(ticket.adult_selling_price || ticket.price || 0).toLocaleString()} (est)
                          </div>
                        )) : <div className="small">N/A</div>}
                      </div>

                      {/* Visa Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Visa:</div>
                        <div className="small">
                          {(packageData.visa_total_cost || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* Food Prices */}
                      {packageData.foods_cost > 0 && (
                        <div className="mb-2">
                          <div className="small text-muted">Food:</div>
                          <div className="small">
                            PKR {(packageData.foods_cost || 0).toLocaleString()}
                          </div>
                        </div>
                      )}

                      {/* Ziarat Prices */}
                      {packageData.ziarats_cost > 0 && (
                        <div className="mb-2">
                          <div className="small text-muted">Ziarat:</div>
                          <div className="small">
                            PKR {(packageData.ziarats_cost || 0).toLocaleString()}
                          </div>
                        </div>
                      )}

                      {/* Total Price */}
                      <div className="mt-3 pt-2 border-top">
                        <h5 className="fw-bold">Total Price: PKR {totalPrice.toLocaleString()}</h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Table */}
              <div className="bg-white rounded p-4 mb-4 shadow-sm">
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
                        <th>Passport Issue Date</th>
                        <th>Passport Expiry</th>
                        <th>Country</th>
                        <th>Family</th>
                        <th>Passport Copy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((passenger, index) => {
                        const family = manualFamilies[passenger.familyIndex];
                        return (
                          <tr key={index}>
                            <td>{passenger.type}</td>
                            <td>{passenger.title}</td>
                            <td>
                              {passenger.name}
                              {passenger.isHead && (
                                <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                                  Head of Family
                                </span>
                              )}
                            </td>
                            <td>{passenger.lName}</td>
                            <td>{passenger.passportNumber}</td>
                            <td>{formatDate(passenger.passportIssue)}</td>
                            <td>{formatDate(passenger.passportExpiry)}</td>
                            <td>{passenger.country}</td>
                            <td>
                              {family ? family.name : 'N/A'}
                            </td>
                            <td>
                              {passenger.passportFile ? (
                                <Button
                                  variant="link"
                                  onClick={() => handleShowPassport(passenger.passportFile)}
                                  className="p-0"
                                >
                                  View Passport
                                </Button>
                              ) : (
                                "Not Provided"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Passport View Modal */}
              <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Passport Copy</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                  {currentPassport ? (
                    typeof currentPassport === "string" ? (
                      // If it's a URL string
                      <img
                        src={currentPassport}
                        alt="Passport"
                        style={{ maxWidth: "100%", maxHeight: "70vh" }}
                      />
                    ) : (
                      // If it's a File object
                      <img
                        src={URL.createObjectURL(currentPassport)}
                        alt="Passport"
                        style={{ maxWidth: "100%", maxHeight: "70vh" }}
                      />
                    )
                  ) : (
                    <div>No passport image available</div>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-3">
                <button
                  onClick={handleBackToEdit}
                  className="btn btn-secondary px-4"
                  disabled={isSubmitting}
                >
                  Back To Edit
                </button>
                <button
                  onClick={handleMakeBooking}
                  disabled={isSubmitting}
                  className="btn px-4"
                  id="btn"
                >
                  {isSubmitting ? 'Processing...' : 'Make Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingReview;