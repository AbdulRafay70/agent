import axios from "axios";

const api = axios.create({
  baseURL: "https://api.saer.pk",
});

export const getPost = () => {
  return api.get("/branches/");
};

export default api;