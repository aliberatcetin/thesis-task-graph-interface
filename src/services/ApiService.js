import { HttpService } from "./HttpAdapter";

export default class ApiService extends HttpService {
  constructor(reportApiUrl) {
    super(reportApiUrl);
    this.fetchHistories = this.fetchGraph.bind(this);
    this.fetchHistories = this.fetchHistories.bind(this);
  }

  async fetchGraph() {
    try {
      const response = await this
        .getAdapter()
        .get(`/graph`);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  async fetchHistories() {
    try {
      const response = await this
        .getAdapter()
        .get(`history`);
      return response.data;
    } catch (error) {
      console.error(error);
      //throw new Error(error.response.data.errorDetail[0].message);
    }
  }

  async createNode(node) {
    try {
      const response = await this
        .getAdapter()
        .post(`/graph`, node);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async runNode(node) {
    try {
      const response = await this
          .getAdapter()
          .post(`/graph/run`, node);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async runNodeBulk() {
    try {
      const response = await this
          .getAdapter()
          .get(`/graph/run/bulk`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async clearAll() {
    try {
      const response = await this
          .getAdapter()
          .get(`/graph/clearall`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async terminate() {
    try {
      const response = await this
          .getAdapter()
          .get(`/graph/terminate`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async updateNode(node) {
    try {
      const response = await this
          .getAdapter()
          .put(`/graph`, node);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async deleteNode(id) {
    try {
      const response = await this
          .getAdapter()
          .delete(`/graph/${id}`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async detachRelation(target, source) {
    try {
      const response = await this
          .getAdapter()
          .delete(`graph/${target}/${source}`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async isTherePath(target,source){
    try {
      const response = await this
          .getAdapter()
          .get(`graph/${target}/${source}`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }




}

