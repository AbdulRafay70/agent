import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Tabs, Tab, Card, Badge, Accordion, Row, Col } from 'react-bootstrap';
import { FileText, AlertCircle, RefreshCw, DollarSign, Briefcase, XCircle, Info, Clock, MapPin, Users, Tag } from 'lucide-react';
import axios from 'axios';

// Long timeout constant for slow remote validation
const AXIOS_LONG_TIMEOUT = 120000;

// Custom styles for fare rules
const fareRulesStyles = `
<style>
.fare-rules-modal .modal-dialog {
  max-width: 95vw;
}

.fare-rule-content {
  font-size: 0.9rem;
  line-height: 1.5;
}

.fare-rule-line {
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.fare-rule-line.important {
  font-weight: 600;
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 0.25rem 0;
}

.fare-rule-line.amount {
  font-weight: 600;
  color: #198754;
  background-color: rgba(25, 135, 84, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
  margin: 0.25rem 0;
}

.segment-card {
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  overflow: hidden;
}

.segment-header {
  border-bottom: 1px solid #dee2e6;
}

.quick-overview .overview-item {
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
}

.fare-accordion .accordion-item {
  border: 1px solid #e9ecef;
  margin-bottom: 0.5rem;
  border-radius: 0.375rem !important;
}

.fare-accordion .accordion-button {
  background-color: #f8f9fa;
  border: none;
  font-weight: 600;
  color: #495057;
}

.fare-accordion .accordion-button:not(.collapsed) {
  background-color: #e9ecef;
  color: #212529;
}

.fare-accordion .accordion-body {
  background-color: #ffffff;
  border-top: 1px solid #e9ecef;
}

.fare-rule-body {
  max-height: 300px;
  overflow-y: auto;
}
</style>
`;

// Inject styles into head
if (typeof document !== 'undefined' && !document.getElementById('fare-rules-styles')) {
  const styleElement = document.createElement('div');
  styleElement.innerHTML = fareRulesStyles;
  styleElement.id = 'fare-rules-styles';
  document.head.appendChild(styleElement);
}

const FareRulesModal = ({ show, onHide, flight, sealed }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fareRules, setFareRules] = useState(null);

  useEffect(() => {
    if (show && flight) {
      fetchFareRules();
    }
  }, [show, flight]);

  const fetchFareRules = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('idToken') || localStorage.getItem('agentAccessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Step 1: If no sealed token, validate the flight first
      let sealedToken = sealed || flight.supplierSpecific?.sealed;

      if (!sealedToken) {
        console.log('🔒 No sealed token found, validating flight first...');

        // Build validate payload and include the AIQS token used during search
        const validatePayload = {
          flightData: flight,
          token: token // prefer client-side token (the one used during search)
        };

        const validateRes = await axios.post(
          'http://127.0.0.1:8000/api/flights/validate/',
          validatePayload,
          { headers, timeout: AXIOS_LONG_TIMEOUT }
        );

        sealedToken = validateRes.data?.sealed ||
          validateRes.data?.response?.content?.validateFareResponse?.sealed ||
          validateRes.data?.response?.content?.sealed;

        if (!sealedToken) {
          throw new Error('Unable to validate flight - sealed token not received');
        }

        console.log('✅ Flight validated, sealed token obtained');
      }

      // Step 2: Fetch fare rules with sealed token
      const response = await axios.post(
        'http://127.0.0.1:8000/api/flights/fare-rules/',
        {
          flightData: flight,
          sealed: sealedToken,
          token: token
        },
        { headers, timeout: 30000 }
      );

      console.log('Fare rules response:', response.data);

      // Backend returns array of segments with rules
      const rulesData = response.data.rules || [];
      setFareRules(rulesData);
    } catch (err) {
      console.error('Fare rules error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load fare rules');
    } finally {
      setLoading(false);
    }
  };

  const formatRuleText = (text) => {
    if (!text) return <span className="text-muted">Not available</span>;

    // Split by actual newlines and format with better styling
    const lines = text.split('\n').filter(line => line.trim());

    return (
      <div className="fare-rule-content">
        {lines.map((line, index) => {
          // Check for important keywords to highlight
          const isImportant = /\b(CHARGE|WAIVED|PERMITTED|NOT PERMITTED|REQUIRED|PROHIBITED|NOTE|WARNING)\b/i.test(line);
          const isAmount = /\b(USD|EGP|EUR|GBP)\s*\d+/i.test(line);

          return (
            <div key={index} className={`fare-rule-line ${isImportant ? 'important' : ''} ${isAmount ? 'amount' : ''}`}>
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const getRulesByCategory = (segment, categories) => {
    if (!segment || !segment.rules) return null;

    // Find rules matching any of the category names
    const matchingRules = segment.rules.filter(rule =>
      categories.some(cat => rule.category.toUpperCase().includes(cat.toUpperCase()))
    );

    if (matchingRules.length === 0) return null;

    // Combine all matching rule texts
    return matchingRules.map(rule => rule.text).join('\n\n');
  };

  const getCategoryIcon = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes('penalties') || cat.includes('cancellation')) return <XCircle size={18} className="text-danger" />;
    if (cat.includes('changes') || cat.includes('reissue')) return <RefreshCw size={18} className="text-warning" />;
    if (cat.includes('refund')) return <DollarSign size={18} className="text-success" />;
    if (cat.includes('restrictions') || cat.includes('blackout')) return <AlertCircle size={18} className="text-danger" />;
    if (cat.includes('children') || cat.includes('discount')) return <Users size={18} className="text-info" />;
    if (cat.includes('baggage')) return <Briefcase size={18} className="text-primary" />;
    if (cat.includes('advance') || cat.includes('reservation')) return <Clock size={18} className="text-secondary" />;
    if (cat.includes('stopover') || cat.includes('transfer')) return <MapPin size={18} className="text-primary" />;
    return <Info size={18} className="text-muted" />;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="fare-rules-modal">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FileText size={24} className="me-2" />
          Fare Rules & Conditions
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Loading fare rules...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="d-flex align-items-center">
            <AlertCircle size={20} className="me-3" />
            <div>
              <strong>Error loading fare rules:</strong> {error}
              <Button variant="outline-danger" size="sm" className="mt-2 ms-3" onClick={fetchFareRules}>
                <RefreshCw size={16} className="me-1" />
                Try Again
              </Button>
            </div>
          </Alert>
        ) : fareRules && fareRules.length > 0 ? (
          <div className="fare-rules-container">
            {fareRules.map((segment, segmentIndex) => (
              <div key={segmentIndex} className="segment-card mb-4">
                <div className="segment-header bg-light p-3 rounded-top">
                  <h5 className="mb-0 text-primary d-flex align-items-center">
                    <MapPin size={20} className="me-2" />
                    {segment.segment}
                    <Badge bg="secondary" className="ms-2" pill>
                      {segment.rules.length} rules
                    </Badge>
                  </h5>
                </div>

                <div className="segment-content p-3">
                  <Row>
                    <Col md={4} className="mb-3">
                      <Card className="quick-overview h-100">
                        <Card.Header className="bg-info text-white">
                          <h6 className="mb-0">
                            <Info size={16} className="me-2" />
                            Quick Overview
                          </h6>
                        </Card.Header>
                        <Card.Body className="p-3">
                          <div className="overview-item mb-2">
                            <XCircle size={14} className="me-2 text-danger" />
                            <small>Cancellation fees apply</small>
                          </div>
                          <div className="overview-item mb-2">
                            <RefreshCw size={14} className="me-2 text-warning" />
                            <small>Changes permitted with fees</small>
                          </div>
                          <div className="overview-item mb-2">
                            <DollarSign size={14} className="me-2 text-success" />
                            <small>Refunds available</small>
                          </div>
                          <div className="overview-item">
                            <Users size={14} className="me-2 text-info" />
                            <small>Child discounts available</small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={8}>
                      <Accordion defaultActiveKey="0" className="fare-accordion">
                        {segment.rules.map((rule, ruleIndex) => (
                          <Accordion.Item key={ruleIndex} eventKey={ruleIndex.toString()}>
                            <Accordion.Header className="d-flex align-items-center">
                              {getCategoryIcon(rule.category)}
                              <span className="ms-2 fw-semibold">{rule.category}</span>
                            </Accordion.Header>
                            <Accordion.Body className="fare-rule-body">
                              {formatRuleText(rule.text)}
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    </Col>
                  </Row>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="info" className="text-center py-4">
            <Info size={48} className="mb-3 text-info" />
            <h5>No fare rules available</h5>
            <p className="mb-3">Fare rules could not be loaded for this flight.</p>
            <Button variant="primary" onClick={fetchFareRules}>
              <RefreshCw size={16} className="me-2" />
              Try Loading Again
            </Button>
          </Alert>
        )}

        <div className="mt-4 p-3 bg-light rounded">
          <div className="d-flex align-items-start">
            <AlertCircle size={20} className="text-warning me-3 mt-1" />
            <div>
              <strong className="text-dark">Important Note:</strong>
              <p className="mb-0 text-muted small">
                Fare rules are subject to airline policies and may change without notice.
                Always verify current rules with the airline before making changes to your booking.
                These rules are for informational purposes only.
              </p>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FareRulesModal;
