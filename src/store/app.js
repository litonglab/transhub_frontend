// Utilities
import {defineStore} from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    name: '',
  }),
  getters: {
    get_name(state) {
      return state.name
    },
  },
  actions:
  {
    set_name(name) {
      this.name = name
    },
  },
  persist:true,
}
)
