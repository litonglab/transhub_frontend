const hostname = import.meta.env.VITE_APP_API_HOST
export const APIS = {

  // user
  login: hostname + '/user_login',
  logout: hostname + '/user_logout',
  register: hostname + '/user_register',
  changepwd: hostname + '/user_change_password',
  get_info: hostname + '/user_get_real_info',
  set_info: hostname + '/user_set_real_info',
  check_login: hostname + '/user_check_login',

  //task
  upload: hostname + '/task_upload',

  //history
  get_history_records: hostname + '/history_get_history_records',
  get_history_record_detail: hostname + '/history_get_history_record_detail',

  // help
  //get_cca_guide: hostname + '/help_get_cca_guide',
  get_tutorial: hostname + '/help_get_tutorial',
  get_pantheon: hostname + '/help_get_pantheon',
  get_competition_time: hostname + '/help_get_competition_time',

  //summary
  get_ranks: hostname + '/summary_get_ranks',

  //graph
  get_graph: hostname + '/graph_get_graph',

  //source_code
  get_code: hostname + '/src_get_code',


}
