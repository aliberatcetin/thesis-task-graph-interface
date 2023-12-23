import axios from "axios"

export class HttpService {

  constructor(baseURL) {
    this.getAdapter = this.getAdapter.bind(this)
    this.__create = this.__create.bind(this)
    this.adapter = this.__create(baseURL)
  }

  getAdapter() {
    return this.adapter
  }

  __create(baseURL) {
    const adapter = axios.create({ baseURL })
    adapter.interceptors.request.use(function(config) {
      return config
    })
    return adapter
  }

  serialize = function(obj) {
    let str = [];
    for (let p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }
}
