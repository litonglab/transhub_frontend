<template>
  <div class="user-management-container">
    <!-- 筛选区域 -->
    <div class="filter-section" v-if="!isFullScreen">
      <v-card elevation="0" class="pa-4">
        <v-row align="center" dense>
          <v-col
            v-if="isMobile && !showAllFilters"
            cols="12"
            class="d-flex justify-end"
            style="margin-bottom: 0"
          >
            <v-btn
              size="small"
              variant="text"
              @click="showAllFilters = true"
              class="toggle-filter-btn"
            >
              展开筛选
              <v-icon icon="mdi-chevron-down" size="18"/>
            </v-btn>
          </v-col>
          <template v-if="!isMobile || showAllFilters">
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="selectedColumns"
                :items="allColumnOptions"
                label="显示列"
                multiple
                clearable
                density="compact"
              >
                <template v-slot:selection="{ item, index }">
                  <v-chip v-if="index === 0">
                    <span>{{ item.title }}</span>
                  </v-chip>
                  <span v-if="index === 1" class="grey--text text-caption">
                    (+{{ selectedColumns.length - 1 }}...)
                  </span>
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-text-field
                v-model="userIdFilter"
                label="用户ID"
                @input="searchUsers"
                @click:clear="searchUsers"
                clearable
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-text-field
                v-model="searchKeyword"
                label="搜索用户 (用户名、姓名、学号)"
                prepend-inner-icon="mdi-magnify"
                @input="debouncedSearch"
                @click:clear="searchUsers"
                clearable
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="cnameFilter"
                label="课程筛选"
                :items="pantheons"
                @update:model-value="searchUsers"
                @click:clear="searchUsers"
                :loading="coursesLoading"
                clearable
                density="compact"
                no-data-text="没有可用的课程"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="roleFilter"
                label="角色筛选"
                :items="roleOptions"
                @update:model-value="searchUsers"
                @click:clear="searchUsers"
                clearable
                density="compact"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4" md="1">
              <v-select
                v-model="activeFilter"
                label="锁定状态"
                :items="activeOptions"
                @update:model-value="searchUsers"
                @click:clear="searchUsers"
                clearable
                density="compact"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4" md="1">
              <v-select
                v-model="deletedFilter"
                label="删除状态"
                :items="deletedOptions"
                @update:model-value="searchUsers"
                @click:clear="searchUsers"
                clearable
                density="compact"
              ></v-select>
            </v-col>
            <v-col
              v-if="isMobile"
              cols="12"
              class="d-flex justify-end"
              style="margin-bottom: 0"
            >
              <v-btn
                size="small"
                variant="text"
                @click="showAllFilters = false"
                class="toggle-filter-btn"
              >
                收起筛选
                <v-icon icon="mdi-chevron-up" size="18"/>
              </v-btn>
            </v-col>
          </template>
        </v-row>
      </v-card>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <div class="table-actions">
        <v-btn
          :icon="isFullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          size="small"
          variant="text"
          @click="toggleFullScreen"
          :title="isFullScreen ? '退出全屏' : '全屏'"
          style="margin-right: -15px"
        ></v-btn>
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="text"
          @click="refreshUsers"
          title="刷新"
        ></v-btn>
      </div>
      <v-data-table-server
        :headers="computedHeaders"
        :items="users"
        :loading="loading"
        :items-length="pagination.total"
        v-model:page="pagination.page"
        v-model:items-per-page="pagination.size"
        :items-per-page-options="[10, 20, 50, 100]"
        @update:options="loadUsers"
        show-current-page
        :height="'100%'"
        fixed-header
        class="table-container"
      >
        <template v-slot:header.actions>
          <span>操作</span>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            size="small"
            variant="elevated"
          >
            {{ getRoleText(item.role) }}
          </v-chip>
        </template>

        <template v-slot:item.enrolled_courses="{ item }">
          <div v-if="item.enrolled_courses && item.enrolled_courses.length > 0">
            <v-chip
              v-for="course in item.enrolled_courses"
              :key="course"
              size="small"
              class="mr-1 mb-1"
            >
              {{ course }}
            </v-chip>
          </div>
          <span v-else>未加入</span>
        </template>

        <template v-slot:item.is_locked="{ item }">
          <v-chip
            :color="item.is_locked ? 'error' : 'success'"
            size="small"
            variant="elevated"
          >
            {{ item.is_locked ? "已锁定" : "正常" }}
          </v-chip>
        </template>

        <template v-slot:item.is_deleted="{ item }">
          <v-chip
            :color="item.is_deleted ? 'secondary' : 'grey'"
            size="small"
            variant="elevated"
          >
            {{ item.is_deleted ? `已删除` : "未删除" }}
          </v-chip>
        </template>

        <template v-slot:item.created_at="{ item }">
          <span>{{ item.created_at ? formatDateTime(item.created_at) : "-" }}</span>
        </template>
        <template v-slot:item.updated_at="{ item }">
          <span>{{ item.updated_at ? formatDateTime(item.updated_at) : "-" }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <template v-if="!item.is_deleted">
            <div style="min-width: 130px">
              <v-btn
                icon="mdi-pencil"
                size="small"
                @click="editUser(item)"
                variant="text"
                title="编辑"
              ></v-btn>
              <v-btn
                icon="mdi-key-variant"
                size="small"
                @click="resetPasswordUser(item)"
                variant="text"
                color="warning"
                :disabled="item.username === store.name"
                title="重置密码"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                @click="promptDeleteUser(item)"
                variant="text"
                color="error"
                :disabled="item.username === store.name"
                title="删除"
              ></v-btn>
            </div>
          </template>
          <template v-else>
            <v-btn
              icon="mdi-restore"
              size="small"
              @click="promptRestoreUser(item)"
              variant="text"
              color="success"
              title="恢复"
            ></v-btn>
          </template>
        </template>
      </v-data-table-server>
    </div>
  </div>

  <!-- 编辑用户对话框 -->
  <v-dialog v-model="editDialog" max-width="500px">
    <v-card>
      <v-card-title>编辑用户
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-icon
              v-bind="props"
              icon="mdi-information-outline"
              size="16"
              color="grey"
              class="ml-1"
            ></v-icon>
          </template>
          <span>由于用户名与用户数据目录等信息绑定，为避免修改后目录混乱，系统不支持修改用户名等信息，如确需修改，可删除当前账号后重新注册</span>
        </v-tooltip>
      </v-card-title>
      <v-card-text>
        <v-form ref="editFormRef">
          <v-text-field
            label="用户名"
            v-model="editedUser.username"
            readonly
          ></v-text-field>
          <v-text-field
            label="真实姓名"
            v-model="editedUser.real_name"
            readonly
          ></v-text-field>
          <v-text-field
            label="学号"
            v-model="editedUser.sno"
            readonly
          ></v-text-field>
          <v-select
            label="角色"
            v-model="editedUser.role"
            :items="roleOptions"
            :disabled="!store.is_super_admin"
          ></v-select>
          <v-switch
            label="锁定账户"
            v-model="editedUser.is_locked"
            :disabled="editedUser.username === store.name"
            color="error"
          ></v-switch>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="editDialog = false">取消</v-btn>
        <v-btn color="primary" @click="saveUser" :loading="saving">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 重置密码对话框 -->
  <v-dialog v-model="resetPasswordDialog" max-width="400px">
    <v-card>
      <v-card-title>重置密码</v-card-title>
      <v-card-text>
        <v-alert type="info" class="mb-4">
          将要为用户 <strong>{{ selectedUser?.username }}</strong> 重置密码
        </v-alert>
        <v-form ref="resetPasswordFormRef">
          <v-text-field
            label="新密码"
            v-model="newPassword"
            :rules="passwordRules"
            type="password"
            placeholder="留空将使用默认密码 123456"
            clearable
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="resetPasswordDialog = false">取消</v-btn>
        <v-btn
          color="warning"
          @click="confirmResetPassword"
          :loading="resettingPassword"
        >
          重置密码
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 删除用户确认对话框 -->
  <v-dialog v-model="deleteDialog" max-width="400px">
    <v-card>
      <v-card-title class="headline">确认删除</v-card-title>
      <v-card-text>
        确定要删除用户
        <strong>{{ selectedUser?.username }}</strong>
        吗？此操作会将用户移至回收站。
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="deleteDialog = false">取消</v-btn>
        <v-btn color="error" @click="confirmDeleteUser" :loading="saving"
        >确认删除
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 恢复用户确认对话框 -->
  <v-dialog v-model="restoreDialog" max-width="400px">
    <v-card>
      <v-card-title class="headline">确认恢复</v-card-title>
      <v-card-text>
        确定要恢复用户 <strong>{{ selectedUser?.username }}</strong> 吗？
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="restoreDialog = false">取消</v-btn>
        <v-btn color="success" @click="confirmRestoreUser" :loading="saving"
        >确认恢复
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {computed, onMounted, reactive, ref} from "vue";
import {useAppStore} from "@/store/app";
import {APIS} from "@/config";
import {formatDateTime, request} from "@/utility.js";
import {ElMessage} from "element-plus";

// 防抖函数
function debounce(fn, delay = 300) {
  let timeoutId = null;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const store = useAppStore();
const loading = ref(false);
const saving = ref(false);
const resettingPassword = ref(false);
const editDialog = ref(false);
const resetPasswordDialog = ref(false);
const deleteDialog = ref(false);
const restoreDialog = ref(false);
const searchKeyword = ref("");
const roleFilter = ref(null);
const activeFilter = ref(null);
const deletedFilter = ref(false); // 默认只看未删除的
const cnameFilter = ref(null);
const pantheons = ref([]);
const coursesLoading = ref(false);
const newPassword = ref("");
const selectedUser = ref(null);
const userIdFilter = ref("");
const isFullScreen = ref(false);

const users = ref([]);
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const editedUser = ref({
  user_id: "",
  username: "",
  real_name: "",
  sno: "",
  role: "",
  is_locked: false,
});

const headers = [
  {title: "用户ID", key: "user_id", sortable: false, default: true},
  {title: "用户名", key: "username", sortable: false, default: true},
  {title: "真实姓名", key: "real_name", sortable: false, default: true},
  {title: "学号", key: "sno", sortable: false, default: true},
  {title: "角色", key: "role", sortable: false, default: true},
  {title: "已选课程", key: "enrolled_courses", sortable: false, default: true},
  {title: "锁定状态", key: "is_locked", sortable: false, default: true},
  {title: "删除状态", key: "is_deleted", sortable: false, default: true},
  {title: "创建时间", key: "created_at", sortable: true, default: true}, // 支持排序
  {title: "更新时间", key: "updated_at", sortable: true, default: false}, // 支持排序
  {title: "操作", key: "actions", sortable: false, align: "center", default: true,},
];

const allColumnOptions = headers.map((h) => ({title: h.title, value: h.key}));

const selectedColumns = ref(headers.filter((h) => h.default).map((h) => h.key));

const computedHeaders = computed(() => {
  const cols = selectedColumns.value.filter((c) => c !== "actions");
  return [
    ...headers.filter((h) => cols.includes(h.key)),
    ...headers.filter(
      (h) => h.key === "actions" && selectedColumns.value.includes("actions")
    ),
  ];
});

const roleOptions = [
  {title: "学生", value: "student"},
  {title: "管理员", value: "admin"},
  {title: "超级管理员", value: "super_admin"},
];

const activeOptions = [
  {title: "正常", value: true},
  {title: "已锁定", value: false},
];

const deletedOptions = [
  {title: "未删除", value: false},
  {title: "已删除", value: true},
];

const passwordRules = [(v) => !v || v.length >= 6 || "密码至少需要6位字符"];

const roleMap = {
  super_admin: {color: "purple", text: "超级管理员"},
  admin: {color: "primary", text: "管理员"},
  student: {color: "grey", text: "学生"},
};

const getRoleColor = (role) => roleMap[role]?.color || "grey";
const getRoleText = (role) => roleMap[role]?.text || "学生";

const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;
};

const loadUsers = async ({page, itemsPerPage, sortBy}) => {
  loading.value = true;
  pagination.page = page;
  pagination.size = itemsPerPage;

  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      size: pagination.size.toString(),
    });

    if (searchKeyword.value) {
      params.append("keyword", searchKeyword.value);
    }
    if (userIdFilter.value) {
      params.append("user_id", userIdFilter.value);
    }
    if (roleFilter.value) {
      params.append("role", roleFilter.value);
    }
    if (activeFilter.value !== null) {
      params.append("active", activeFilter.value);
    }
    if (deletedFilter.value !== null) {
      params.append("deleted", deletedFilter.value);
    }
    if (cnameFilter.value) {
      params.append("cname", cnameFilter.value);
    }

    if (sortBy && sortBy.length > 0) {
      const sortItem = sortBy[0];
      const sortByMap = {
        created_at: "created_at",
        updated_at: "updated_at",
      };
      if (sortByMap[sortItem.key]) {
        params.append("sort_by", sortByMap[sortItem.key]);
        params.append("sort_order", sortItem.order || "desc");
      }
    }

    const result = await request(`${APIS.admin_get_users}?${params}`, {
      method: "GET",
    });
    users.value = result.data.users || [];
    pagination.total = result.data.pagination.total;
  } catch (error) {
    console.error("加载用户列表失败:", error);
  } finally {
    loading.value = false;
  }
};

const searchUsers = () => {
  pagination.page = 1;
  loadUsers({page: 1, itemsPerPage: pagination.size});
};

const refreshUsers = () => {
  loadUsers({page: pagination.page, itemsPerPage: pagination.size});
};

const debouncedSearch = debounce(searchUsers, 500);

const editUser = (user) => {
  selectedUser.value = user;
  editedUser.value = {...user};
  editDialog.value = true;
};

const saveUser = async () => {
  // 检查是否有更改
  const originalUser = selectedUser.value;
  const currentUser = editedUser.value;
  if (
    originalUser.role === currentUser.role &&
    originalUser.is_locked === currentUser.is_locked
  ) {
    ElMessage.info("没有检测到任何更改");
    editDialog.value = false;
    return;
  }

  saving.value = true;
  try {
    const changes = {};
    if (editedUser.value.role !== selectedUser.value.role) {
      changes.role = editedUser.value.role;
    }
    if (editedUser.value.is_locked !== selectedUser.value.is_locked) {
      changes.is_locked = editedUser.value.is_locked;
    }

    if (Object.keys(changes).length > 0) {
      await request(APIS.admin_update_user, {
        method: "POST",
        body: JSON.stringify({
          user_id: editedUser.value.user_id,
          ...changes,
        }),
      });
      ElMessage.success("用户信息更新成功");
      loadUsers({page: pagination.page, itemsPerPage: pagination.size});
    } else {
      ElMessage.info("没有检测到任何更改");
    }
    editDialog.value = false;
  } catch (error) {
    console.error("更新用户失败:", error);
  } finally {
    saving.value = false;
  }
};

const resetPasswordUser = (user) => {
  selectedUser.value = user;
  newPassword.value = "";
  resetPasswordDialog.value = true;
};

const promptDeleteUser = (user) => {
  selectedUser.value = user;
  deleteDialog.value = true;
};

const confirmDeleteUser = async () => {
  if (!selectedUser.value) return;
  saving.value = true;
  try {
    await request(APIS.admin_delete_user, {
      method: "POST",
      body: JSON.stringify({user_id: selectedUser.value.user_id}),
    });
    ElMessage.success("用户删除成功");
    deleteDialog.value = false;
    loadUsers({page: pagination.page, itemsPerPage: pagination.size});
  } catch (error) {
    console.error("删除用户失败:", error);
  } finally {
    saving.value = false;
  }
};

const promptRestoreUser = (user) => {
  selectedUser.value = user;
  restoreDialog.value = true;
};

const confirmRestoreUser = async () => {
  if (!selectedUser.value) return;
  saving.value = true;
  try {
    await request(APIS.admin_restore_user, {
      method: "POST",
      body: JSON.stringify({user_id: selectedUser.value.user_id}),
    });
    ElMessage.success("用户恢复成功");
    restoreDialog.value = false;
    loadUsers({page: pagination.page, itemsPerPage: pagination.size});
  } catch (error) {
    console.error("恢复用户失败:", error);
  } finally {
    saving.value = false;
  }
};

const confirmResetPassword = async () => {
  if (!selectedUser.value) return;
  resettingPassword.value = true;
  try {
    const requestBody = {
      user_id: selectedUser.value.user_id,
    };

    // 如果设置了新密码，则添加到请求体中
    if (newPassword.value) {
      requestBody.new_password = newPassword.value;
    }

    await request(APIS.admin_reset_password, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    ElMessage.success(`用户 ${selectedUser.value.username} 密码重置成功`);
    resetPasswordDialog.value = false;
    newPassword.value = "";
  } catch (error) {
    console.error("重置密码失败:", error);
  } finally {
    resettingPassword.value = false;
  }
};

const isMobile = ref(false);
const showAllFilters = ref(false);

onMounted(async () => {
  isMobile.value = window.innerWidth <= 960;
  window.addEventListener("resize", () => {
    isMobile.value = window.innerWidth <= 960;
    if (!isMobile.value) showAllFilters.value = false;
  });
  coursesLoading.value = true;
  try {
    const result = await request(APIS.get_pantheon, {
      method: "GET",
    });
    pantheons.value = result["pantheon"] || [];
  } catch (error) {
    pantheons.value = [];
  } finally {
    coursesLoading.value = false;
  }
});
</script>

<style scoped>
.user-management-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.filter-section {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #fafafa;
}

.table-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.table-actions {
  position: absolute;
  top: -8px;
  right: 0;
  z-index: 2000;
}

.table-container {
  height: 100% !important;
}

.table-container :deep(.v-data-table__wrapper) {
  height: calc(100% - 64px) !important;
  overflow-y: auto !important;
}

.table-container :deep(.v-data-table-footer) {
  flex-shrink: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.toggle-filter-btn {
  margin-top: 0;
  margin-bottom: 0;
  min-width: 0;
  font-size: 14px;
  color: #1976d2;
  align-items: center;
  display: inline-flex;
}

@media (max-width: 960px) {
  .filter-section .pa-4 {
    padding: 6px !important;
  }

  .filter-section .v-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .filter-section .v-col {
    margin-bottom: 2px !important;
    padding: 0 1px !important;
  }

  .filter-section .v-text-field,
  .filter-section .v-select {
    font-size: 14px !important;
    min-height: 32px !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .filter-section label {
    font-size: 13px !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .table-container :deep(.v-data-table__wrapper) {
    font-size: 13px !important;
  }

  .table-container :deep(.v-data-table__wrapper tr) {
    height: 32px !important;
  }

  .table-container :deep(.v-data-table__wrapper td),
  .table-container :deep(.v-data-table__wrapper th) {
    padding: 2px 4px !important;
  }
}
</style>
