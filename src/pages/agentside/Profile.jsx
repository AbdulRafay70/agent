import React, { useEffect, useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import axios from "axios";
import jwtDecode from "../../utils/jwtDecode";
import { toast, ToastContainer } from "react-toastify";

const ProfileShimmer = () => {
  return (
    <div className=" rounded-4 p-3 mb-3 mt-5">
      <div className="row justify-content-center mb-5">
        <div className="col-md-8">
          <div className="card-body">
            <div className="text-center mt-5 mb-4">
              <div
                className="shimmer-line mx-auto mb-4"
                style={{
                  height: "40px",
                  width: "200px",
                  borderRadius: "8px",
                  backgroundColor: "#f0f0f0",
                }}
              ></div>
            </div>

            <div className="profile-content">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="row mb-3 align-items-center">
                  <div className="col-md-4">
                    <div
                      className="shimmer-line mb-2"
                      style={{
                        height: "20px",
                        width: "80%",
                        borderRadius: "4px",
                        backgroundColor: "#f0f0f0",
                      }}
                    ></div>
                  </div>
                  <div className="col-md-8">
                    <div
                      className="shimmer-line"
                      style={{
                        height: "38px",
                        width: "100%",
                        borderRadius: "4px",
                        backgroundColor: "#f0f0f0",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const [profileData, setProfileData] = useState({
    travelAgencyName: "",
    agentName: "",
    email: "",
    contactNo: "",
    address: "",
    branch: 0,
    logo: null,
    agencyType: "", // NEW: Area Agency or Full Agency
  });

  const [flightIssueData, setFlightIssueData] = useState({
    daysBeforeIssue: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);
  const [availableAgencies, setAvailableAgencies] = useState([]);
  const [agencyId, setAgencyId] = useState(null);

  // New state for employee details
  const [employeeDetails, setEmployeeDetails] = useState({
    branchName: "",
    branchCode: "",
    organizationName: "",
    organizationCode: "",
    userName: "",
    userEmail: "",
  });

  // NEW: State for agent's organizational hierarchy
  const [agentHierarchy, setAgentHierarchy] = useState({
    agencyName: "",
    agencyCode: "",
    agencyType: "",
    branchName: "",
    branchCode: "",
    organizationName: "",
    organizationCode: "",
  });

  const isInitialLoad = React.useRef(true);

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0];
  };
  const orgId = getOrgId();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const decoded = jwtDecode(token);
        const userId = decoded.user_id || decoded.id;
        localStorage.setItem("userId", JSON.stringify(userId));

        // Step 1: Get current user
        const userRes = await axios.get(
          `http://127.0.0.1:8000/api/users/${userId}/?organization=${orgId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const userData = userRes.data;
        const currentUserType = userData.profile?.type;
        setUserType(currentUserType);

        // Step 2: If employee, fetch all agencies for their branch
        if (currentUserType === "employee") {
          const branchId = userData.branch_details?.[0]?.id;
          const branchName = userData.branch_details?.[0]?.name || "";
          const branchCode = userData.branch_details?.[0]?.branch_code || "";
          const organizationName = userData.organization_details?.[0]?.name || "";
          const organizationCode = userData.organization_details?.[0]?.org_code || "";

          // Set employee details
          setEmployeeDetails({
            branchName,
            branchCode,
            organizationName,
            organizationCode,
            userName: `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
            userEmail: userData.email || "",
          });

          // Clear any existing agency data from localStorage for employees
          localStorage.removeItem("agencyId");
          localStorage.removeItem("agencyName");
          localStorage.removeItem("selectedAgencyId");

          // Employees don't need agency data - they work independently
          // Do NOT set selectedAgencyId or agencyId for employees
        } else if (currentUserType === "subagent") {
          // For branch users (subagents), fetch all agencies for their branch
          const branchId = userData.branch_details?.[0]?.id;
          if (branchId) {
            const agenciesRes = await axios.get(
              `http://127.0.0.1:8000/api/agencies/?organization=${orgId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            // Filter agencies by branch
            const branchAgencies = agenciesRes.data.filter(
              (agency) => agency.branch === branchId
            );
            setAvailableAgencies(branchAgencies);

            // Set first agency as default if not already selected
            if (branchAgencies.length > 0) {
              setSelectedAgencyId(branchAgencies[0].id);
              setAgencyId(branchAgencies[0].id);
            }
          }
        } else {
          // For agents, get their agency from user data
          const agency = userData.agency_details?.[0];
          if (!agency) {
            throw new Error("No agency associated with this user.");
          }
          setAgencyId(agency.id);
          setSelectedAgencyId(agency.id);
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch profile data");
        setLoading(false);
        console.error("Error fetching profile data:", err);
      }
    };

    fetchProfileData();
  }, []);

  // Fetch agency details when selected agency changes
  useEffect(() => {
    // Skip agency fetch for employees - they don't have agencies
    if (userType === "employee") return;
    if (!selectedAgencyId) return;

    const fetchAgencyDetails = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const agencyRes = await axios.get(
          `http://127.0.0.1:8000/api/agencies/${selectedAgencyId}/?organization=${orgId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const agencyData = agencyRes.data;
        localStorage.setItem("agencyId", String(agencyData.id));
        localStorage.setItem("agencyName", String(agencyData.ageny_name));
        if (agencyData.branch) {
          localStorage.setItem("branchId", String(agencyData.branch));
        }

        // Update agentOrganization with the selected agency_id
        const agentOrg = localStorage.getItem("agentOrganization");
        if (agentOrg) {
          const orgData = JSON.parse(agentOrg);
          orgData.agency_id = agencyData.id;
          localStorage.setItem("agentOrganization", JSON.stringify(orgData));
        }

        // Set profile data
        setProfileData({
          travelAgencyName: agencyData.ageny_name || "",
          agentName: agencyData.name || "",
          email: agencyData.email || "",
          contactNo: agencyData.phone_number || "",
          address: agencyData.address || "",
          branch: agencyData.branch,
          agencyType: agencyData.agency_type || "", // NEW: Set agency type
          logo:
            agencyData.files && agencyData.files.length > 0
              ? agencyData.files[0].file
              : null,
        });

        // NEW: Fetch branch and organization details for hierarchy display
        if (agencyData.branch) {
          try {
            const branchRes = await axios.get(
              `http://127.0.0.1:8000/api/branches/${agencyData.branch}/`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const branchData = branchRes.data;

            setAgentHierarchy({
              agencyName: agencyData.ageny_name || "",
              agencyCode: agencyData.agency_code || "",
              agencyType: agencyData.agency_type || "",
              branchName: branchData.name || "",
              branchCode: branchData.branch_code || "",
              organizationName: branchData.organization_name || "",
              organizationCode: "", // Will be fetched if needed
            });
          } catch (err) {
            console.error("Error fetching branch details:", err);
          }
        }

        // If contacts exist, overwrite agent fields
        if (agencyData.contacts && agencyData.contacts.length > 0) {
          const contact = agencyData.contacts[0];
          setProfileData((prev) => ({
            ...prev,
            contactNo: contact.phone_number || prev.contactNo,
            email: contact.email || prev.email,
            agentName: contact.name || prev.agentName,
          }));
        }
      } catch (err) {
        console.error("Error fetching agency details:", err);
      }
    };

    fetchAgencyDetails();
  }, [selectedAgencyId]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFlightIssueChange = (e) => {
    setFlightIssueData({
      daysBeforeIssue: e.target.value,
    });
  };

  const handleProfileSave = async () => {
    const { travelAgencyName, agentName, email } = profileData;
    if (!travelAgencyName || !agentName || !email) {
      toast.error("Please fill in all required fields.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    const token = localStorage.getItem("agentAccessToken");

    try {
      const payload = {
        name: agentName,
        ageny_name: travelAgencyName,
        email: email,
        phone_number: profileData.contactNo,
        address: profileData.address,
        branch: profileData.branch,
        organization: orgId,
      };

      const response = await axios.put(
        `http://127.0.0.1:8000/api/agencies/${agencyId}/?organization=${orgId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Profile saved successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
      console.log("Profile data saved:", response.data);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to save profile. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleFlightIssueSave = () => {
    if (!flightIssueData.daysBeforeIssue) {
      toast.error("Please enter how many days before to issue ticket.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    console.log("Flight issue data saved:", flightIssueData);
    toast.success("Flight issue settings saved successfully!", {
      position: "top-center",
      autoClose: 3000,
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("agentAccessToken");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_type", "logo");
      formData.append("description", "Agency logo");

      const response = await axios.post(
        `http://127.0.0.1:8000/api/agencies/${agencyId}/files/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          },
        }
      );

      setProfileData((prev) => ({
        ...prev,
        logo: response.data.file,
      }));

      toast.success("Logo uploaded successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error uploading logo:", err);
      toast.error("Failed to upload logo. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  if (loading) {
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
              <ProfileShimmer />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row">
          <div className="col-lg-2">
            <AgentSidebar />
          </div>
          <div className="col-lg-10">
            <div className="container">
              <AgentHeader />
              <div className="text-center py-5 text-danger">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
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
              {/* Profile Section */}
              <div className="row justify-content-center mb-5">
                <div className="col-md-8">
                  <div className="">
                    <div className="card-body">
                      <h2 className="text-center mb-4 mt-5">Profile Page</h2>


                      {/* NEW: Agent Organizational Hierarchy Section - Using Public Profile UI Style */}
                      {userType !== "employee" && agentHierarchy.agencyName && (
                        <div className="row mb-4">
                          <div className="col-md-12">
                            <div className="profile-card" style={{
                              background: "white",
                              borderRadius: "20px",
                              padding: "2rem",
                              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)"
                            }}>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                                marginBottom: "1.5rem",
                                paddingBottom: "1rem",
                                borderBottom: "2px solid #e2e8f0"
                              }}>
                                <div style={{
                                  width: "45px",
                                  height: "45px",
                                  borderRadius: "12px",
                                  background: "linear-gradient(135deg, #1B78CE 0%, #1557a0 100%)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  boxShadow: "0 4px 15px rgba(27, 120, 206, 0.3)"
                                }}>
                                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                                  </svg>
                                </div>
                                <h5 style={{
                                  fontSize: "1.5rem",
                                  fontWeight: "700",
                                  color: "#2d3748",
                                  margin: 0,
                                  flex: 1
                                }}>{userType === "employee" ? "Employee Hierarchy" : "Organizational Hierarchy"}</h5>
                              </div>

                              <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: "1.5rem"
                              }}>
                                {/* Employee/Agency Info */}
                                <div style={{
                                  background: "#f7fafc",
                                  padding: "1.25rem",
                                  borderLeft: "4px solid #1B78CE",
                                  borderRadius: "4px"
                                }}>
                                  <div style={{
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: "#718096",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: "0.5rem"
                                  }}>{userType === "employee" ? "Employee" : "Agency"}</div>
                                  <div style={{
                                    fontSize: "1.05rem",
                                    color: "#2d3748",
                                    fontWeight: "500"
                                  }}>
                                    {userType === "employee" ? employeeDetails.userName : agentHierarchy.agencyName}
                                    {userType !== "employee" && agentHierarchy.agencyCode && (
                                      <span style={{ color: "#718096", fontSize: "0.9rem" }}>
                                        {" "}({agentHierarchy.agencyCode})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Agency Type - Only show for non-employees */}
                                {userType !== "employee" && (
                                  <div style={{
                                    background: "#f7fafc",
                                    padding: "1.25rem",
                                    borderLeft: "4px solid #10B981",
                                    borderRadius: "4px"
                                  }}>
                                    <div style={{
                                      fontSize: "0.85rem",
                                      fontWeight: "600",
                                      color: "#718096",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "0.5rem"
                                    }}>Agency Type</div>
                                    <div style={{
                                      fontSize: "1.05rem",
                                      color: "#2d3748",
                                      fontWeight: "500"
                                    }}>
                                      <span style={{
                                        background: agentHierarchy.agencyType === "Area Agency" ? "#DBEAFE" : "#FEF3C7",
                                        color: agentHierarchy.agencyType === "Area Agency" ? "#1E40AF" : "#92400E",
                                        padding: "0.25rem 0.75rem",
                                        borderRadius: "9999px",
                                        fontSize: "0.875rem",
                                        fontWeight: "600"
                                      }}>
                                        {agentHierarchy.agencyType || "Not Set"}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Branch Info */}
                                <div style={{
                                  background: "#f7fafc",
                                  padding: "1.25rem",
                                  borderLeft: "4px solid #F59E0B",
                                  borderRadius: "4px"
                                }}>
                                  <div style={{
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: "#718096",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: "0.5rem"
                                  }}>Branch</div>
                                  <div style={{
                                    fontSize: "1.05rem",
                                    color: "#2d3748",
                                    fontWeight: "500"
                                  }}>
                                    {userType === "employee" ? employeeDetails.branchName : agentHierarchy.branchName || "N/A"}
                                    {userType === "employee" && employeeDetails.branchCode && (
                                      <span style={{ color: "#718096", fontSize: "0.9rem" }}>
                                        {" "}({employeeDetails.branchCode})
                                      </span>
                                    )}
                                    {userType !== "employee" && agentHierarchy.branchCode && (
                                      <span style={{ color: "#718096", fontSize: "0.9rem" }}>
                                        {" "}({agentHierarchy.branchCode})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Organization Info */}
                                <div style={{
                                  background: "#f7fafc",
                                  padding: "1.25rem",
                                  borderLeft: "4px solid #8B5CF6",
                                  borderRadius: "4px"
                                }}>
                                  <div style={{
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: "#718096",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: "0.5rem"
                                  }}>Organization</div>
                                  <div style={{
                                    fontSize: "1.05rem",
                                    color: "#2d3748",
                                    fontWeight: "500"
                                  }}>
                                    {userType === "employee" ? employeeDetails.organizationName : agentHierarchy.organizationName || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Employee Details Section */}
                      {userType === "employee" && (
                        <div className="row mb-4">
                          <div className="col-md-12">
                            <div className="card border-primary">
                              <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">Employee Details</h5>
                              </div>
                              <div className="card-body">
                                <div className="row mb-3">
                                  <div className="col-md-6">
                                    <label className="fw-bold">Name:</label>
                                    <p className="mb-0">{employeeDetails.userName || "N/A"}</p>
                                  </div>
                                  <div className="col-md-6">
                                    <label className="fw-bold">Email:</label>
                                    <p className="mb-0">{employeeDetails.userEmail || "N/A"}</p>
                                  </div>
                                </div>
                                <div className="row mb-3">
                                  <div className="col-md-6">
                                    <label className="fw-bold">Organization:</label>
                                    <p className="mb-0">
                                      {employeeDetails.organizationName || "N/A"}
                                      {employeeDetails.organizationCode && ` (${employeeDetails.organizationCode})`}
                                    </p>
                                  </div>
                                  <div className="col-md-6">
                                    <label className="fw-bold">Branch:</label>
                                    <p className="mb-0">
                                      {employeeDetails.branchName || "N/A"}
                                      {employeeDetails.branchCode && ` (${employeeDetails.branchCode})`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Agent/Employee Information Section */}
                      <div className="row mb-4">
                        <div className="col-md-12">
                          <div style={{ background: "white", borderRadius: "20px", padding: "2rem", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "2px solid #e2e8f0" }}>
                              <div style={{ width: "45px", height: "45px", borderRadius: "12px", background: "linear-gradient(135deg, #1B78CE 0%, #1557a0 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 15px rgba(27, 120, 206, 0.3)" }}>
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                              </div>
                              <h5 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2d3748", margin: 0, flex: 1 }}>
                                {userType === "employee" ? "Employee Information" : "Agent Information"}
                              </h5>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                              {userType === "employee" ? (
                                <>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Employee Name</div>
                                    <div style={{ fontSize: "1.05rem", color: "#2d3748", fontWeight: "500" }}>{employeeDetails.userName || "N/A"}</div>
                                  </div>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Email</div>
                                    <div style={{ fontSize: "1.05rem", color: "#2d3748", fontWeight: "500" }}>{employeeDetails.userEmail || "N/A"}</div>
                                  </div>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Organization</div>
                                    <div style={{ fontSize: "1.05rem", color: "#2d3748", fontWeight: "500" }}>
                                      {employeeDetails.organizationName || "N/A"}
                                      {employeeDetails.organizationCode && ` (${employeeDetails.organizationCode})`}
                                    </div>
                                  </div>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Branch</div>
                                    <div style={{ fontSize: "1.05rem", color: "#2d3748", fontWeight: "500" }}>
                                      {employeeDetails.branchName || "N/A"}
                                      {employeeDetails.branchCode && ` (${employeeDetails.branchCode})`}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Travel Agency Name</div>
                                    <div style={{ fontSize: "1.05rem", color: "#2d3748", fontWeight: "500" }}>{profileData.travelAgencyName || "N/A"}</div>
                                  </div>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Agent Name</div>
                                    <div style={{ fontSize: "1.05rem", color: "#2d3748", fontWeight: "500" }}>{profileData.agentName || "N/A"}</div>
                                  </div>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Email</div>
                                    <div style={{ fontSize: "1.05rem", color: "#2d3748", fontWeight: "500" }}>{profileData.email || "N/A"}</div>
                                  </div>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Contact No</div>
                                    <div style={{ fontSize: "1.05rem", color: "#2d3748", fontWeight: "500" }}>{profileData.contactNo || "N/A"}</div>
                                  </div>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Address</div>
                                    <div style={{ fontSize: "1.05rem", color: "#2d3748", fontWeight: "500" }}>{profileData.address || "N/A"}</div>
                                  </div>
                                  <div style={{ background: "#f7fafc", padding: "1.25rem", borderLeft: "4px solid #1B78CE", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Logo</div>
                                    <div>{profileData.logo ? (<img src={typeof profileData.logo === "string" ? `http://127.0.0.1:8000/${profileData.logo}` : URL.createObjectURL(profileData.logo)} alt="Agency Logo" style={{ maxHeight: "60px", maxWidth: "100%", objectFit: "contain", borderRadius: "8px" }} />) : (<span style={{ fontSize: "0.9rem", color: "#9CA3AF", fontStyle: "italic" }}>No logo uploaded</span>)}</div>
                                  </div>
                                </>
                              )}
                            </div>
                            {userType !== "employee" && (
                              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                                <input type="file" className="d-none" id="logoUpload" accept="image/*" onChange={handleLogoUpload} />
                                <label htmlFor="logoUpload" className="btn btn-primary" style={{ padding: "12px 28px", borderRadius: "12px", fontWeight: "600", background: "linear-gradient(135deg, #1B78CE 0%, #1557a0 100%)", border: "none" }}>
                                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: "8px", verticalAlign: "middle" }}><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" /></svg>
                                  Upload Logo
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Umrah Flight Issue Section */}
              <div className="row justify-content-center">
                <div className="col-md-6">
                  <div className="">
                    <div className="card-body">
                      <h2 className="text-center mb-4">Umrah Flight Issue</h2>
                      <div className="text-center mb-4">
                        <p className="text-muted mb-3">
                          How many days before to issue ticket immediately?
                        </p>

                        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                          <input
                            type="number"
                            className="form-control text-center"
                            style={{ width: "150px" }}
                            value={flightIssueData.daysBeforeIssue}
                            onChange={handleFlightIssueChange}
                            placeholder="Type in days"
                          />
                          <button
                            id="btn" className="btn"
                            onClick={handleFlightIssueSave}
                          >
                            Save
                          </button>
                        </div>

                        <div className="text-center">
                          <p className="text-muted small mb-0">
                            1. If travel date is{" "}
                            <span className="text-danger fw-bold">
                              {flightIssueData.daysBeforeIssue === ""
                                ? "12"
                                : flightIssueData.daysBeforeIssue}{" "}
                              days ago
                            </span>{" "}
                            then issue ticket immediately.
                          </p>
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

export default Profile;
