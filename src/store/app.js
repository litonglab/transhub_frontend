// Utilities
import {defineStore} from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    task_id: [],
    user_id: '',
    name: '',
    cname: '',
  }),
  getters: {
    get_task_id(state) {
      return state.task_id
    },
    get_user_id(state) {
      return state.user_id
    },
    get_name(state) {
      return state.name
    },
    get_cname(state) {
      return state.cname
    }
  },
  actions:
  {
    set_task_id(task_id) {
      this.task_id = task_id
    },
    set_user_id(user_id) {
      this.user_id = user_id
    },
    set_name(name) {
      this.name = name
    },
    set_cname(cname) {
      this.cname = cname
    }
  },
  persist:true,
}
)
