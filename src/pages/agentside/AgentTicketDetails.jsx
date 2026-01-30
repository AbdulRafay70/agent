import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Container, Row, Col, Card, Badge, Button, Table, Alert, Modal } from "react-bootstrap";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import {
  Plane, Calendar, MapPin, Users, CheckCircle, ArrowLeft,
  User, Mail, Phone, CreditCard, Globe, Clock, Briefcase,
  FileText, Download, Printer
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "./AgentTicketDetails.css";

const AgentTicketDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingRefId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiqsError, setAiqsError] = useState(null);
  const [aiqsRaw, setAiqsRaw] = useState(null);
  const [showAiqsModal, setShowAiqsModal] = useState(false);
  const [passportSuccess, setPassportSuccess] = useState(null);
  const [passportError, setPassportError] = useState(null);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [passportForm, setPassportForm] = useState({
    salutation: 'Mr',
    givenName: '',
    surName: '',
    birthDate: '',
    docType: '1',
    docID: '',
    segRef: '',
    docIssueCountry: 'PK',
    expiryDate: '',
    nationality: 'PK'
  });

  useEffect(() => {
    loadTicketDetails();
  }, [bookingRefId]);

  const loadTicketDetails = async () => {
    setLoading(true);
    try {
      // First check if ticket was passed via navigation state
      if (location.state?.ticket) {
        setTicket(location.state.ticket);
      } else {
        // Fetch from API and then refresh from PNR
        try {
          const token = localStorage.getItem('agentAccessToken');
          const headers = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const response = await axios.get(`http://127.0.0.1:8000/api/flights/bookings/${bookingRefId}/`, { headers });
          console.log('📥 Loaded ticket details:', response.data);

          if (response.data) {
            const booking = response.data;
            const transformedTicket = {
              id: booking.id,
              pnr: booking.pnr,
              bookingRefId: booking.booking_ref_id,
              status: booking.status,
              airlineLocator: booking.airline_locator,
              airline: booking.airline_code,
              passengerName: booking.passenger_name,
              passengerEmail: booking.passenger_email,
              passengerPhone: booking.passenger_phone,
              nationality: booking.nationality,
              passportNumber: booking.passport_number,
              passportOverride: booking.passport_override,
              dateOfBirth: booking.date_of_birth,
              origin: booking.origin,
              destination: booking.destination,
              originCity: booking.origin_city,
              destinationCity: booking.destination_city,
              departureDate: booking.departure_date,
              arrivalDate: booking.arrival_date,
              flightNumber: booking.flight_number,
              cabin: booking.cabin_class,
              baseFare: booking.base_fare,
              tax: booking.tax,
              totalFare: booking.total_fare,
              currency: booking.currency,
              segments: booking.segments,
              bookingDate: booking.booking_date
            };

            // Attempt to refresh from PNR (AIQS) and merge latest data
            try {
              const retrievePayload = {
                request: {
                  service: 'FlightRQ',
                  content: {
                    command: 'FlightRetrieveBookingRQ',
                    tripDetailRQ: { bookingRefId: transformedTicket.bookingRefId || bookingRefId }
                  }
                }
              };

              const retrieveResp = await axios.post('http://127.0.0.1:8000/api/flights/retrievePNR/', retrievePayload, { headers, validateStatus: () => true });
              console.log('🔄 RetrievePNR response:', retrieveResp.status, retrieveResp.data);

              // store aiqsRaw for UI
              if (retrieveResp.data && (retrieveResp.data.aiqs || retrieveResp.data.aiqs_error)) {
                setAiqsRaw(retrieveResp.data.aiqs || { error: retrieveResp.data.aiqs_error });
              }

              const merged = mergeRetrieveIntoTicket(transformedTicket, retrieveResp.data.aiqs || retrieveResp.data);
              setTicket(merged);
            } catch (retrieveErr) {
              console.error('RetrievePNR error, showing saved booking:', retrieveErr);
              setTicket(transformedTicket);
            }
          }
        } catch (apiError) {
          console.error('API error, trying localStorage:', apiError);
          // Fallback to localStorage
          const savedTickets = localStorage.getItem('agentBookings');
          if (savedTickets) {
            const tickets = JSON.parse(savedTickets);
            const foundTicket = tickets.find(t => t.bookingRefId === bookingRefId);
            if (foundTicket) {
              // Try to refresh PNR for the found ticket as well
              try {
                const token = localStorage.getItem('agentAccessToken');
                const headers = {};
                if (token) headers.Authorization = `Bearer ${token}`;
                const retrievePayload = {
                  request: {
                    service: 'FlightRQ',
                    content: {
                      command: 'FlightRetrieveBookingRQ',
                      tripDetailRQ: { bookingRefId: foundTicket.bookingRefId || bookingRefId }
                    }
                  }
                };
                const retrieveResp = await axios.post('http://127.0.0.1:8000/api/flights/retrievePNR/', retrievePayload, { headers, validateStatus: () => true });
                if (retrieveResp.data && (retrieveResp.data.aiqs || retrieveResp.data.aiqs_error)) {
                  setAiqsRaw(retrieveResp.data.aiqs || { error: retrieveResp.data.aiqs_error });
                }
                const merged = mergeRetrieveIntoTicket(foundTicket, retrieveResp.data.aiqs || retrieveResp.data);
                setTicket(merged);
              } catch (e) {
                setTicket(foundTicket);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
    } finally {
      setLoading(false);
    }
  };

  const safeGet = (obj, paths) => {
    for (const p of paths) {
      if (!obj) continue;
      const val = p.split('.').reduce((acc, k) => (acc && acc[k] !== undefined) ? acc[k] : undefined, obj);
      if (val !== undefined && val !== null) return val;
    }
    return undefined;
  };

  const mergeRetrieveIntoTicket = (ticketObj, retrieveData) => {
    if (!retrieveData) return ticketObj;

    // Prefer AIQS UI response if present
    const ui = safeGet(retrieveData, [
      'response.content.tripDetailsUiData.response',
      'response.content.tripDetailRS',
      'response.content',
      'response',
      ''
    ]) || retrieveData;

    // helper to safely read nested arrays
    const firstTraveler = safeGet(ui, ['travelerInfo.0', 'travelerInfo[0]']) || (ui && ui.travelerInfo && ui.travelerInfo[0]);

    // segments: prefer changedOndPairs then ondPairs then segments
    let segments = [];
    const ondGroups = safeGet(ui, ['changedOndPairs']) || safeGet(ui, ['ondPairs']) || safeGet(ui, ['segments']) || safeGet(ui, ['itinerary']);
    if (Array.isArray(ondGroups)) {
      // flatten
      ondGroups.forEach(group => {
        if (group && Array.isArray(group.segments)) {
          group.segments.forEach(s => segments.push(s));
        }
      });
    }

    // derive origin/destination from segments
    const origin = segments.length > 0 ? (segments[0].depAirport || segments[0].origin || ticketObj.origin) : ticketObj.origin;
    const destination = segments.length > 0 ? (segments[segments.length - 1].arrAirport || segments[segments.length - 1].destination || ticketObj.destination) : ticketObj.destination;
    const departureDate = segments.length > 0 ? (segments[0].depDate || segments[0].departureDate || ticketObj.departureDate) : ticketObj.departureDate;
    const arrivalDate = segments.length > 0 ? (segments[segments.length - 1].arrDate || segments[segments.length - 1].arrivalDate || ticketObj.arrivalDate) : ticketObj.arrivalDate;

    const fareObj = safeGet(ui, ['fare']) || safeGet(ui, ['costBreakuppax.0']) || safeGet(ui, ['fareDetails']) || {};
    const baseFare = fareObj.baseFare || fareObj.baseFare || fareObj.base || ticketObj.baseFare;
    const tax = fareObj.tax || fareObj.tax || fareObj.taxes || ticketObj.tax;
    const totalFare = fareObj.total || fareObj.totalFare || fareObj.totalFare || ticketObj.totalFare;
    const currency = fareObj.currency || ticketObj.currency;

    // attempt to pull traveler info from several possible locations
    const traveler = safeGet(ui, ['travelerInfo.0', 'travelerInfo[0]'])
      || safeGet(ui, ['updatePnrRS.travelerInfo.0', 'updatePnrRS.travelerInfo[0]'])
      || safeGet(ui, ['travelerInfo']) && (Array.isArray(safeGet(ui, ['travelerInfo'])) ? safeGet(ui, ['travelerInfo'])[0] : undefined)
      || (ui && ui.updatePnrRS && ui.updatePnrRS.travelerInfo && ui.updatePnrRS.travelerInfo[0]);

    const mapped = {
      pnr: safeGet(ui, ['pnr']) || safeGet(ui, ['PNR']) || ticketObj.pnr,
      status: safeGet(ui, ['bookingStatusName']) || safeGet(ui, ['bookingStatus']) || ticketObj.status,
      airlineLocator: safeGet(ui, ['airlineLocator']) || ticketObj.airlineLocator,
      passengerName: (traveler && ((traveler.givenName || traveler.given_name) ? `${traveler.givenName || traveler.given_name} ${traveler.surName || traveler.sur_name || ''}`.trim() : traveler.name)) || (firstTraveler && ((firstTraveler.givenName || firstTraveler.given_name) ? `${firstTraveler.givenName || firstTraveler.given_name} ${firstTraveler.surName || firstTraveler.sur_name || ''}`.trim() : firstTraveler.name)) || ticketObj.passengerName,
      passengerEmail: firstTraveler && (safeGet(firstTraveler, ['contact.emailList.0.emailId', 'contact.emailList[0].emailId']) || safeGet(firstTraveler, ['contact.email', 'email'])) || ticketObj.passengerEmail,
      passengerPhone: firstTraveler && (safeGet(firstTraveler, ['contact.phoneList.0.number', 'contact.phoneList[0].number']) || safeGet(firstTraveler, ['contact.phone', 'phone'])) || ticketObj.passengerPhone,
      origin,
      destination,
      departureDate,
      arrivalDate,
      segments: segments.length > 0 ? segments : (ticketObj.segments || []),
      baseFare,
      tax,
      totalFare,
      currency,
      bookingDate: safeGet(ui, ['bookingDate']) || ticketObj.bookingDate
    };

    // map passport/traveler-specific fields into ticket
    if (traveler) {
      mapped.passportNumber = ticketObj.passportOverride || ticketObj.passportNumber || traveler.documentNumber || traveler.docID || traveler.passportNumber || ticketObj.passportNumber;
      mapped.passportOverride = ticketObj.passportOverride || traveler.documentNumber || traveler.docID || traveler.passportNumber || null;
      mapped.nationality = ticketObj.nationality || traveler.nationality || ticketObj.nationality;
      mapped.dateOfBirth = ticketObj.dateOfBirth || traveler.birthDate || ticketObj.dateOfBirth;
      mapped.passportExpiry = ticketObj.passportExpiry || traveler.expiryDate || traveler.expiry_date || ticketObj.expiryDate;
      mapped.salutation = ticketObj.salutation || traveler.salutation || ticketObj.salutation;
    }

    return { ...ticketObj, ...mapped };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    if (time.includes(':')) return time;
    return `${time.slice(0, 2)}:${time.slice(2)}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'HK': { variant: 'success', text: 'Confirmed', icon: CheckCircle },
      'UC': { variant: 'warning', text: 'Pending', icon: Clock },
      'XX': { variant: 'danger', text: 'Cancelled', icon: FileText }
    };
    const statusInfo = statusMap[status] || { variant: 'secondary', text: status || 'Unknown', icon: FileText };
    const Icon = statusInfo.icon;
    return (
      <Badge bg={statusInfo.variant} className="p-2">
        <Icon size={16} className="me-1" />
        {statusInfo.text}
      </Badge>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a downloadable text file with ticket details
    const ticketText = `
FLIGHT TICKET
=============

PNR: ${ticket.pnr}
Booking Reference: ${ticket.bookingRefId}
Status: ${ticket.status}

PASSENGER DETAILS
-----------------
Name: ${ticket.passengerName}
Email: ${ticket.passengerEmail}
Phone: ${ticket.passengerPhone}

FLIGHT DETAILS
--------------
From: ${ticket.origin} (${ticket.originCity})
To: ${ticket.destination} (${ticket.destinationCity})
Date: ${formatDate(ticket.departureDate)}
Airline: ${ticket.airline}
Airline Locator: ${ticket.airlineLocator}

FARE BREAKDOWN
--------------
Base Fare: ${ticket.currency} ${ticket.baseFare}
Tax: ${ticket.currency} ${ticket.tax}
Total: ${ticket.currency} ${ticket.totalFare}

Booked on: ${formatDate(ticket.bookingDate)}
    `;

    const blob = new Blob([ticketText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.pnr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildRetrievePayload = (bookingRef) => ({
    request: {
      service: 'FlightRQ',
      content: {
        command: 'FlightRetrieveBookingRQ',
        supplierSpecific: {
          traceId: '3c34f4cf-40a2-4fde-8a4c-c18654f30dcd',
          segIdEqpTypeMap: { '0-0': '359' },
          depTerminalMap: { '0-0': '1' },
          arrTerminalMap: { '0-0': '3' },
          brandTier: '0-0004'
        },
        tripDetailRQ: { bookingRefId: bookingRef }
      },
      node: { agencyCode: 'CLI_11078' },
      selectCredential: { id: 33, officeIdList: [{ id: 24 }] },
      supplierCodes: [2]
    }
  });

  const normalizeToDDMMYYYY = (d) => {
    if (!d) return d;
    // already in DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return d;
    // try ISO or other parseable formats
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const findSegRefInAiqs = (raw) => {
    if (!raw) return undefined;
    const seen = new Set();
    const stack = [raw];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      if (seen.has(node)) continue;
      seen.add(node);
      if (node.segRef && typeof node.segRef === 'string') return node.segRef;
      // also check keys that may hold segRef like supplierSpecific
      if (node.supplierSpecific && typeof node.supplierSpecific === 'object' && node.supplierSpecific.segRef) return node.supplierSpecific.segRef;
      for (const k of Object.keys(node)) {
        try {
          stack.push(node[k]);
        } catch {
          // ignore
        }
      }
    }
    return undefined;
  };

  const buildUpdatePassportPayload = (bookingRef, form) => {
    // Prefer using exact supplierSpecific returned by RetrievePNR when available
    const fromRetrieve = aiqsRaw && (aiqsRaw.response?.content?.tripDetailsUiData?.response?.supplierSpecific || aiqsRaw.response?.content?.supplierSpecific || aiqsRaw.response?.content?.tripDetailRS?.supplierSpecific);
    const supplierSpecific = (fromRetrieve && typeof fromRetrieve === 'object') ? { ...fromRetrieve } : (() => {
      const base = {
        traceId: '3c34f4cf-40a2-4fde-8a4c-c18654f30dcd',
        segIdEqpTypeMap: { '0-0': '359' },
        depTerminalMap: { '0-0': '1' },
        arrTerminalMap: { '0-0': '3' }
      };
      if (form.segRef) {
        base.segRef = form.segRef;
        base.availabilitySourceMap = { [form.segRef]: 'S' };
      }
      return base;
    })();

    // Ensure segRef is present: try to discover it anywhere in aiqsRaw
    let segRefValue = (supplierSpecific && supplierSpecific.segRef) || form.segRef || findSegRefInAiqs(aiqsRaw);
    if (segRefValue && (!supplierSpecific.segRef)) {
      supplierSpecific.segRef = segRefValue;
      supplierSpecific.availabilitySourceMap = supplierSpecific.availabilitySourceMap || { [segRefValue]: 'S' };
    }

    const normalizedBirth = normalizeToDDMMYYYY(form.birthDate);
    const normalizedExpiry = normalizeToDDMMYYYY(form.expiryDate);

    return {
      request: {
        service: 'FlightRQ',
        content: {
          command: 'FlightUpdatePassportRQ',
          supplierSpecific,
          updatePnrRQ: {
            bookingRefId: bookingRef,
            travelerInfo: [
              {
                paxType: 'ADT',
                gender: form.gender || 'Male',
                salutation: form.salutation,
                givenName: form.givenName,
                surName: form.surName,
                birthDate: normalizedBirth,
                docType: form.docType,
                docID: form.docID,
                documentNumber: form.docID,
                passportNumber: form.docID,
                docIssueCountry: form.docIssueCountry,
                expiryDate: normalizedExpiry,
                nationality: form.nationality
              }
            ]
          }
        },
        node: { agencyCode: 'CLI_11078' },
        selectCredential: { id: 33, officeIdList: [{ id: 24 }] },
        supplierCodes: [2]
      }
    };
  };


  const openPassportModal = () => {
    // Prefill from ticket if available
    const name = ticket?.passengerName || '';
    const parts = name.split(' ');
    const fromRetrieveSegRef = aiqsRaw && (aiqsRaw.response?.content?.tripDetailsUiData?.response?.supplierSpecific?.segRef || aiqsRaw.response?.content?.supplierSpecific?.segRef || aiqsRaw.response?.content?.tripDetailRS?.supplierSpecific?.segRef);
    setPassportForm(prev => ({
      ...prev,
      givenName: parts.slice(0, -1).join(' ') || parts[0] || '',
      surName: parts.slice(-1).join('') || '',
      docID: ticket?.passportOverride || ticket?.passportNumber || prev.docID,
      birthDate: normalizeToDDMMYYYY(ticket?.dateOfBirth) || prev.birthDate,
      expiryDate: normalizeToDDMMYYYY(ticket?.expiryDate) || prev.expiryDate,
      nationality: ticket?.nationality || prev.nationality,
      segRef: prev.segRef || fromRetrieveSegRef || ''
    }));
    setShowPassportModal(true);
  };

  const handlePassportFormChange = (field, value) => {
    setPassportForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePassportUpdateSubmit = async () => {
    if (!ticket) return;
    setRefreshing(true);
    try {
      const token = localStorage.getItem('agentAccessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      // Ensure we have up-to-date supplierSpecific (segRef) from RetrievePNR when possible
      const hasSegRef = passportForm.segRef || findSegRefInAiqs(aiqsRaw);
      if (!hasSegRef) {
        try {
          const retrievePayload = buildRetrievePayload(ticket.bookingRefId || bookingRefId);
          const retrieveResp = await axios.post('http://127.0.0.1:8000/api/flights/retrievePNR/', retrievePayload, { headers, validateStatus: () => true });
          if (retrieveResp.data && (retrieveResp.data.aiqs || retrieveResp.data)) {
            const newAiqs = retrieveResp.data.aiqs || retrieveResp.data;
            setAiqsRaw(newAiqs);
          }
        } catch (e) {
          console.warn('Failed to refresh RetrievePNR before UpdatePassport:', e);
        }
      }

      const payload = buildUpdatePassportPayload(ticket.bookingRefId || bookingRefId, passportForm);
      const resp = await axios.post('http://127.0.0.1:8000/api/flights/updatePassport/', payload, { headers, validateStatus: () => true });
      console.log('UpdatePassport response:', resp.status, resp.data);

      if (resp.data && resp.data.aiqs) setAiqsRaw(resp.data.aiqs);
      if (resp.data && resp.data.text) setAiqsRaw({ text: resp.data.text });

      // If AIQS returned a JSON wrapper, check for AIQS-level errors
      const aiqsResp = resp.data && resp.data.aiqs ? resp.data.aiqs : resp.data;
      const aiqsErrorMsg = aiqsResp && aiqsResp.response && aiqsResp.response.content && aiqsResp.response.content.error && (aiqsResp.response.content.error.message || aiqsResp.response.content.error);

      if (aiqsErrorMsg) {
        // Supplier rejected update; surface exact AIQS error and do NOT refresh PNR
        setPassportError(aiqsErrorMsg);
        setAiqsError(aiqsErrorMsg);
        console.warn('AIQS updatePassport error:', aiqsErrorMsg);
      } else if (resp.status >= 200 && resp.status < 300) {
        // Optimistically update ticket fields from the form
        setTicket(prev => ({
          ...prev,
          passportNumber: passportForm.docID || prev.passportNumber,
          passportOverride: passportForm.docID || prev.passportOverride,
          nationality: passportForm.nationality || prev.nationality,
          dateOfBirth: passportForm.birthDate || prev.dateOfBirth,
          passengerName: passportForm.givenName && passportForm.surName ? `${passportForm.givenName} ${passportForm.surName}` : prev.passengerName
        }));

        // Clear any previous AIQS error and show success banner briefly
        setAiqsError(null);
        setPassportError(null);
        setPassportSuccess('Passport update submitted. Refreshing PNR...');

        // After successful update, refresh PNR and persist
        await handleUpdateClick();
        // hide success after refresh
        setTimeout(() => setPassportSuccess(null), 4000);
      } else {
        const errText = resp.data && resp.data.text ? resp.data.text : `AIQS returned status ${resp.status}`;
        setAiqsError(errText);
        setPassportError(errText);
      }

      setShowPassportModal(false);
    } catch (err) {
      console.error('Passport update failed:', err);
      alert('Passport update failed. See console for details.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateClick = async () => {
    if (!ticket) return;
    setRefreshing(true);
    try {
      const token = localStorage.getItem('agentAccessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const payload = buildRetrievePayload(ticket.bookingRefId || bookingRefId);
      const resp = await axios.post('http://127.0.0.1:8000/api/flights/retrievePNR/?save=true', payload, { headers, validateStatus: () => true });
      console.log('Update PNR response:', resp.status, resp.data);

      // If server returned savedBooking, reflect its values
      if (resp.data && resp.data.savedBooking) {
        // merge savedBooking into state first
        setTicket(prev => ({ ...prev, ...resp.data.savedBooking }));
      }

      // Merge AIQS payload if present (even if AIQS returned an error)
      const aiqsPayload = resp.data && (resp.data.aiqs || resp.data);
      if (aiqsPayload) {
        // merge against the latest state to avoid overwriting savedBooking with stale ticket
        setTicket(prev => mergeRetrieveIntoTicket(prev, aiqsPayload));
      }

      // Show AIQS error text if returned
      if (resp.data && resp.data.aiqs_error) {
        setAiqsError(resp.data.aiqs_error);
      } else {
        setAiqsError(null);
      }
    } catch (err) {
      console.error('Failed to update PNR:', err);
      alert('Failed to update PNR. See console for details.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex">
        <AgentSidebar />
        <div className="flex-fill">
          <AgentHeader />
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="d-flex">
        <AgentSidebar />
        <div className="flex-fill">
          <AgentHeader />
          <Container className="py-5">
            <Alert variant="warning">
              <h5>Ticket Not Found</h5>
              <p>The requested ticket could not be found.</p>
              <Button variant="primary" onClick={() => navigate('/agent/tickets')}>
                <ArrowLeft size={18} className="me-2" />
                Back to Tickets
              </Button>
            </Alert>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <AgentSidebar />
      <div className="flex-fill">
        <AgentHeader />
        <div className="agent-ticket-details-wrapper">
          <Container fluid className="py-4">
            {/* Header Actions */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Button variant="outline-primary" onClick={() => navigate('/agent/tickets')}>
                <ArrowLeft size={18} className="me-2" />
                Back to Tickets
              </Button>
              <div>
                <Button variant="outline-secondary" className="me-2" onClick={handleDownload}>
                  <Download size={18} className="me-2" />
                  Download
                </Button>
                <Button variant="outline-secondary" onClick={handlePrint}>
                  <Printer size={18} className="me-2" />
                  Print
                </Button>
              </div>
            </div>

            {/* AIQS Error */}
            {aiqsError && (
              <Alert variant="warning" className="shadow-sm">
                <strong>AIQS Error:</strong> {aiqsError}
              </Alert>
            )}

            {passportSuccess && (
              <Alert variant="success" className="shadow-sm">
                {passportSuccess}
              </Alert>
            )}

            {passportError && (
              <Alert variant="danger" className="shadow-sm">
                <strong>Passport Update Error:</strong> {passportError}
              </Alert>
            )}

            {/* AIQS Summary */}
            {aiqsRaw && (
              <Card className="mb-3">
                <Card.Body>
                  <Row>
                    <Col md={8}>
                      <h6 className="mb-2">AIQS Update Summary</h6>
                      <div className="small text-muted">
                        <div><strong>Warning:</strong> {aiqsRaw?.response?.content?.warning?.message || '—'}</div>
                        <div><strong>PNR:</strong> {aiqsRaw?.response?.content?.tripDetailRS?.pnr || aiqsRaw?.response?.content?.tripDetailsUiData?.response?.pnr || '—'}</div>
                        <div><strong>Status:</strong> {aiqsRaw?.response?.content?.tripDetailsUiData?.response?.bookingStatusName || aiqsRaw?.response?.content?.tripDetailRS?.bookingStatus || ticket.status}</div>
                        <div><strong>Fare:</strong> {aiqsRaw?.response?.content?.tripDetailsUiData?.response?.fare ? `${aiqsRaw.response.content.tripDetailsUiData.response.fare.total} ${aiqsRaw.response.content.tripDetailsUiData.response.fare.currency}` : '—'}</div>
                        <div><strong>Lead Passenger:</strong> {aiqsRaw?.response?.content?.tripDetailsUiData?.response?.travelerInfo?.[0]?.givenName ? `${aiqsRaw.response.content.tripDetailsUiData.response.travelerInfo[0].givenName} ${aiqsRaw.response.content.tripDetailsUiData.response.travelerInfo[0].surName}` : '—'}</div>
                        <div><strong>Itinerary Changes:</strong> {Array.isArray(aiqsRaw?.response?.content?.tripDetailsUiData?.response?.itineraryChanges) ? aiqsRaw.response.content.tripDetailsUiData.response.itineraryChanges.join('; ') : '—'}</div>
                      </div>
                    </Col>
                    <Col md={4} className="text-end">
                      <Button variant="outline-secondary" size="sm" onClick={() => setShowAiqsModal(true)}>View AIQS Raw</Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            <Alert variant="success" className="shadow-sm">
              <Row className="align-items-center">
                <Col md={1} className="text-center">
                  <CheckCircle size={48} className="text-success" />
                </Col>
                <Col md={11}>
                  <h4 className="mb-2">🎉 Congratulations! Your Booking is Confirmed</h4>
                  <p className="mb-0">
                    Your flight ticket has been successfully booked. Your PNR is <strong>{ticket.pnr}</strong>.
                    Please save this information for your records.
                  </p>
                </Col>
              </Row>
            </Alert>

            {/* Ticket Card */}
            <Card className="shadow-sm border-0 mb-4 ticket-detail-card">
              <Card.Header className="bg-primary text-white">
                <Row className="align-items-center">
                  <Col md={6}>
                    <h4 className="mb-0">
                      <Plane size={24} className="me-2" />
                      Flight Ticket
                    </h4>
                  </Col>
                  <Col md={6} className="text-end d-flex justify-content-end align-items-center">
                    {getStatusBadge(ticket.status)}
                    <Button variant="outline-info" size="sm" className="ms-3" onClick={() => handleUpdateClick()} disabled={refreshing}>
                      {refreshing ? 'Updating...' : 'Update'}
                    </Button>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body className="p-4">
                {/* PNR and Booking Reference */}
                <Row className="mb-4 pb-4 border-bottom">
                  <Col md={6}>
                    <div className="mb-3">
                      <small className="text-muted d-block">PNR (Passenger Name Record)</small>
                      <div className="d-flex align-items-center">
                        <h2 className="text-primary mb-0">{ticket.pnr}</h2>
                        <Button variant="outline-info" size="sm" className="ms-3" onClick={() => handleUpdateClick()} disabled={refreshing}>
                          {refreshing ? 'Updating...' : 'Update'}
                        </Button>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <small className="text-muted d-block">Booking Reference</small>
                      <h5 className="mb-0">{ticket.bookingRefId}</h5>
                    </div>
                    {ticket.airlineLocator && (
                      <div>
                        <small className="text-muted d-block">Airline Locator</small>
                        <h5 className="mb-0">{ticket.airlineLocator}</h5>
                      </div>
                    )}
                  </Col>
                </Row>

                {/* Flight Route */}
                <Row className="mb-4 pb-4 border-bottom">
                  <Col md={12}>
                    <h5 className="mb-3">
                      <MapPin size={20} className="me-2 text-primary" />
                      Flight Route
                    </h5>
                  </Col>
                  <Col md={5}>
                    <Card className="bg-light border-0">
                      <Card.Body>
                        <h6 className="text-muted mb-2">Departure</h6>
                        <h3 className="mb-1">{ticket.origin}</h3>
                        <p className="text-muted mb-0">{ticket.originCity || 'Origin City'}</p>
                        {ticket.departureDate && (
                          <div className="mt-3">
                            <Calendar size={16} className="me-2 text-primary" />
                            <small>{formatDate(ticket.departureDate)}</small>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={2} className="d-flex align-items-center justify-content-center">
                    <Plane size={32} className="text-primary" />
                  </Col>
                  <Col md={5}>
                    <Card className="bg-light border-0">
                      <Card.Body>
                        <h6 className="text-muted mb-2">Arrival</h6>
                        <h3 className="mb-1">{ticket.destination}</h3>
                        <p className="text-muted mb-0">{ticket.destinationCity || 'Destination City'}</p>
                        {ticket.arrivalDate && (
                          <div className="mt-3">
                            <Calendar size={16} className="me-2 text-primary" />
                            <small>{formatDate(ticket.arrivalDate)}</small>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Passenger Details */}
                <Row className="mb-4 pb-4 border-bottom">
                  <Col md={12}>
                    <h5 className="mb-3">
                      <User size={20} className="me-2 text-primary" />
                      Passenger Information
                    </h5>
                  </Col>
                  <Col md={6}>
                    <Table borderless size="sm">
                      <tbody>
                        <tr>
                          <td className="text-muted"><User size={16} className="me-2" />Name:</td>
                          <td><strong>{ticket.passengerName}</strong></td>
                        </tr>
                        <tr>
                          <td className="text-muted"><Mail size={16} className="me-2" />Email:</td>
                          <td>{ticket.passengerEmail || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted"><Phone size={16} className="me-2" />Phone:</td>
                          <td>{ticket.passengerPhone || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <Table borderless size="sm">
                      <tbody>
                        <tr>
                          <td className="text-muted"><Globe size={16} className="me-2" />Nationality:</td>
                          <td>{ticket.nationality || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted"><CreditCard size={16} className="me-2" />Passport:</td>
                          <td>
                            {ticket.passportNumber || 'N/A'}
                            <Button variant="outline-primary" size="sm" className="ms-3" onClick={openPassportModal}>
                              Update Passport
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted"><Calendar size={16} className="me-2" />Date of Birth:</td>
                          <td>{ticket.dateOfBirth || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>

                {/* Airline Details */}
                <Row className="mb-4 pb-4 border-bottom">
                  <Col md={12}>
                    <h5 className="mb-3">
                      <Plane size={20} className="me-2 text-primary" />
                      Airline Information
                    </h5>
                  </Col>
                  <Col md={12}>
                    <Table borderless>
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: '200px' }}>Airline Code:</td>
                          <td><Badge bg="secondary">{ticket.airline}</Badge></td>
                        </tr>
                        {ticket.flightNumber && (
                          <tr>
                            <td className="text-muted">Flight Number:</td>
                            <td><strong>{ticket.flightNumber}</strong></td>
                          </tr>
                        )}
                        {ticket.cabin && (
                          <tr>
                            <td className="text-muted">Cabin Class:</td>
                            <td><Badge bg="info">{ticket.cabin}</Badge></td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Col>
                </Row>

                {/* Fare Breakdown */}
                <Row className="mb-4 pb-4 border-bottom">
                  <Col md={12}>
                    <h5 className="mb-3">
                      <CreditCard size={20} className="me-2 text-primary" />
                      Fare Breakdown
                    </h5>
                  </Col>
                  <Col md={6}>
                    <Table bordered>
                      <tbody>
                        <tr>
                          <td className="text-muted">Base Fare</td>
                          <td className="text-end">
                            <strong>{ticket.currency} {parseFloat(ticket.baseFare || 0).toLocaleString()}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted">Taxes & Fees</td>
                          <td className="text-end">
                            <strong>{ticket.currency} {parseFloat(ticket.tax || 0).toLocaleString()}</strong>
                          </td>
                        </tr>
                        <tr className="table-success">
                          <td><strong>Total Amount</strong></td>
                          <td className="text-end">
                            <h5 className="mb-0 text-success">
                              {ticket.currency} {parseFloat(ticket.totalFare || 0).toLocaleString()}
                            </h5>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>

                {/* Flight Segments */}
                {ticket.segments && ticket.segments.length > 0 && (
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5 className="mb-3">
                        <Briefcase size={20} className="me-2 text-primary" />
                        Flight Segments
                      </h5>
                    </Col>
                    <Col md={12}>
                      {ticket.segments.map((segment, index) => (
                        <Card key={index} className="mb-3 border">
                          <Card.Body>
                            <h6 className="text-primary">Segment {index + 1}</h6>
                            <Row>
                              <Col md={3}>
                                <small className="text-muted d-block">Departure</small>
                                <strong>{segment.depAirport}</strong>
                                <div>{formatTime(segment.depTime)}</div>
                                <small>{segment.depDate}</small>
                              </Col>
                              <Col md={3}>
                                <small className="text-muted d-block">Arrival</small>
                                <strong>{segment.arrAirport}</strong>
                                <div>{formatTime(segment.arrTime)}</div>
                                <small>{segment.arrDate}</small>
                              </Col>
                              <Col md={3}>
                                <small className="text-muted d-block">Flight</small>
                                <strong>{segment.mktgAirline} {segment.flightNo}</strong>
                              </Col>
                              <Col md={3}>
                                <small className="text-muted d-block">Duration</small>
                                <strong>{segment.duration || 'N/A'}</strong>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </Col>
                  </Row>
                )}

                {/* Booking Information */}
                <Row>
                  <Col md={12}>
                    <Card className="bg-light border-0">
                      <Card.Body>
                        <small className="text-muted d-block mb-2">
                          <Clock size={14} className="me-1" />
                          Booked on: {formatDate(ticket.bookingDate)}
                        </small>
                        <small className="text-muted d-block">
                          <FileText size={14} className="me-1" />
                          This is an electronic ticket. Please carry a valid photo ID for check-in.
                        </small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Important Information */}
            <Alert variant="info">
              <h6>
                <FileText size={18} className="me-2" />
                Important Information
              </h6>
              <ul className="mb-0">
                <li>Please arrive at the airport at least 3 hours before international flights and 2 hours before domestic flights.</li>
                <li>Carry a valid photo ID and passport (for international travel).</li>
                <li>Check baggage allowance and restrictions with your airline.</li>
                <li>This e-ticket is non-transferable.</li>
                <li>Contact the airline directly for any changes or cancellations.</li>
              </ul>
            </Alert>
            {showAiqsModal && (
              <Modal show={showAiqsModal} onHide={() => setShowAiqsModal(false)} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>AIQS Raw Response</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <pre style={{ maxHeight: '60vh', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify(aiqsRaw, null, 2)}</pre>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowAiqsModal(false)}>Close</Button>
                </Modal.Footer>
              </Modal>
            )}
            {showPassportModal && (
              <Modal show={showPassportModal} onHide={() => setShowPassportModal(false)} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Update Passport</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Row className="g-3">
                    <Col md={4}>
                      <label className="form-label">Salutation</label>
                      <select className="form-control" value={passportForm.salutation} onChange={e => handlePassportFormChange('salutation', e.target.value)}>
                        <option>Mr</option>
                        <option>Mrs</option>
                        <option>Ms</option>
                      </select>
                    </Col>
                    <Col md={4}>
                      <label className="form-label">Given Name</label>
                      <input className="form-control" value={passportForm.givenName} onChange={e => handlePassportFormChange('givenName', e.target.value)} />
                    </Col>
                    <Col md={4}>
                      <label className="form-label">Surname</label>
                      <input className="form-control" value={passportForm.surName} onChange={e => handlePassportFormChange('surName', e.target.value)} />
                    </Col>
                    <Col md={4}>
                      <label className="form-label">Birth Date</label>
                      <input className="form-control" value={passportForm.birthDate} onChange={e => handlePassportFormChange('birthDate', e.target.value)} placeholder="DD-MM-YYYY" />
                    </Col>
                    <Col md={4}>
                      <label className="form-label">Passport Number</label>
                      <input className="form-control" value={passportForm.docID} onChange={e => handlePassportFormChange('docID', e.target.value)} />
                    </Col>
                    <Col md={4}>
                      <label className="form-label">Nationality</label>
                      <input className="form-control" value={passportForm.nationality} onChange={e => handlePassportFormChange('nationality', e.target.value)} />
                    </Col>
                    <Col md={4}>
                      <label className="form-label">Issue Country</label>
                      <input className="form-control" value={passportForm.docIssueCountry} onChange={e => handlePassportFormChange('docIssueCountry', e.target.value)} />
                    </Col>
                    <Col md={4}>
                      <label className="form-label">Expiry Date</label>
                      <input className="form-control" value={passportForm.expiryDate} onChange={e => handlePassportFormChange('expiryDate', e.target.value)} placeholder="DD-MM-YYYY" />
                    </Col>
                  </Row>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowPassportModal(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handlePassportUpdateSubmit} disabled={refreshing}>{refreshing ? 'Updating...' : 'Submit'}</Button>
                </Modal.Footer>
              </Modal>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default AgentTicketDetails;
