import React, { useState, useEffect } from "react";
import { Dropdown, Table, Button, Form, Modal } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { ArrowBigLeft, Funnel, Search, UploadCloudIcon, Download } from "lucide-react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { NavLink } from "react-router-dom";
import axios from "axios";

const AgentPayment = () => {

  const tabs = [
    { name: "Ledger", path: "/payment", isActive: true },
    { name: "Add Deposit", path: "/payment/add-deposit", isActive: false },
    { name: "Bank Accounts", path: "/payment/bank-accounts", isActive: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    agencyCode: '',
    orderNo: '',
    fromDate: '',
    toDate: ''
  });

  // API Integration
  const [transactions, setTransactions] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalUmrah: 0,
    totalTickets: 0,
    totalNights: 0,
    shuttleNights: 0,
    closingBalance: 'PKR 0'
  });
  const [loading, setLoading] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch ledger data from API
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const agentOrg = localStorage.getItem("agentOrganization");
        const agencyId = agentOrg ? JSON.parse(agentOrg).agency_id : null;
        const token = localStorage.getItem("agentAccessToken");

        if (!agencyId || !token) {
          console.error("Missing agency ID or token");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching ledger for agency:", agencyId);

        const response = await axios.get(
          `https://api.saer.pk/api/ledger/agency/${agencyId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("✅ Ledger API Response:", response.data);

        // Transform data
        const transformedTransactions = (response.data.entries || []).map(entry => {
          // Find the agent's line (where account.agency matches the agent's agency)
          const agentLine = entry.lines?.find(line => line.account?.agency === agencyId) || entry.lines?.[0] || {};

          return {
            date: new Date(entry.creation_datetime).toLocaleDateString('en-GB'),
            orderNo: entry.booking_no || entry.reference_no || '-------',
            type: entry.transaction_type || entry.service_type || 'N/A',
            narration: entry.narration || 'No description',
            debit: agentLine.debit > 0 ? `PKR ${agentLine.debit.toLocaleString()}` : '-------',
            credit: agentLine.credit > 0 ? `PKR ${agentLine.credit.toLocaleString()}` : '-------',
            balance: `PKR ${(entry.running_balance || 0).toLocaleString()}`
          };
        }).reverse(); // Reverse to show oldest first

        setTransactions(transformedTransactions);

        // Get closing balance from the last entry's running balance (which is the first after reverse)
        const closingBalance = transformedTransactions.length > 0
          ? transformedTransactions[transformedTransactions.length - 1].balance
          : 'PKR 0';

        const summary = response.data.summary || {};
        setSummaryData({
          totalUmrah: response.data.service_breakdown?.find(s => s.service_type === 'umrah_package')?.count || 0,
          totalTickets: response.data.service_breakdown?.find(s => s.service_type === 'ticket')?.count || 0,
          totalNights: (response.data.entries || []).reduce((sum, e) => sum + (e.hotel_nights || 0), 0),
          shuttleNights: 0,
          closingBalance: closingBalance
        });

      } catch (error) {
        console.error("❌ Error fetching ledger:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, []);

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
              {/* Navigation Tabs */}
              <div className="row ">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  {/* Navigation Tabs */}
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Ledger"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                          }`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>

                  {/* Search Input */}
                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search name, address, job, etc"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>


                <div className=" min-vh-100">
                  <div className="bg-white rounded shadow-sm p-4 mb-4">
                    <h5 className="mb-4">Ledger</h5>

                    {/* Search Form */}
                    <div className="row g-3">
                      <div className="col-md-2">
                        <label htmlFor="" className="Control-label">Order No.</label>
                        <input
                          type="text"
                          className="form-control rounded shadow-none px-1 py-2"
                          name="orderNo"
                          placeholder="Type Order No."
                          value={formData.orderNo}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-2">
                        <label htmlFor="" className="Control-label">From Date</label>

                        <input
                          type="date"
                          className="form-control rounded shadow-none px-1 py-2"
                          name="fromDate"
                          value={formData.fromDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-2">
                        <label htmlFor="" className="Control-label">To Date</label>

                        <input
                          type="date"
                          className="form-control rounded shadow-none px-1 py-2"
                          name="toDate"
                          value={formData.toDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label text-muted small">&nbsp;</label>
                        <button className="btn btn-primary w-100 d-block" style={{ background: "#09559B" }}>
                          Search
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Content */}
                  <div className="bg-white rounded shadow-sm p-4">
                    {/* Ledger Header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="mb-1">
                          Ledger <span className="text-primary fs-6 ms-3 small">Seer.pk</span>
                        </h5>
                        <p className="text-muted small mb-0">
                          12-jun-2023 to 15-april-2024
                        </p>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                          <Download size={14} />
                          Export
                        </button>
                        <button className="btn btn-outline-secondary btn-sm">
                          Add Transaction
                        </button>
                        <button className="btn btn-outline-secondary btn-sm">
                          Edit Transaction
                        </button>
                      </div>
                    </div>

                    {/* Transaction Table */}
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col" className="text-muted small fw-normal">
                              Date
                            </th>
                            <th scope="col" className="text-muted small fw-normal">
                              Reference
                            </th>
                            <th scope="col" className="text-muted small fw-normal">
                              Type
                            </th>
                            <th scope="col" className="text-muted small fw-normal">
                              Narration
                            </th>
                            <th scope="col" className="text-muted small fw-normal">
                              Debit
                            </th>
                            <th scope="col" className="text-muted small fw-normal">
                              Credit
                            </th>
                            <th scope="col" className="text-muted small fw-normal">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction, index) => (
                            <tr key={index}>
                              <td className="small">{transaction.date}</td>
                              <td className="small">{transaction.orderNo}</td>
                              <td className="small">{transaction.type}</td>
                              <td className="small">{transaction.narration}</td>
                              <td className="small">{transaction.debit}</td>
                              <td className="small">{transaction.credit}</td>
                              <td className="small">{transaction.balance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="row mt-4 pt-3 border-top">
                      <div className="col-md-8">
                        <div className="row text-center">
                          <div className="col-3">
                            <div className="text-muted small">Total Umrah</div>
                            <div className="fw-bold">{summaryData.totalUmrah}</div>
                          </div>
                          <div className="col-3">
                            <div className="text-muted small">Total Tickets</div>
                            <div className="fw-bold">{summaryData.totalTickets}</div>
                          </div>
                          <div className="col-3">
                            <div className="text-muted small">Total Nights</div>
                            <div className="fw-bold">{summaryData.totalNights}</div>
                          </div>
                          <div className="col-3">
                            <div className="text-muted small">Shuttle Nights</div>
                            <div className="fw-bold">{summaryData.shuttleNights}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 text-end">
                        <div className="text-muted small">Closing Balance</div>
                        <div className="fw-bold fs-5">
                          {summaryData.closingBalance}
                        </div>
                      </div>
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

export default AgentPayment;