import ApiService from "./ApiService";

const services = {
  apiService: new ApiService(process.env.REACT_APP_API_BASE_URL)
}

export default services
