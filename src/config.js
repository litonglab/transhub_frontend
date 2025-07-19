const hostname = import.meta.env.VITE_APP_API_HOST;
export const APIS = {
  // user
  login: hostname + "/user_login",
  logout: hostname + "/user_logout",
  register: hostname + "/user_register",
  changepwd: hostname + "/user_change_password",
  get_info: hostname + "/user_get_real_info",
  set_info: hostname + "/user_set_real_info",
  check_login: hostname + "/user_check_login",
  get_current_user: hostname + "/user_get_current_user", // 获取当前用户信息（包括角色）

  //task
  upload: hostname + "/task_upload",
  task_get_log: hostname + "/task_get_log",

  //history
  get_history_records: hostname + "/history_get_history_records",
  get_history_record_detail: hostname + "/history_get_history_record_detail",

  // help
  //get_cca_guide: hostname + '/help_get_cca_guide',
  get_tutorial: hostname + "/help_get_tutorial",
  get_tutorial_images: hostname + "/help_get_tutorial_images",
  get_pantheon: hostname + "/help_get_pantheon",
  get_competition_info: hostname + "/help_get_competition_info",
  get_system_info: hostname + "/help_get_system_info",

  //summary
  get_ranks: hostname + "/summary_get_ranks",

  //graph
  get_graph: hostname + "/graph_get_graph",

  //source_code
  get_code: hostname + "/src_get_code",

  // admin
  admin_get_users: hostname + "/admin/users",
  admin_update_user: hostname + "/admin/users/update",
  admin_reset_password: hostname + "/admin/users/reset_password",
  admin_delete_user: hostname + "/admin/users/delete",
  admin_restore_user: hostname + "/admin/users/restore",
  admin_get_tasks: hostname + "/admin/tasks",
  admin_get_stats: hostname + "/admin/stats",
  admin_get_system_info: hostname + "/admin/system/info",
  admin_get_logs: hostname + "/admin/system/logs",
  admin_stream_log: hostname + "/admin/system/logs/stream", // 流式日志接口
  admin_download_log: hostname + "/admin/system/logs/download",

  // dashborad
  dramatiq_dashboard: hostname + "/dramatiq",
};
