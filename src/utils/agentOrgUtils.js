/**
 * Utility functions to read agent organization data from localStorage
 * The agentOrganization is stored as: {"ids":[11],"user_id":52,"agency_id":41,"branch_id":46}
 */

/**
 * Get the organization ID from agentOrganization localStorage
 * @returns {number|null} Organization ID or null
 */
export const getOrgId = () => {
  const agentOrg = localStorage.getItem("agentOrganization");
  if (!agentOrg) return null;
  try {
    const orgData = JSON.parse(agentOrg);
    return orgData.ids && orgData.ids[0] ? orgData.ids[0] : null;
  } catch (e) {
    console.error('Error parsing agentOrganization:', e);
    return null;
  }
};

/**
 * Get the user ID from agentOrganization localStorage
 * @returns {number|null} User ID or null
 */
export const getUserId = () => {
  const agentOrg = localStorage.getItem("agentOrganization");
  if (!agentOrg) return null;
  try {
    const orgData = JSON.parse(agentOrg);
    return orgData.user_id || null;
  } catch (e) {
    console.error('Error parsing agentOrganization:', e);
    return null;
  }
};

/**
 * Get the agency ID from agentOrganization localStorage
 * @returns {number|null} Agency ID or null
 */
export const getAgencyId = () => {
  const agentOrg = localStorage.getItem("agentOrganization");
  if (!agentOrg) return null;
  try {
    const orgData = JSON.parse(agentOrg);
    return orgData.agency_id || null;
  } catch (e) {
    console.error('Error parsing agentOrganization:', e);
    return null;
  }
};

/**
 * Get the branch ID from agentOrganization localStorage
 * @returns {number|null} Branch ID or null
 */
export const getBranchId = () => {
  const agentOrg = localStorage.getItem("agentOrganization");
  if (!agentOrg) return null;
  try {
    const orgData = JSON.parse(agentOrg);
    return orgData.branch_id || null;
  } catch (e) {
    console.error('Error parsing agentOrganization:', e);
    return null;
  }
};

/**
 * Get all agent organization data at once
 * @returns {object|null} {orgId, userId, agencyId, branchId} or null
 */
export const getAgentOrgData = () => {
  const agentOrg = localStorage.getItem("agentOrganization");
  if (!agentOrg) return null;
  try {
    const orgData = JSON.parse(agentOrg);
    return {
      orgId: orgData.ids && orgData.ids[0] ? orgData.ids[0] : null,
      userId: orgData.user_id || null,
      agencyId: orgData.agency_id || null,
      branchId: orgData.branch_id || null
    };
  } catch (e) {
    console.error('Error parsing agentOrganization:', e);
    return null;
  }
};
