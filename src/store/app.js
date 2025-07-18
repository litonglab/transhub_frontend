// Utilities
import {defineStore} from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    name: "",
    role: "",
  }),
  getters: {
    get_name(state) {
      return state.name;
    },
    get_role(state) {
      return state.role;
    },
    is_admin(state) {
      return state.role === "admin" || state.role === "super_admin";
    },
    is_super_admin(state) {
      return state.role === "super_admin";
    },
  },
  actions: {
    set_name(name) {
      this.name = name;
    },
    set_role(role) {
      this.role = role;
    },
    clear_user_info() {
      this.name = "";
      this.role = "";
    },
  },
  persist: true,
});
