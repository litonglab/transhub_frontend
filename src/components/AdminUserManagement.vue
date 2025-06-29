<template>
  <v-card-title>
    <v-row align="center">
      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="searchKeyword"
          label="搜索用户 (用户名、姓名、学号)"
          prepend-inner-icon="mdi-magnify"
          @input="debouncedSearch"
          clearable
          density="compact"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="cnameFilter"
          label="课程筛选"
          :items="pantheons"
          @update:model-value="searchUsers"
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
          clearable
          density="compact"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="4" md="2">
        <v-select
          v-model="activeFilter"
          label="锁定状态"
          :items="activeOptions"
          @update:model-value="searchUsers"
          clearable
          density="compact"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="4" md="2">
        <v-select
          v-model="deletedFilter"
          label="删除状态"
          :items="deletedOptions"
          @update:model-value="searchUsers"
          clearable
          density="compact"
        ></v-select>
      </v-col>
    </v-row>
  </v-card-title>

  <v-card-text>
    <v-data-table-server
      :headers="headers"
      :items="users"
      :loading="loading"
      :items-length="pagination.total"
      v-model:page="pagination.page"
      v-model:items-per-page="pagination.size"
      :items-per-page-options="[10, 20, 50, 100]"
      @update:options="loadUsers"
      show-current-page
    >
      <template v-slot:header.actions>
        <div
          class="d-flex justify-space-between align-center"
          style="width: 100%"
        >
          <span>操作</span>
          <v-btn
            icon="mdi-refresh"
            size="small"
            variant="text"
            @click="refreshUsers"
            title="刷新"
          ></v-btn>
        </div>
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

      <template v-slot:item.deleted_at="{ item }">
        <v-chip
          :color="item.deleted_at ? 'secondary' : 'grey'"
          size="small"
          variant="elevated"
        >
          {{ item.deleted_at ? `已删除` : "未删除" }}
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <template v-if="!item.deleted_at">
          <v-btn
            icon="mdi-pencil"
            size="small"
            @click="editUser(item)"
            variant="text"
            class="mr-1"
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
  </v-card-text>

  <!-- 编辑用户对话框 -->
  <v-dialog v-model="editDialog" max-width="500px">
    <v-card>
      <v-card-title>编辑用户</v-card-title>
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
            :items="editableRoleOptions"
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
        </v-btn
        >
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
        </v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {onMounted, reactive, ref} from "vue";
import {useAppStore} from "@/store/app";
import {APIS} from "@/config";
import {request} from "@/utility.js";
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
  {title: "用户名", key: "username", sortable: false},
  {title: "真实姓名", key: "real_name", sortable: false},
  {title: "学号", key: "sno", sortable: false},
  {title: "角色", key: "role", sortable: false},
  {title: "已选课程", key: "enrolled_courses", sortable: false},
  {title: "锁定状态", key: "is_locked", sortable: false},
  {title: "删除状态", key: "deleted_at", sortable: false},
  {title: "操作", key: "actions", sortable: false, align: "center"},
];

const roleOptions = [
  {title: "学生", value: "student"},
  {title: "管理员", value: "admin"},
  {title: "超级管理员", value: "super_admin"},
];

const editableRoleOptions = [
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

const getRoleColor = (role) => {
  switch (role) {
    case "super_admin":
      return "purple";
    case "admin":
      return "primary";
    default:
      return "grey";
  }
};

const getRoleText = (role) => {
  switch (role) {
    case "super_admin":
      return "超级管理员";
    case "admin":
      return "管理员";
    default:
      return "学生";
  }
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

    const result = await request(`${APIS.admin_get_users}?${params}`, {
      method: "GET",
    });

    if (result.data) {
      console.log("用户管理 - 后端返回数据:", result.data); // 调试信息
      users.value = result.data.users || [];

      // 根据后端实际返回的结构修复分页信息
      // 后端返回: { pagination: { page: 1, pages: 28, size: 20, total: 544 }, users: [...] }
      console.log("用户管理 - 修改前 pagination.total:", pagination.total);

      if (
        result.data.pagination &&
        result.data.pagination.total !== undefined
      ) {
        pagination.total = result.data.pagination.total;
        console.log("用户管理 - 分页信息:", result.data.pagination); // 调试信息
        console.log("用户管理 - 设置 pagination.total 为:", pagination.total);
      } else if (result.data.total !== undefined) {
        pagination.total = result.data.total;
        console.log("用户管理 - 分页信息 total:", result.data.total); // 调试信息
      } else {
        pagination.total = users.value.length;
        console.log("用户管理 - 使用数组长度作为total:", users.value.length); // 调试信息
      }

      console.log("用户管理 - 修改后 pagination:", pagination);
    }
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

onMounted(async () => {
  // loadUsers will be called by v-data-table-server's @update:options on mount
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
