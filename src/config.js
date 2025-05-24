const hostname='http://10.77.70.150:54321'
export const APIS = {
    
    // user
    login: hostname + '/user_login',
    login_out: hostname + '/user_logout',    
    register: hostname + '/user_register',
    changepwd: hostname + '/user_change_password',
    paticipate: hostname + '/user_paticipate_competition',
    get_info: hostname + '/user_get_real_info',
    set_info: hostname + '/user_set_real_info',

    //task
    upload: hostname + '/task_upload',
    get_task_info: hostname + '/task_get_task_info',
    
    //histoty
    get_history_records: hostname + '/history_get_history_records',
    get_history_record_detail: hostname + '/history_get_history_record_detail',

    // help
    //get_cca_guide: hostname + '/help_get_cca_guide',
    get_tutorial: hostname + '/help_get_tutorial',
    get_pantheon: hostname + '/help_get_pantheon',

    //summary
    get_ranks: hostname + '/summary_get_ranks',

    //graph
    get_graph: hostname + '/graph_get_graph',

    //source_code
    get_code: hostname + '/src_get_code',
    
    
    

}